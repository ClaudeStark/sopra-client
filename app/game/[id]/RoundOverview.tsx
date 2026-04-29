"use client";

/**
 * RoundResult  –  shown after each round inside the Game Screen
 *
 * Design ref: uploaded screenshot (split layout – map left, panel right)
 * ─────────────────────────────────────────────────────────────────────────────
 * This component replaces the full-screen map once the backend sends a
 * ROUND_END WebSocket message. The parent (game/[id]/page.tsx) mounts it
 * instead of the plain map view when gameState.phase === "ROUND_RESULT".
 *
 * Layout:
 *   <div className="game-result-layout">          ← flex row, fills .page-game
 *     <div className="map-container">             ← left: map stays visible
 *     <aside className="result-panel">            ← right: 340px white sidebar
 *
 * Props (all TODO – wire to real data from WS ROUND_END payload):
 *   currentRound, totalRounds   – "ROUND 1 / 5"
 *   trainInfo                   – line, route, time for subtitle
 *   actualPosition              – "Zwischen Baden & Wettingen"
 *   roundResults[]              – per-player distance + score delta
 *   overallStandings[]          – cumulative leaderboard
 *   onNextRound                 – called when host clicks "Next round"
 *   isHost                      – shows/hides the Next round button
 */

import { Button } from "antd";
import { use, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
//import { useWebSocket } from "@/hooks/useWebSocket";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker } from "maplibre-react-components";
//import { Message} from "@types/message";
import { Train } from "@/types/train";
import { Round } from "@/types/round";
import type { MessageType } from "@/types/messageType";
//import { User } from "@/types/user";
import { Message } from "@/types/message";
import {UserResult} from "@/types/user";



interface RoundOverviewProps {
    train: Train | null;
    results: UserResult[];
    currentRound: number | null;
    maxRounds: number | null;
    publish: (destination: string, body: Message) => void;
    }

const RoundOverview: React.FC<RoundOverviewProps> = ({ train, results, currentRound, maxRounds, publish }) => {   
    
    const router     = useRouter();  
    const { value: userId } = useLocalStorage<string>("userId", "1"); //hardcoded for testing, needs to be set later with login
    const { id: gameId } = useParams();
    const [unsortedResults, setUnsortedResults] = useState<UserResult[]>(results);
    const [sortedRoundResults, setSortedRoundResults] = useState<UserResult[]>([]);
    const [sortedTotalResults, setSortedTotalResults] = useState<UserResult[]>([]);
    const [currentTrain, setcurrentTrain] = useState<Train | null>(train);
    //prevent hidration error
    const [mounted, setMounted] = useState(false);
    const [readyForNextRound, setReadyForNextRound] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
        
    useEffect(() => {
        //sort user results by score descending
        console.log("unsorted results:", unsortedResults);
        const sortedResults = [...unsortedResults].sort((a, b) => b.roundPoints - a.totalPoints);
        setSortedRoundResults(sortedResults);
        console.log("sorted results:", sortedResults);

        //sort total results by totalscore descending
        const sortedTotalResults = [...unsortedResults].sort((a, b) => b.totalPoints - a.roundPoints);
        setSortedTotalResults(sortedTotalResults);
        console.log("sorted total results:", sortedTotalResults);

    }, [unsortedResults]);

    const handleReadyForNextRound = async () => {
        if (readyForNextRound) {
            return;
        }
        setReadyForNextRound(true);

        publish(`/app/game/${gameId}/ready`, {
            type: "READY_FOR_NEXT_ROUND",
            payload: {
                userId: userId,
                isReady: true
            }
        });
        console.log("Sent ready message for user" + userId)
    }

    const handleEndGame = async () => {
      console.log("Ending Game")
      router.push(`/game/${gameId}/leaderboard`)
    }

  return (
    <div className="game-result-layout">

      {/* ── Left: map stays mounted so the actual pin is visible ─────────── */}
      <div className="map-container">
        {mounted && (
        <RMap
            minZoom={6}
            initialCenter={[currentTrain?.currentY ?? 7.4707, currentTrain?.currentX ?? 46.95]}
            initialZoom={9}
            mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
            >
                {/*Actual Train Position*/}
                {currentTrain?.currentX && currentTrain?.currentY && (
                    <RMarker
                    longitude={currentTrain.currentY}
                    latitude={currentTrain.currentX}
                    />)}
                {/*player guess positions*/}
                {sortedRoundResults.map((result) => (
                    <RMarker
                    key={`guess-${result.userId}-${result.xCoordinate}-${result.yCoordinate}`}
                    longitude={result.yCoordinate}
                    latitude={result.xCoordinate}
                    //color="#3fce63"
                    />)
                 )

                }
            </RMap>)}
      </div>

      {/* ── Right: result sidebar ─────────────────────────────────────────── */}
      <aside className="result-panel">

        {/* Header */}
        <div className="result-panel-header">
          <p className="result-panel-round-label">
            {/* TODO: currentRound / totalRounds */}
            ROUND {currentRound} / {maxRounds}
          </p>
          <h2 className="result-panel-title">
            {/* TODO: target icon */}
            Result
          </h2>
          <p className="result-panel-subtitle">
            {/* TODO: trainInfo.lineId · trainInfo.fromStation → trainInfo.toStation · trainInfo.currentTime */}
            {train?.line.name} · {train?.lineOrigin?.stationName} → {train?.lineDestination?.stationName} · {/*add current time */}
          </p>
        </div>

        {/* Actual position callout */}
        <div className="result-actual-position">
          <div className="result-actual-label">Actual Position</div>
          <div className="result-actual-value">
            {/* TODO: actualPosition from ROUND_END payload */}
            Zwischen {train?.lastLeavingStation.stationName} &amp; {train?.nextPendingStation.stationName}
          </div>
        </div>

        {/* This round – per-player scores */}
        <div className="result-section-label">This Round</div>

        {/* TODO: map over roundResults[] – example rows below */}

        

        {sortedRoundResults.map((result, index) => (
            result.userId == parseInt(userId) ? (
                <div key={`round-row-${result.userId}`} className="result-player-row result-player-row--you">
                <div className="result-player-avatar">
            {/* TODO: username initial */}
                    </div>
                    <div className="result-player-info">
                        <div className="result-player-name">You</div>
                        <div className="result-player-distance">{result.distance} km</div>
                    </div>
                    <span className="result-player-score">{result.roundPoints}</span>
                </div>) : (
                <div key={`round-row-${result.userId}`} className="result-player-row">
                    <div className="result-player-avatar">
                        {/* TODO: username initial */}
                    </div>
                    <div className="result-player-info">
                        <div className="result-player-name">{result.userId /*to do: fetch username*/}</div>
                        <div className="result-player-distance">{result.distance} km</div>
                    </div>
                    <span className="result-player-score">{result.roundPoints}</span>
            </div>
            )))}
           
        

        {/* Overall standings */}
        <div className="result-section-label">Overall Standings</div>

        {/*map over overallStandings[] */}

        {sortedTotalResults.map((result, index) => (
            <div key={`total-row-${result.userId}`} className="result-standings-row">
          <span className="result-standings-rank">{index+1}.</span>
          <span className="result-standings-name">{result.userId == parseInt(userId) ? ("You"): result.userId}</span>
          <span className="result-standings-score">{result.totalPoints}</span>
        </div>
        ))}

        

        {/* Footer: next-round button */}
        <div className="result-panel-footer">
          {currentRound==maxRounds ? (
            <Button
            type="primary"
            className="btn-full"
            onClick={handleEndGame}
          >
            End Game
          </Button>
          ) : (
            !readyForNextRound ? (
            <Button
            type="primary"
            className="btn-full"
            onClick={handleReadyForNextRound}
          >
            {/* TODO: conditionally render "Waiting for host…" if !isHost */}
            {/*If we want to render how many players are ready: Add additional websockets logic */}
            Next round →
          </Button>) : (
            <Button
            type="primary"
            className="btn-full"
          >
            {/* TODO: conditionally render "Waiting for host…" if !isHost */}
            {/*If we want to render how many players are ready: Add additional websockets logic */}
            Waiting for other players →
          </Button>
          )
          )}
          
          
        </div>

      </aside>
    </div>
  );
};

export default RoundOverview;