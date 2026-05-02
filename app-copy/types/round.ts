import { Train } from "./train";
import {GuessMessageDTO} from "@/types/GuessMessageDTO";
import {UserGameStatus} from "@/types/UserGameStatus";
import {Score} from "@/types/lobby";

export interface Round {
    roundNumber: number;
    maxRounds: number;
    train: Train;
    GuessMessages: Record<number, GuessMessageDTO>;
    allUserGameStatuses: Record<number, UserGameStatus>;
    scores: Record<number, Score>
    distances: Record<number, number>
}


