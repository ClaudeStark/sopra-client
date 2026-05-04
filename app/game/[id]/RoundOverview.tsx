"use client";

import { Button } from "antd";
import { useEffect, useState , useMemo} from "react";
import { useRouter, useParams } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker } from "maplibre-react-components";
import { Train } from "@/types/train";
import { UserResult } from "@/types/user";
import { useAuth } from "@/context/AuthContext";

interface RoundOverviewProps {
    train: Train | null;
    results: UserResult[];
    currentRound: number | null;
    maxRounds: number | null;
    publish: (destination: string, body: object) => void;
}

const RoundOverview: React.FC<RoundOverviewProps> = ({ train, results, currentRound, maxRounds, publish }) => {

    const router = useRouter();
    const { user } = useAuth();
    const { id: gameId } = useParams<{ id: string }>();

    const [readyForNextRound, setReadyForNextRound] = useState(false);

    const sortedRoundResults = useMemo(
        () => [...results].sort((a, b) => b.roundPoints - a.roundPoints),
        [results]
    );

    const sortedTotalResults = useMemo(
        () => [...results].sort((a, b) => b.totalPoints - a.totalPoints),
        [results]
    );

    const handleReadyForNextRound = () => {
        if (readyForNextRound) return;
        setReadyForNextRound(true);
        publish(`/app/game/${gameId}/ready`, {});
        console.log("Sent ready message for user " + user?.userId);
    };

    const handleEndGame = () => {
        router.push(`/game/${gameId}/leaderboard`);
    };

    return (
        <div className="game-result-layout">

            <div className="map-container">
                <RMap
                    minZoom={6}
                    initialCenter={[train?.currentY ?? 7.4707, train?.currentX ?? 46.95]}
                    initialZoom={9}
                    mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
                >
                    {train?.currentX && train?.currentY && (
                        <RMarker
                            longitude={train.currentY}
                            latitude={train.currentX}
                        />
                    )}
                    {sortedRoundResults.map((result) => (
                        <RMarker
                            key={`guess-${result.userId}-${result.xCoordinate}-${result.yCoordinate}`}
                            longitude={result.yCoordinate}
                            latitude={result.xCoordinate}
                        />
                    ))}
                </RMap>
            </div>

            <aside className="result-panel">

                <div className="result-panel-header">
                    <p className="result-panel-round-label">ROUND {currentRound} / {maxRounds}</p>
                    <h2 className="result-panel-title">Result</h2>
                    <p className="result-panel-subtitle">
                        {train?.line.name} · {train?.lineOrigin?.stationName} → {train?.lineDestination?.stationName}
                    </p>
                </div>

                <div className="result-actual-position">
                    <div className="result-actual-label">Actual Position</div>
                    <div className="result-actual-value">
                        Zwischen {train?.lastLeavingStation?.stationName ?? "?"} &amp; {train?.nextPendingStation?.stationName ?? "?"}
                    </div>
                </div>

                <div className="result-section-label">This Round</div>

                {sortedRoundResults.map((result) => (
                    result.userId === user?.userId ? (
                        <div key={`round-row-${result.userId}`} className="result-player-row result-player-row--you">
                            <div className="result-player-avatar" />
                            <div className="result-player-info">
                                <div className="result-player-name">You</div>
                                <div className="result-player-distance">{result.distance} km</div>
                            </div>
                            <span className="result-player-score">{result.roundPoints}</span>
                        </div>
                    ) : (
                        <div key={`round-row-${result.userId}`} className="result-player-row">
                            <div className="result-player-avatar" />
                            <div className="result-player-info">
                                <div className="result-player-name">{result.userId}</div>
                                <div className="result-player-distance">{result.distance} km</div>
                            </div>
                            <span className="result-player-score">{result.roundPoints}</span>
                        </div>
                    )
                ))}

                <div className="result-section-label">Overall Standings</div>

                {sortedTotalResults.map((result, index) => (
                    <div key={`total-row-${result.userId}`} className="result-standings-row">
                        <span className="result-standings-rank">{index + 1}.</span>
                        <span className="result-standings-name">
                            {result.userId === user?.userId ? "You" : result.userId}
                        </span>
                        <span className="result-standings-score">{result.totalPoints}</span>
                    </div>
                ))}

                <div className="result-panel-footer">
                    {currentRound === maxRounds ? (
                        <Button type="primary" className="btn-full" onClick={handleEndGame}>
                            End Game
                        </Button>
                    ) : !readyForNextRound ? (
                        <Button type="primary" className="btn-full" onClick={handleReadyForNextRound}>
                            Next round →
                        </Button>
                    ) : (
                        <Button type="primary" className="btn-full" disabled>
                            Waiting for other players →
                        </Button>
                    )}
                </div>

            </aside>
        </div>
    );
};

export default RoundOverview;