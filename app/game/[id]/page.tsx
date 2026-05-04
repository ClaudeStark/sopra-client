"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { Train } from "@/types/train";
import { Button } from "antd";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker } from "maplibre-react-components";
import { MapLayerMouseEvent, MapLayerTouchEvent } from "maplibre-gl";
import RoundOverview from "./RoundOverview";
import LoadingScreen from "./LoadingScreen";
import { latLngToEpsg, epsgToLatLng } from "./coordinateConverter";
import { GameMessage } from "@/types/gameMessage";
import { UserResult } from "@/types/user";

const GamePage: React.FC = () => {
    const router = useRouter();
    const { id: gameId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { subscribe, publish, isConnected } = useWebSocket();

    type GameState =
        | "ROUND_IN_PROGRESS"
        | "LOADING"
        | "BETWEEN_ROUNDS"
        | "GAME_ENDED";

    const [gameState, setGameState] = useState<GameState | null>("LOADING");
    const [currentTime, setCurrentTime] = useState<string>("");
    const [timerActive, setTimerActive] = useState<boolean>(true);
    const [secondsRemaining, setSecondsRemaining] = useState<number>(45);
    const secondsRef = useRef<number>(45);
    const [guessCoords, setGuessCoords] = useState<[number, number] | null>(null);
    const [guessSubmitted, setGuessSubmitted] = useState<boolean>(false);
    const [clickPosition, setClickPosition] = useState<null | [number, number]>(null);
    const [currentTrain, setCurrentTrain] = useState<Train | null>(null);
    const [departureTime, setDepartureTime] = useState<string | null>(null);
    const [arrivalTime, setArrivalTime] = useState<string | null>(null);
    const [currentRound, setCurrentRound] = useState<number | null>(null);
    const [maxRounds, setMaxRounds] = useState<number | null>(null);
    const [results, setResults] = useState<{ currentRound: number; userResults: UserResult[]; train: Train } | null>(null);
    const [stationPins, setStationPins] = useState<[[number, number], [number, number]] | null>(null);
    const [mounted] = useState(typeof window !== "undefined");

    const epochToTime = (epoch: number | null): string => {
        if (!epoch) return "";
        return new Date(epoch).toLocaleTimeString("de-CH", {
            timeZone: "Europe/Zurich",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // ── Guess submission ─────────────────────────────────────────────────────
    const handleSubmitGuess = async () => {
        if (!clickPosition) return;
        const [lon, lat] = clickPosition;
        const [x, y] = latLngToEpsg(lat, lon);
        const payload = {
            lobbyId: Number(gameId),
            userId: user!.userId,
            xCoordinate: x,
            yCoordinate: y,
        };
        console.log("Guess:", payload);
        if (!isConnected) {
            console.warn("WebSocket not connected yet");
            return;
        }
        publish(`/app/game/${gameId}/guess`, payload);
        setGuessCoords([lat, lon]);
        setGuessSubmitted(true);
        console.log("Guess submitted:", payload);
    };

    const gameStateRef = useRef({ clickPosition, guessSubmitted, handleSubmitGuess });
    useEffect(() => {
        gameStateRef.current = { clickPosition, guessSubmitted, handleSubmitGuess };
    }, [clickPosition, guessSubmitted, handleSubmitGuess]);

    // ── Uhrzeit-Interval ────────────────────────────────────────────────────
    useEffect(() => {
        const clock = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(clock);
    }, []);

    // ── Timer-Interval — nur während Runde ──────────────────────────────────
    useEffect(() => {
        if (gameState !== "ROUND_IN_PROGRESS" || !timerActive) return;
        const timer = setInterval(() => {
            secondsRef.current -= 1;
            setSecondsRemaining(secondsRef.current);
            if (secondsRef.current <= 0 && !gameStateRef.current.guessSubmitted) {
                gameStateRef.current.handleSubmitGuess();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, timerActive]);

    // ── WebSocket message handler ────────────────────────────────────────────
    const handleMessage = useCallback((message: GameMessage) => {
        const {
            clickPosition: currentClick,
            guessSubmitted: alreadySubmitted,
            handleSubmitGuess: submitFn,
        } = gameStateRef.current;

        switch (message.type) {
            case "ROUND_START":
                secondsRef.current = 45;
                console.log("Round started:", message);
                setGuessCoords(null);
                setGuessSubmitted(false);
                setClickPosition(null);
                setCurrentTrain(message.payload.train);
                setDepartureTime(epochToTime(message.payload.train.departureTime));
                setArrivalTime(epochToTime(message.payload.train.arrivalTime));
                const origin = message.payload.train.lineOrigin;
                const destination = message.payload.train.lineDestination;
                const originCoords = epsgToLatLng(origin.xCoordinate, origin.yCoordinate);
                const destCoords = epsgToLatLng(destination.xCoordinate, destination.yCoordinate);
                setStationPins([originCoords, destCoords]);
                setCurrentRound(message.payload.roundNumber);
                setMaxRounds(message.payload.maxRounds);
                setGameState("ROUND_IN_PROGRESS");
                setSecondsRemaining(45);
                setTimerActive(true);
                break;

            case "ROUND_END":
                console.log("Round end received");
                if (currentClick && !alreadySubmitted) {
                    console.log("Auto-Submit after ROUND_END");
                    submitFn();
                }
                setTimerActive(false);
                break;

            case "SCORES":
                console.log("Scores updated:", message);
                const userResults = message.payload.userResults.map((result: UserResult) => {
                    const [lat, lng] = epsgToLatLng(result.xCoordinate, result.yCoordinate);
                    return { ...result, xCoordinate: lat, yCoordinate: lng };
                });
                setResults({ ...message.payload, userResults });
                const trainPayload = message.payload.train;
                const [trainLat, trainLon] = epsgToLatLng(trainPayload.currentX, trainPayload.currentY);
                const train = { ...trainPayload, currentX: trainLat, currentY: trainLon };
                setCurrentTrain(train);
                setGameState("BETWEEN_ROUNDS");
                break;
        }
    }, []);

    // ── WebSocket subscribe ──────────────────────────────────────────────────
    const readySent = useRef(false);
    useEffect(() => {
        if (!isConnected) return;

        const subscription = subscribe<GameMessage>(`/topic/game/${gameId}`, (update) => {
            console.log("Received WS message:", update);
            handleMessage(update);
        });

        if (!readySent.current) {
            publish(`/app/game/${gameId}/ready`, {});
            readySent.current = true;
            console.log("Sent initial READY_FOR_NEXT_ROUND message");
        }

        return () => {
            if (subscription) subscription.unsubscribe();
            console.log("Unsubscribed from websockets topic");
        };
    }, [isConnected, subscribe, publish, gameId]);

    // ── Map click handlers ───────────────────────────────────────────────────
    const handleMapClick = (e: MapLayerMouseEvent) => setClickPosition(e.lngLat.toArray());
    const handleMapClickTouch = (e: MapLayerTouchEvent) => setClickPosition(e.lngLat.toArray());

    // ── Render ───────────────────────────────────────────────────────────────
    const train = currentTrain;

    if (gameState === "ROUND_IN_PROGRESS") {
        return (
            <>
                <nav className="navbar navbar--game">
                    <span style={{ marginLeft: "auto" }}>
                        <Button className="btn-ghost-muted" onClick={() => router.push("/lobbies")}>
                            Exit Game
                        </Button>
                    </span>
                </nav>

                <div className="train-bar">
                    <span className="train-bar-line-badge">{train?.line.name ?? "—"}</span>
                    <span className="train-bar-route">
                        From {train?.lineOrigin.stationName}
                        <span className="train-bar-route-arrow"> → </span>
                        To {train?.lineDestination.stationName}
                    </span>
                    <span className="train-bar-times">
                        Dep {departureTime} · Arr {arrivalTime}
                    </span>
                    <div className="train-bar-round">
                        <span>Round {currentRound}/{maxRounds}</span>
                        <span className="train-bar-timer">{secondsRemaining}s</span>
                    </div>
                </div>

                <div className="game-question-bar">
                    <span className="game-question-bar-dot" />
                    {currentTime && `Current time: ${currentTime} – Where is the train NOW?`}
                </div>

                <div className="page-game">
                    <div className="map-container" style={{ height: "100vh" }}>
                        {mounted && (
                            <RMap
                                minZoom={6}
                                initialCenter={[7.4707, 46.95]}
                                initialZoom={8}
                                mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
                                onClick={handleMapClick}
                                onTouchEnd={handleMapClickTouch}
                            >
                                {clickPosition && (
                                    <RMarker longitude={clickPosition[0]} latitude={clickPosition[1]} />
                                )}
                                {stationPins?.map((station, idx) => (
                                    <RMarker
                                        key={`station-${idx}-${station[0]}-${station[1]}`}
                                        longitude={station[1]}
                                        latitude={station[0]}
                                    >
                                        <div style={{
                                            width: "20px",
                                            height: "20px",
                                            backgroundColor: "green",
                                            borderRadius: "50%",
                                            border: "2px solid white",
                                            cursor: "pointer",
                                        }} />
                                    </RMarker>
                                ))}
                                {clickPosition && !guessSubmitted && (
                                    <div className="submit-guess-container">
                                        <div className="card">
                                            <span className="guess-coordinates">
                                                {clickPosition[1].toFixed(3)}°N, {clickPosition[0].toFixed(3)}°E
                                            </span>
                                        </div>
                                        <Button type="primary" onClick={handleSubmitGuess}>
                                            Confirm Guess
                                        </Button>
                                    </div>
                                )}
                            </RMap>
                        )}
                    </div>
                </div>
            </>
        );
    } else if (gameState === "BETWEEN_ROUNDS") {
        return (
            <RoundOverview
                train={currentTrain}
                results={results?.userResults || []}
                currentRound={currentRound}
                maxRounds={maxRounds}
                publish={publish}
            />
        );
    } else {
        return <LoadingScreen />;
    }
};

export default GamePage;