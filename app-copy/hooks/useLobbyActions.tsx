// hooks/useLobbyActions.ts
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { LobbyCodeDTO, LobbyAccessDTO } from "@/types/lobby";
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import { getApiDomain } from "@/utils/domain";
// import { join } from "path";
import { useWebSocket } from "@/context/WebSocketContext"; // Importieren!
import { useAuth } from "@/context/AuthContext";
import { App } from "antd";


export const useLobbyActions = () => {
  const router = useRouter();
  const apiService = useApi();
  const { connect } = useWebSocket(); // WebSocket-Funktion holen
  const { user: currentUser, token, login } = useAuth();
  const { message } = App.useApp();

  const handleJoin = async (lobbyId: number, lobbyCodeDTO: LobbyCodeDTO, overrideCredentials?:{userId:number,token:string}) => {


    // const rawToken = localStorage.getItem("token");
    // let token = rawToken ? JSON.parse(rawToken) : "";
    // const rawUserId = localStorage.getItem("userId");
    // let userId = rawUserId ? JSON.parse(rawUserId) : -1;
    const effectiveUserId = overrideCredentials?.userId ?? currentUser?.userId ?? -1;
    const effectiveToken = overrideCredentials?.token ?? token ?? "";

    try {
      const response: LobbyAccessDTO = await apiService.post<LobbyAccessDTO>(
        `/lobbies/${lobbyId}`,
        lobbyCodeDTO,
        {
          headers: {
            token: effectiveToken,
            userId: effectiveUserId.toString(),
          },
        }
      );

      await login(response.token, response.userId);

      connect(response.userId.toString(), response.token);

            router.push(`/lobbies/${lobbyId}`);


      // joinLobby(lobbyId, lobbyCodeDTO, Number(userId), token);
      // //await connectToLobbyWebSocket(lobbyId, Number(userId), token);
      // //router.push(`/lobbies/${lobbyId}`);
      // // console.log("Lobby beigetreten, weiterleiten zur Lobby-Seite...");
      // // console.log(lobbyAccessDTO);
      // // userId = lobbyAccessDTO.userId;
      // // token = lobbyAccessDTO.token;

      // // localStorage.setItem("token", JSON.stringify(token));
      // // localStorage.setItem("userId", JSON.stringify(userId));

      // // 2. WebSocket: Standleitung öffnen
      // // Wir schicken userId und token mit, damit der Interceptor im Backend uns lässt
      // connect(userId.toString(), token);
      // console.log("lobbyId before router push: ", lobbyId);
      // router.push(`/lobbies/${lobbyId}`);
    } catch (error) {
      console.error("Fehler beim Beitreten zur Lobby:", error);
      // Hier kannst du dem User eine Fehlermeldung anzeigen

    }

  
  };
  return { handleJoin };

}

