export interface ScoreDTO {
    userId: number;
    points: number;
}

export interface RoundResultDTO {
    roundNumber: number;
    scores: Record<number, number>;    // userId → points
    distances: Record<number, number>; // userId → distance
}

export interface GameResultDTO {
    gameId: number;
    rounds: RoundResultDTO[];
    scores: ScoreDTO[];
    usernames: Record<number, string>; // userId → username
}