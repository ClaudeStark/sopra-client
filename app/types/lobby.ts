import {UserDTO} from "@/types/user";
import {Round} from "@/types/round";

export interface Lobby {
  lobbyId: number;
  lobbyName: string;
  lobbyCode: string;
  admin: Admin;
  rounds: Round[];
  maxRounds: number;
  visibility: "PUBLIC" | "PRIVATE";
  lobbyState: "WAITING" | "IN_GAME" | "FINISHING";
  currentRound: number;
  scores: Score[];
  size: number;
  users?: UserDTO[];
}

export interface CreateLobbyPostDTO {
  lobbyName: string;
  size: number;
  visibility: "PUBLIC" | "PRIVATE";
  maxRounds: number;
}

export interface LobbyAccessDTO {
  lobbyId: number;
  lobbyCode: string;
  userId: number;
  token: string;
}

export interface LobbyCodeDTO {
  lobbyCode: string;
}

export interface UpdateLobbyPostDTO {
  lobbyName: string;
  size: number;
  maxRounds: number;
  visibility: "PUBLIC" | "PRIVATE";
}

export interface Admin {
  token: string;
  userId: number;
}

export interface Score {
  userId: number;
  points: number;
}