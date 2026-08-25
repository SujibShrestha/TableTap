import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Order } from "@/types";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:3000";

interface UseKitchenSocketOptions {
  accessToken: string;
  onNewOrder: (order: Order) => void;
  onOrderStatusUpdate: (order: Order) => void;
}

export function useKitchenSocket({ accessToken, onNewOrder, onOrderStatusUpdate }: UseKitchenSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const onNewOrderRef = useRef(onNewOrder);
  const onStatusUpdateRef = useRef(onOrderStatusUpdate);

  useEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);
  useEffect(() => { onStatusUpdateRef.current = onOrderStatusUpdate; }, [onOrderStatusUpdate]);

  const socketRef = useRef<Socket | null>(null);
  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  useEffect(() => {
    const socket = socketRef.current!;

    const onConnect = () => {
      setIsConnected(true);
      socket.emit("join-session", "kitchen");
    };
    const onDisconnect = () => setIsConnected(false);
    const onNewOrder = (order: Order) => onNewOrderRef.current(order);
    const onStatusUpdate = (order: Order) => onStatusUpdateRef.current(order);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("order:new", onNewOrder);
    socket.on("order:statusUpdated", onStatusUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("order:new", onNewOrder);
      socket.off("order:statusUpdated", onStatusUpdate);
    };
  }, []);

  return { isConnected };
}
