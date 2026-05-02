"use client";


import {useEffect, useRef, useState} from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useWebSocket } from "@/context/WebSocketContext";
import { Lobby } from "@/types/lobby";
import { LobbyMessage } from "@/types/lobbyMessage";
import { App, Button} from "antd";
import { useAuth } from "@/context/AuthContext";
import {UserAuthDTO} from "@/types/user";


const LobbyWaitPage: React.FC = () => {
  const router     = useRouter();
  const params     = useParams();
  const lobbyId = Number(params.id);
  const apiService  = useApi();
  const webSocket = useWebSocket();
  const { message } = App.useApp();

  //const token = JSON.parse(localStorage.getItem("token") || '""') as string;
  //const userId = JSON.parse(localStorage.getItem("userId") || '""') as number;
  const {user:currentUser, token} = useAuth();
    const [lobby, setLobby]   = useState<Lobby | null>(null);
    const intentionalDisconnect = useRef<boolean>(false);

  
  // const [userData, setUserData] = useState< {userId: number; token: string} | null>(null);


  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lobbyId || !token || !currentUser) return;

    const fetchLobby = async () => {
      try {
        const response = await apiService.get<Lobby>(
            `/lobbies/${lobbyId}`,
            {
              headers: {userId: currentUser.userId.toString(), token: token},
            }
            );
        console.log(response); //to be removed
        setLobby(response);
      } catch (e) {
        console.error("Fetch error: ", e);
        router.push("/lobbies"); // If lobby not found or error occurs, navigate back to lobby list 
      }
    };
    fetchLobby();
  }, [lobbyId, token, currentUser, router, apiService]);


  // ── Websocket fetch ────────────────────────────────────────────────────────
  // 1. Zuerst: Ein Effekt, der die Verbindung bei Bedarf wiederherstellt (Refresh-Schutz)
useEffect(() => {
  if (!webSocket.isConnected && token && currentUser) {
    console.log("WebSocket nicht verbunden - starte Reconnect...");
    webSocket.connect(currentUser.userId.toString(), token);
  }
}, [webSocket.isConnected, token, currentUser, webSocket]);
  
  useEffect(() => {
    if (!webSocket.isConnected || !lobbyId) return;

    const subscription = webSocket.subscribe<LobbyMessage>(
        `/topic/lobby/${lobbyId}`,
        (message) => {
          console.log(message);
          if (message.type === "LOBBY_STATE") {
            console.log("WebSocket Update received", message.payload);
            setLobby(message.payload);
          } else if (message.type === "GAME_START") {
            console.log(" Started");
            router.push(`/game/${lobbyId}`);
          }
          }
    );

    return () => subscription?.unsubscribe();
  }, [webSocket.isConnected, lobbyId, router, webSocket]);


  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    if (!webSocket.isConnected){
      message.warning("Verbindung wird noch aufgebaut...");
    return;}
    console.log("Starting game");

    const destination = `/app/lobby/${lobbyId}/start`;

    if (!currentUser || !token) return;

    const payload: UserAuthDTO = {
      userId: currentUser.userId,
      token: token
    }

    const messageBody: LobbyMessage = {
      type: "START_GAME",
      payload: payload
    }

    webSocket.publish(destination, messageBody);
  };

  const handleLeave = async () => {
    const destination = `/app/lobby/${lobbyId}/leave`;

    if (!currentUser || !token) return;
    else {
      const payload: UserAuthDTO = {
        userId: currentUser.userId,
        token: token
      }
      const messageBody: LobbyMessage = {
        type: "LEAVE_LOBBY",
        payload: payload
      }

      webSocket.publish(destination, messageBody);
      console.log("message published: ", messageBody);

      intentionalDisconnect.current = true;
      router.push(`/lobbies`);

      webSocket.disconnect();
      console.log("disconnected");
    }
  };

  const updateLobbySettings = async () => {

  }

  // Vor dem return in der Komponente:
  const isHost = lobby && currentUser ? lobby.admin?.userId === currentUser.userId : false;

  if (!lobby) return <div className="page-center">Laden...</div>;
  

  

  return (
  <div className="page-center page-content">
    <div className="card card--lobby-wait">

      {/* Header: Name + Status */}
      <div className="wait-header">
        <h2 className="wait-lobby-name">
          <span aria-hidden="true">🎮</span> {lobby.lobbyName}
        </h2>
        <span className="badge badge-waiting">Waiting...</span>
      </div>

      {/* Meta badges: rounds + visibility */}
      <div className="wait-meta-row">
        <span className="badge badge-inactive">
          {lobby.maxRounds || 0} rounds
        </span>
        <span className={`badge ${lobby.visibility === "PUBLIC" ? "badge-public" : "badge-private"}`}>
          {lobby.visibility === "PUBLIC" ? "🌍 Public" : "🔒 Private"}
        </span>
      </div>

      {/* Player List Section */}
      <div className="wait-section-label">
        Players ({lobby.users?.length || 0} / {lobby.size})
      </div>

      <div className="wait-player-list">
        {lobby.users?.map((userDTO) => {
          // Limitation: UserDTO has no userId, so we can only match by username.
          // We know the current user's host status via `isHost`; for other players
          // we can't determine host without a backend DTO change.
          const isMe = userDTO.username === currentUser?.username;
          const isPlayerHost = isMe && isHost;
          return (
            <div
              key={userDTO.username}
              className={`wait-player-row ${isPlayerHost ? "wait-player-row--host" : ""}`}
            >
              <div
                className={`wait-player-avatar wait-player-avatar--${isPlayerHost ? "host" : "guest"}`}
              >
                {userDTO.username?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="wait-player-name">{userDTO.username}</span>
              {isPlayerHost && <span className="badge badge-host">Host</span>}
              {isMe && !isPlayerHost && <span className="badge badge-public">You</span>}
            </div>
          );
        })}
      </div>

      <div className="u-divider" />

      {/* Invite Section */}
      <div className="wait-section-label">Invite Friends</div>
      <div className="wait-invite-box">
        <code className="wait-invite-code">
          <span aria-hidden="true">🔗</span> {lobby.lobbyCode}
        </code>
        <Button
          size="small"
          className="wait-invite-copy-btn"
          onClick={() => navigator.clipboard.writeText(lobby.lobbyCode)}
        >
          Copy
        </Button>
      </div>

      {/* Action buttons */}
      <div className="wait-actions">
        {isHost ? (
          <Button
            type="primary"
            className="btn-full wait-start-btn"
            onClick={handleStartGame}
          >
            ▶ Start Game ({lobby.maxRounds || 0} rounds)
          </Button>
        ) : (
          <div className="wait-waiting-box">
            Waiting for host to start...
          </div>
        )}

        <Button
          className="wait-leave-btn"
          onClick={handleLeave}
        > 
          <span aria-hidden="true">🚪</span> {isHost ? "Leave & Transfer Host" : "Leave Lobby"}
        </Button>
      </div>

    </div>
  </div>
)};

export default LobbyWaitPage;