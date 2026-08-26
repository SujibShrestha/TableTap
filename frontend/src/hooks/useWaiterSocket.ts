import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Order } from "@/types";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:3000";

interface UseWaiterSocketOptions {
  accessToken: string;
  onOrderStatusUpdate: (order: Order) => void;
  onNewOrder: (order: Order) => void;
}

export function useWaiterSocket({ accessToken, onOrderStatusUpdate, onNewOrder }: UseWaiterSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const onStatusUpdateRef = useRef(onOrderStatusUpdate);
  const onNewOrderRef = useRef(onNewOrder);

  useEffect(() => { onStatusUpdateRef.current = onOrderStatusUpdate; }, [onOrderStatusUpdate]);
  useEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);

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

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const handleNewOrder = (order: Order) => onNewOrderRef.current(order);
    const handleStatusUpdate = (order: Order) => onStatusUpdateRef.current(order);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("order:new", handleNewOrder);
    socket.on("order:statusUpdated", handleStatusUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("order:new", handleNewOrder);
      socket.off("order:statusUpdated", handleStatusUpdate);
    };
  }, []);

  return { isConnected };
}
