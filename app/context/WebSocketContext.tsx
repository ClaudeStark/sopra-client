"use client";
import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getApiDomain } from "@/utils/domain";

// Types
interface WebSocketContextType {
  connect: (userId: string, token: string) => void;
  disconnect: () => void;
  subscribe: <T>(topic: string, callback: (payload: T) => void) => StompSubscription | undefined;
  publish: (destination: string, body: object) => void;
  isConnected: boolean;
}

// Context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Provider
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stompClient = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const credentials = useRef<{ userId: string; token: string } | null>(null);

  const connect = useCallback((userId: string, token: string) => {
    // Bereits verbunden mit denselben credentials → nichts tun
    if (stompClient.current?.active && credentials.current?.userId === userId) {
      return;
    }

    // Alte Verbindung trennen falls vorhanden
    if (stompClient.current) {
      stompClient.current.deactivate();
    }

    credentials.current = { userId, token };

    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws`),
      connectHeaders: { userId, token },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("WebSocket connected!");
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
    });

    client.activate();
    stompClient.current = client;
  }, []);

  const disconnect = useCallback(() => {
    stompClient.current?.deactivate();
    stompClient.current = null;
    credentials.current = null;
    setIsConnected(false);
  }, []);

  const subscribe = useCallback(<T,>(topic: string, callback: (payload: T) => void) => {
    if (!stompClient.current?.connected || !credentials.current) {
      console.log("WebSocket not connected, cannot subscribe to:", topic);
      return;
    }
    const { userId, token } = credentials.current;
    return stompClient.current.subscribe(topic, (message: IMessage) => {
      const parsed: T = JSON.parse(message.body);
      callback(parsed);
    }, { userId, token });
  }, []);

  const publish = useCallback((destination: string, body: object) => {
    if (!stompClient.current?.connected || !credentials.current) {
      console.log("WebSocket not connected, cannot publish to:", destination);
      return;
    }
    const { userId, token } = credentials.current;
    stompClient.current.publish({
      destination,
      body: JSON.stringify(body),
      headers: { userId, token },
    });
  }, []);

  return (
      <WebSocketContext.Provider value={{ connect, disconnect, subscribe, publish, isConnected }}>
        {children}
      </WebSocketContext.Provider>
  );
};

// Hook
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error("useWebSocket must be used within WebSocketProvider");
  return context;
};