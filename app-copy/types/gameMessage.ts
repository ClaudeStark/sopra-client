import {UserResult} from "@/types/user";
import {Train} from "@/types/train";

export interface RoundStartDTO {
    roundNumber:number;
    maxRounds:number;
    train:Train;
}

export interface ResultDTO {
    roundNumber:number;
    userResults:UserResult[];
    train:Train;
}

export type GameMessage =
    | { type: "ROUND_END"; payload: null }
    | { type: "SCORES"; payload: ResultDTO}
    | { type: "ROUND_START"; payload: RoundStartDTO };