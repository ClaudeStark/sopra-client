import { MyLobbyDTO } from "@/types/lobby";
import { UpdateLobbyPostDTO } from "@/types/lobby";
import { UserAuthDTO } from "@/types/user";

export type LobbyMessage =
    | { type: "LOBBY_STATE"; payload: MyLobbyDTO }
    | { type: "UPDATE_LOBBY_SETTINGS"; payload: UpdateLobbyPostDTO }
    | { type: "START_GAME"; payload: UserAuthDTO }
    | { type: "LEAVE_LOBBY"; payload: UserAuthDTO }
    | { type: "GAME_START"; payload: MyLobbyDTO }
