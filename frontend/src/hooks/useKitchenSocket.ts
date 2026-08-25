import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Order } from "@/types";

interface UseKitchenSocketOptions {
  accessToken: string;
  onNewOrder: (order: Order) => void;
  onOrderStatusUpdate: (order: Order) => void;
}

export function useKitchenSocket({ accessToken, onNewOrder, onOrderStatusUpdate }: UseKitchenSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Always connect directly to backend to avoid Vite proxy WebSocket issues
    const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:3000";

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-session", "kitchen");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("order:new", (order: Order) => {
      onNewOrder(order);
    });

    socket.on("order:statusUpdated", (order: Order) => {
      onOrderStatusUpdate(order);
    });

    return () => {
      socket.close();
    };
  }, [accessToken, onNewOrder, onOrderStatusUpdate]);

  return { isConnected };
}