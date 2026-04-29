"use client";

/**
 * Game Screen  –  route: /game/[gameId]
 *
 * Design ref: image5.png
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout (no standard navbar – uses compact game navbar):
 *
 *   <nav className="navbar navbar--game">
 *     brand logo  |  (centre: hidden by design)  |  "Exit Game" link
 *   </nav>
 *
 *   <div className="train-bar">
 *     .train-bar-line-badge   →  "S12"
 *     .train-bar-route        →  "From Brugg AG → To Zürich HB"
 *     .train-bar-times        →  "Dep 12:02 · Arr 12:38"
 *     .train-bar-round        →  "Round 1/5"  +  .train-bar-timer "28s"
 *   </div>
 *
 *   <div className="game-question-bar">
 *     .game-question-bar-dot   (pulsing red dot)
 *     "Current time: 12:21 – Where is the train NOW?"
 *   </div>
 *
 *   <div className="page-game">          ← fills remaining viewport height
 *     <div className="map-container">   ← React-Leaflet / Google Maps mounts here
 *       <div className="game-hint-bar">Click on the map to place your guess</div>
 *     </div>
 *   </div>
 *
 * Classnames (all in globals.css):
 *   navbar, navbar--game
 *   train-bar, train-bar-line-badge, train-bar-route, train-bar-route-arrow,
 *   train-bar-times, train-bar-round, train-bar-timer
 *   game-question-bar, game-question-bar-dot
 *   page-game, map-container, game-hint-bar
 *
 * WebSocket:
 *   Subscribe to /topic/game/{gameId}  (via LobbyService per activity diagram)
 *   Expected message types (WsMessageType):
 *     "ROUND_START"   →  new round begins; update train info + reset timer
 *     "ROUND_END"     →  show result overlay; display scores
 *     "SCORE_UPDATE"  →  live leaderboard update mid-round (optional)
 *     "GAME_END"      →  navigate to final leaderboard / back to lobby
 *
 * Data flow:
 *   GET /game/{gameId}              →  initial game state (round, train, timer)
 *   POST /game/{gameId}/guess       →  submit lat/lng after map click
 *   User clicks map                 →  capture coordinates, show pin, enable submit
 *
 * Timer:
 *   Driven by secondsRemaining from WS "ROUND_START" message.
 *   Local setInterval counts down; sync again on next ROUND_START.
 */

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
//import { useWebSocket } from "@/hooks/useWebSocket";
import { useWebSocket } from "@/context/WebSocketContext";
import { Message} from "@/types/message";
import { Train, Station } from "@/types/train";
import { Round } from "@/types/round";
import type { MessageType } from "@/types/messageType";

import { Button, message } from "antd";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker } from "maplibre-react-components";
import { MapLayerMouseEvent, MapLayerTouchEvent } from "maplibre-gl";
import RoundOverview from "./RoundOverview";
import LoadingScreen from "./LoadingScreen";
import { latLngToEpsg, epsgToLatLng } from "./coordinateConverter";
import {GameMessage, ResultDTO} from "@/types/gameMessage";
import {UserResult} from "@/types/user";

