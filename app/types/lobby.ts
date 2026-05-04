import {UserDTO} from "@/types/user";
import {Round} from "@/types/round";

export interface Lobby {
  lobbyId: number;
  lobbyName: string;
  lobbyCode: string;
  maxPlayers: number;
  currentPlayers: number;
  maxRounds: number;
  visibility: "PUBLIC" | "PRIVATE";
  lobbyState: "WAITING" | "IN_GAME" | "FINISHING";
}

export interface MyLobbyDTO {
  lobbyId: number;
  lobbyName: string;
  lobbyCode: string;
  adminId: number;
  maxPlayers: number;
  currentPlayers: number;
  visibility: "PUBLIC" | "PRIVATE";
  maxRounds: number;
  lobbyState: "WAITING" | "IN_GAME" | "FINISHING" | "FINISHED";
  players: UserDTO[];
}

export interface CreateLobbyPostDTO {
  lobbyName: string;
  maxPlayers: number;   // war size
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