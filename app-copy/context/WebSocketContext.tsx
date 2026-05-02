"use client";
import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getApiDomain } from "@/utils/domain";
import { Message } from "@/types/message";
import {LobbyMessage} from "@/types/lobbyMessage";


interface WebSocketContextType {
  connect: (userId: string, token: string) => void;
  disconnect: () => void;
  subscribe: <T>(topic: string, callback: (payload: T) => void) => StompSubscription | undefined;
  publish: (destination: string, body: Message) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stompClient = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const credentials = useRef<{ userId: string; token: string } | null>(null);

  const connect = async (userId: string, token: string) => {
    if (stompClient.current?.active && 
      credentials.current?.userId === userId) {
    return;
  }
  if (stompClient.current) {
    console.log("Reconnecting with new credentials...");
    await stompClient.current.deactivate();
  }

    credentials.current = {userId, token};
    const socket = new SockJS(`${getApiDomain()}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { userId, token },
      onConnect: () => {
        console.log("WebSocket Tunnel Established!");
        setIsConnected(true);
      },
      onDisconnect: () => {
        setIsConnected(false)
        credentials.current = null;
        console.log("WebSocket Disconnected");
      },
    });

    client.activate();
    stompClient.current = client;
  };

  const subscribe = useCallback(<T,>(topic: string, callback: (payload: T) => void) => {
    if (!stompClient.current?.connected || !credentials.current) {
      console.log("WebSocket not connected, cannot subscribe to topic:", topic);
      return;
    }

    const { userId, token } = credentials.current;

    console.log("WebSocket subscribing to topic:", topic);
    return stompClient.current.subscribe(topic, (message: IMessage) => {
      const parsedBody: T = JSON.parse(message.body)
      callback(parsedBody);
    }, {userId, token});
  }, []);


  const publish = useCallback((destination: string, body: Message) => {
    if (stompClient.current?.connected && credentials.current) {
      const { userId, token } = credentials.current;
      stompClient.current.publish({
        destination,
        body: JSON.stringify(body),
        headers: {userId, token },
      });
    }
  }, []);

  const disconnect = () => {
    stompClient.current?.deactivate();
    stompClient.current = null;
    credentials.current = null;
    setIsConnected(false);
  };

  return (
    <WebSocketContext.Provider value={{ connect, disconnect, subscribe, publish, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error("useWebSocket must be used within WebSocketProvider");
  return context;
};