const GamePage: React.FC = () => {
  const router    = useRouter();
  const { id: gameId } = useParams<{ id: string }>();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");//hardcoded for testing, needs to be set later with login
  const { connect, disconnect, subscribe, publish, isConnected } = useWebSocket();


 type GameState = 
    | "ROUND_IN_PROGRESS"
    | "LOADING"
    | "BETWEEN_ROUNDS"
    | "GAME_ENDED"
  ;

  /*type UserResult = {
    userId: string;
    score: string;
    totalscore: string;
    xCoordinate: number;
    yCoordinate: number;
    distance: number;
  }*/

  type GuessMessagePayload = {
    lobbyId: string;
    userId: string;
    token: string;
    Xcoordinate: number;
    Ycoordinate: number;
  }


  const [messages, setMessages] = useState<Message[]>([]);

  const [gameState,         setGameState]         = useState<GameState | null>("ROUND_IN_PROGRESS");
  const [currentTime,         setCurrentTime]         = useState<string>("");
  const [timerActive,        setTimerActive]        = useState<boolean>(true);
  const [secondsRemaining,  setSecondsRemaining]  = useState<number>(45);
  const [guessCoords,      setGuessCoords]      = useState<[number, number] | null>(null);
  const [guessSubmitted,   setGuessSubmitted]   = useState<boolean>(false);
  const [clickPosition, setClickPosition] = useState<null | [number, number]>(
    null,
  );//[long, lat]
  const [currentTrain, setCurrentTrain] = useState<Train | null>(null);
  const [departureTime, setDepartureTime] = useState<string | null>(null);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [maxRounds, setMaxRounds] = useState<number | null>(null);
  const [results, setResults] = useState<{roundNumber: number, userResults: UserResult[], train: Train} | null>(null);
  const [totalResults, setTotalResults] = useState<[{userId: string; score: number}] | null>(null); 
  const [stationPins, setStationPins] = useState<[[number, number], [number,number]] | null>(null); //[lat, long]

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const epochToTime = (epoch: number | null) : string => {
    if (!epoch) {
      return "";
    }
    return new Date(epoch).toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });
  }

  //prevent hidration error
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

    // ── Guess submission ─────────────────────────────────────────────────────
  const handleSubmitGuess = async () => {
    if (!clickPosition) return;

    const [lon, lat] = clickPosition;

    //convert lat lon to other format
    const [x, y] = latLngToEpsg(lat, lon);

    const payload: GuessMessagePayload = {
      lobbyId: gameId!,
      userId: userId!, 
      token: token,
      Xcoordinate: x, 
      Ycoordinate: y 
  };

    console.log("Guess:", payload);
  
    if (!isConnected) {
      console.warn("WebSocket not connected yet");
      return;
    }
    
    
    publish(`/app/game/${gameId}/guess`, {
      type: "GUESS_MESSAGE",
      payload: payload
    });
    setGuessCoords([lat, lon]); // record for later use (e.g. showing pin)

    setGuessSubmitted(true);
    console.log("Guess submitted:", payload);
  }


  // added for fix with guess after time is up
  const gameStateRef = useRef({
    clickPosition,
    guessSubmitted,
    handleSubmitGuess
  })

  useEffect(() => {
    gameStateRef.current = {
      clickPosition,
      guessSubmitted,
      handleSubmitGuess
    };
  }, [clickPosition, guessSubmitted, handleSubmitGuess]);

  // ── Local countdown timer ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      if (gameState === "ROUND_IN_PROGRESS" && timerActive) {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }
      if (secondsRemaining <= 0 && !guessSubmitted) {
            handleSubmitGuess(); // auto-submit when timer runs out
            
          }

    }, 1000);
    
    
    // Clean up the timer when the component unmounts
    return () => clearInterval(timer);
    }, [handleSubmitGuess, guessSubmitted]);

  
  // ── WebSocket – real-time game events ────────────────────────────────────
  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe<GameMessage>(`/topic/game/${gameId}`, (update) => {
      console.log("Received WS message:", update);
      setMessages((prev) => [...prev, update]);
      handleMessage(update);
    });

    // Send initial ready message
    publish(`/app/game/${gameId}/ready`, {
      type: "READY_FOR_NEXT_ROUND",
      payload: {
        userId: userId,
        isReady: true
      }
    });

    console.log("Sent initial READY_FOR_NEXT_ROUND message");

    return () => {
      if (subscription) subscription.unsubscribe();
      console.log("Unsubscribed from websockets topic")
    };
  }, [isConnected, subscribe, publish, gameId, userId]);  

  const handleMessage = useCallback((message: GameMessage) => {
    const {
      clickPosition: currentClick,
      guessSubmitted: alreadySubmitted,
      handleSubmitGuess: submitFn
    } = gameStateRef.current;

    switch (message.type) {
      case "ROUND_START":
        console.log("Round started:", message);
        setGuessCoords(null);
        setGuessSubmitted(false);
        setClickPosition(null);
        setCurrentTrain(message.payload.train);
        setDepartureTime(epochToTime(message.payload.train.departureTime));
        setArrivalTime(epochToTime(message.payload.train.arrivalTime));
        //get coordinates for origin and destination station
        const origin = message.payload.train.lineOrigin;
        const destination = message.payload.train.lineDestination;
        const originCoords = epsgToLatLng(origin.xCoordinate, origin.yCoordinate)
        const destCoords = epsgToLatLng(destination.xCoordinate, destination.yCoordinate)
        setStationPins([originCoords, destCoords]);


        setCurrentRound(message.payload.roundNumber);
        setMaxRounds(message.payload.maxRounds);
        setGameState("ROUND_IN_PROGRESS");
        //start the local timer for 45 seconds
        setSecondsRemaining(45);
        setTimerActive(true);

        break;

      case "ROUND_END":
        console.log("Round end received");
        console.log("Current version in REF:", { currentClick, alreadySubmitted });

        if (currentClick && !alreadySubmitted) {
          console.log("Auto-Submit after ROUND_END");
          submitFn();
        }
        setTimerActive(false);
        break;
      
      case "SCORES":
        console.log("Scores updated:", message);
        //convert user guess coordinates
        const userResults = message.payload.userResults.map((result: UserResult) => {
          const [lat, lng] = epsgToLatLng(result.xCoordinate, result.yCoordinate);
          return {
            ...result,
            xCoordinate: lat,
            yCoordinate: lng,
          };
        });

        setResults({
          ...message.payload,
          userResults,
        }); //total results contained in UserResult
        
        //convert train coordinates
        const train = message.payload.train;

        const [lat, lon]= epsgToLatLng(train.currentX, train.currentY)

        train.currentX = lat;
        train.currentY = lon;

        setCurrentTrain(train)
        setGameState("BETWEEN_ROUNDS");
        break;

        /*
        case "GAME_END":
        setGameState("GAME_ENDED");
        // Teardown if needed
        router.push("/game/{gameId}/leaderboard");
        break;
        */
    }

  }, [guessCoords, guessSubmitted, handleSubmitGuess, gameId, router]);


 
  
  // ── Map click handler (passed from RMap component) ─────────────────────
  const handleMapClick = (e: MapLayerMouseEvent) => {
    setClickPosition(e.lngLat.toArray());

    
  };
  const handleMapClickTouch = (e: MapLayerTouchEvent) => {
    setClickPosition(e.lngLat.toArray());
    
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const train = currentTrain;
  
  if (gameState === "ROUND_IN_PROGRESS") {
    return (
  
  // in-round Map view with train info bar, question, and map interaction

    <>
      {/* ── Compact game navbar ─────────────────────────────────────────── */}
      <nav className="navbar navbar--game">
        {/* TODO: logo mark (white variant) */}
        <span style={{ marginLeft: "auto" }}>
          <Button
            className="btn-ghost-muted"
            onClick={() => router.push("/lobbies")}
          >
            Exit Game
          </Button>
        </span>
      </nav>

      {/* ── Red train-info bar ──────────────────────────────────────────── */}
      <div className="train-bar">
        {/* Line badge e.g. "S12" */}
        <span className="train-bar-line-badge">
          {train?.line.name ?? "—"}
        </span>

        {/* Route */}
        <span className="train-bar-route">
          From {train?.lineOrigin.stationName}
          <span className="train-bar-route-arrow"> → </span>
          To {train?.lineDestination.stationName}
        </span>

        {/* Times */}
        <span className="train-bar-times">
          Dep {departureTime} · Arr {arrivalTime}
        </span>

        {/* Round indicator + countdown */}
        <div className="train-bar-round">
          <span>
            Round {currentRound}/{maxRounds}
          </span>
          <span className="train-bar-timer">{secondsRemaining}s</span>
        </div>
      </div>

      {/* ── Question bar ────────────────────────────────────────────────── */}
      <div className="game-question-bar">
        <span className="game-question-bar-dot" />
        Current time: {currentTime} – Where is the train NOW?
      </div>

      {/* ── Map area ────────────────────────────────────────────────────── */}
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
            {
              clickPosition && (<RMarker longitude={clickPosition[0]} latitude={clickPosition[1]}/>) 
            }
            {/*Markers for origin and destination stations*/}
            {
              stationPins?.map((station,idx) => (
                <RMarker key={`station-${idx}-${station[0]}-${station[1]}`} longitude={station[1]} latitude={station[0]} >
              <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'green',
              borderRadius: '50%',
              border: '2px solid white',
              cursor: 'pointer'
            }} />
                </RMarker>
              ))
            }
            {/* Floating hint / submit button at map bottom */}
            {clickPosition && !guessSubmitted && !guessCoords && (
              <div className="submit-guess-container">
                <div className="card">
                  <span className="guess-coordinates">{clickPosition[1].toFixed(3)}°N, {clickPosition[0].toFixed(3)}°E</span>
                </div>
                <Button type="primary" onClick={handleSubmitGuess}>
                  Confirm Guess
                </Button>
              </div>
              )}
              {
                /*if guessSubmitted, indicate to user to wait*/
              }
            </RMap>)}
          {/*
            TODO: Mount map component here (React-Leaflet recommended).
            Pass onMapClick={handleMapClick} so the page captures coordinates.
            The map component should:
              - Render a Switzerland-centred tile map
              - Place a draggable pin when the user clicks
              - Show the correct-position pin after ROUND_END WS message
          */}

          
          {/*!guessSubmitted ? (
            <div className="game-hint-bar">
              {guessCoords
                ?  (
                  <Button type="primary" onClick={handleSubmitGuess}>
                    Submit Guess
                  </Button>
                )
                : "Click on the map to place your guess"}
            </div>
          ) : (
            <div className="game-hint-bar">
              Guess submitted – waiting for other players…
            </div>
          )*/}
        </div>
      </div>
    </>) }
    
    //pass the necessary arguments (actual train pos, scores & guesses of players) as props to the round overview component
    else if (gameState === "BETWEEN_ROUNDS") {
      return <RoundOverview 
                train={currentTrain}
                results={results?.userResults || []}
                currentRound={currentRound}
                maxRounds={maxRounds}
                publish={publish}/>
                
    }
    else {
      return <LoadingScreen />;
    }

  
};

export default GamePage;