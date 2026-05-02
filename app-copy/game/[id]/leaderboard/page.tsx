"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { Button, App } from "antd";

interface Score {
    userId: number;
    points: number;
}

interface GuessMessageDTO {
    lat: number;
    lng: number;
}

interface UserGameStatus {
    isReady: boolean;
}

interface Round {
    roundNumber: number;
    train: Record<string, unknown>;
    guessMessages: Record<string, GuessMessageDTO>;
    allUserGameStatuses: Record<string, UserGameStatus>;
    scores: Record<string, Score>;
    distances: Record<string, number>;
}

interface GameResultDTO {
    gameId: number;
    rounds: Round[];
    scores: Score[];
    usernames: Record<string, string>; // userId -> username
}

const MEDAL = ["🥇", "🥈", "🥉"];

const LeaderboardPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const gameId = Number(params.id);

    const apiService = useApi();
    const { user: currentUser, token } = useAuth();
    const { message } = App.useApp();

    const [gameResult, setGameResult] = useState<GameResultDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!gameId || !currentUser || !token) return;

        const fetchLeaderboard = async () => {
            try {
                const response = await apiService.get<GameResultDTO>(
                    `/game/${gameId}/leaderboard`,
                    {
                        headers: {
                            userId: currentUser.userId.toString(),
                            token: token,
                        },
                    }
                );
                setGameResult(response);
            } catch (e) {
                console.error("Leaderboard fetch error:", e);
                message.error("Failed to load leaderboard.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [gameId, currentUser, token, apiService, message]);

    const totalScores = (gameResult?.scores ?? []).slice().sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    const usernames = gameResult?.usernames ?? {};
    const numRounds = gameResult?.rounds?.length ?? 0;
    const getName = (userId: string | number) => usernames[userId.toString()] ?? `User ${userId}`;

    if (loading) return <div className="page-center">Loading leaderboard...</div>;
    if (!gameResult) return <div className="page-center">No results found.</div>;

    return (
        <div className="page-center page-content">
            <div className="card card--wide" style={{ maxWidth: 560 }}>

                {/* Header */}
                <div className="wait-header" style={{ flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <h2 className="wait-lobby-name">Final Leaderboard</h2>
                    <span className="badge badge-waiting">{numRounds} Round{numRounds !== 1 ? "s" : ""}</span>
                </div>

                {/* Total scores */}
                <div className="wait-section-label" style={{ marginTop: 24 }}>RANKINGS</div>

                <div className="wait-player-list">
                    {totalScores.map((score, index) => {
                        const userId = score.userId;
                        const points = score.points;
                        const isCurrentUser = currentUser && userId === currentUser.userId;
                        return (
                            <div
                                key={userId}
                                className="wait-player-row"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontWeight: isCurrentUser ? 700 : 400,
                                    opacity: index === 0 ? 1 : 0.85,
                                }}
                            >
                <span>
                  {MEDAL[index] ?? `#${index + 1}`}&nbsp;&nbsp;{getName(userId)}
                </span>
                                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {points} pts
                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="u-divider" />

                {/* Per-round breakdown */}
                {gameResult.rounds?.map((round) => (
                    <div key={round.roundNumber}>
                        <div className="wait-section-label">ROUND {round.roundNumber}</div>
                        <div className="wait-player-list">
                            {round.scores
                                ? Object.entries(round.scores)
                                    .sort(([, a], [, b]) => (b.points ?? 0) - (a.points ?? 0))
                                    .map(([userId, score]) => {
                                        const dist = round.distances?.[userId];
                                        return (
                                            <div
                                                key={userId}
                                                className="wait-player-row"
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontSize: "0.9em",
                                                }}
                                            >
                                                <span>{getName(userId)}</span>
                                                <span style={{ display: "flex", gap: 24, fontVariantNumeric: "tabular-nums" }}>
                            {dist != null && (
                                <span style={{ opacity: 0.6 }}>
                                {dist} km off
                              </span>
                            )}
                                                    <span>{score.points ?? 0} pts</span>
                          </span>
                                            </div>
                                        );
                                    })
                                : <div className="wait-player-row" style={{ opacity: 0.5 }}>No scores</div>
                            }
                        </div>
                    </div>
                ))}

                <div className="u-divider" />

                {/* Actions */}
                <div className="wait-actions">
                    <Button type="primary" className="btn-full" onClick={() => router.push("/lobbies")}>
                        Back to Lobbies
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default LeaderboardPage;