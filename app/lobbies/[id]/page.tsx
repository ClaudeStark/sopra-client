"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useWebSocket } from "@/context/WebSocketContext";
import { MyLobbyDTO } from "@/types/lobby";
import { LobbyMessage } from "@/types/lobbyMessage";
import { App, Button } from "antd";
import { useAuth } from "@/context/AuthContext";

const LobbyWaitPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const lobbyId = Number(params.id);
  const apiService = useApi();
  const webSocket = useWebSocket();
  const { message } = App.useApp();
  const { user: currentUser, token } = useAuth();
  const [lobby, setLobby] = useState<MyLobbyDTO | null>(null);
  const intentionalDisconnect = useRef<boolean>(false);

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lobbyId || !token || !currentUser) return;

    const fetchLobby = async () => {
      try {
        const response = await apiService.get<MyLobbyDTO>(
            `/lobbies/${lobbyId}`,
            { headers: { userId: currentUser.userId.toString(), token: token } }
        );
        console.log(response);
        setLobby(response);
      } catch (e) {
        console.error("Fetch error: ", e);
        router.push("/lobbies");
      }
    };
    fetchLobby();
  }, [lobbyId, token, currentUser, router, apiService]);

  // ── Reconnect bei Bedarf ─────────────────────────────────────────────────
  useEffect(() => {
    if (!webSocket.isConnected && token && currentUser) {
      webSocket.connect(currentUser.userId.toString(), token);
    }
  }, [webSocket.isConnected, token, currentUser, webSocket]);

  // ── WebSocket subscribe ──────────────────────────────────────────────────
  useEffect(() => {
    if (!webSocket.isConnected || !lobbyId) return;

    const subscription = webSocket.subscribe<LobbyMessage>(
        `/topic/lobby/${lobbyId}`,
        (msg) => {
          console.log(msg);
          if (msg.type === "LOBBY_STATE") {
            setLobby(msg.payload);
          } else if (msg.type === "GAME_START") {
            router.push(`/game/${lobbyId}`);
          }
        }
    );

    return () => subscription?.unsubscribe();
  }, [webSocket.isConnected, lobbyId, router, webSocket]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStartGame = () => {
    if (!webSocket.isConnected) {
      message.warning("Verbindung wird noch aufgebaut...");
      return;
    }
    if (!currentUser || !token) return;
    webSocket.publish(`/app/lobby/${lobbyId}/start`, {});
  };

  const handleLeave = () => {
    if (!currentUser || !token) return;
    webSocket.publish(`/app/lobby/${lobbyId}/leave`, {});
    intentionalDisconnect.current = true;
    router.push("/lobbies");
    webSocket.disconnect();
  };

  const isHost = lobby && currentUser ? lobby.adminId === currentUser.userId : false;

  if (!lobby) return <div className="page-center">Laden...</div>;

  return (
      <div className="page-center page-content">
        <div className="card card--lobby-wait">

          <div className="wait-header">
            <h2 className="wait-lobby-name">
              <span aria-hidden="true">🎮</span> {lobby.lobbyName}
            </h2>
            <span className="badge badge-waiting">Waiting...</span>
          </div>

          <div className="wait-meta-row">
          <span className="badge badge-inactive">
            {lobby.maxRounds || 0} rounds
          </span>
            <span className={`badge ${lobby.visibility === "PUBLIC" ? "badge-public" : "badge-private"}`}>
            {lobby.visibility === "PUBLIC" ? "🌍 Public" : "🔒 Private"}
          </span>
          </div>

          <div className="wait-section-label">
            Players ({lobby.players?.length || 0} / {lobby.maxPlayers})
          </div>

          <div className="wait-player-list">
            {lobby.players?.map((userDTO) => {
              const isMe = userDTO.username === currentUser?.username;
              const isPlayerHost = isMe && isHost;
              return (
                  <div
                      key={userDTO.username}
                      className={`wait-player-row ${isPlayerHost ? "wait-player-row--host" : ""}`}
                  >
                    <div className={`wait-player-avatar wait-player-avatar--${isPlayerHost ? "host" : "guest"}`}>
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

            <Button className="wait-leave-btn" onClick={handleLeave}>
              <span aria-hidden="true">🚪</span> {isHost ? "Leave & Transfer Host" : "Leave Lobby"}
            </Button>
          </div>

        </div>
      </div>
  );
};

export default LobbyWaitPage;