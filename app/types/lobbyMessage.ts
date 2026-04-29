import {Lobby, UpdateLobbyPostDTO} from "@/types/lobby";
import {UserAuthDTO} from "@/types/user";

export type LobbyMessage =
    | { type: "LOBBY_STATE"; payload: Lobby }
    | { type: "UPDATE_LOBBY_SETTINGS"; payload: UpdateLobbyPostDTO}
    | { type: "START_GAME"; payload: UserAuthDTO }
    | { type: "LEAVE_LOBBY"; payload: UserAuthDTO}
    | { type: "GAME_START"; payload: Lobby }
