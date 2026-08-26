import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Order } from "@/types";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:3000";

export interface SessionClosedPayload {
  sessionId: string;
  tableId?: string;
  closedAt?: string;
}

interface UseWaiterSocketOptions {
  accessToken: string;
  onOrderStatusUpdate: (order: Order) => void;
  onNewOrder: (order: Order) => void;
  onSessionClosed?: (payload: SessionClosedPayload) => void;
}

export function useWaiterSocket({ accessToken, onOrderStatusUpdate, onNewOrder, onSessionClosed }: UseWaiterSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const onStatusUpdateRef = useRef(onOrderStatusUpdate);
  const onNewOrderRef = useRef(onNewOrder);
  const onSessionClosedRef = useRef(onSessionClosed);

  useEffect(() => { onStatusUpdateRef.current = onOrderStatusUpdate; }, [onOrderStatusUpdate]);
  useEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);
  useEffect(() => { onSessionClosedRef.current = onSessionClosed; }, [onSessionClosed]);

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
    const handleSessionClosed = (payload: SessionClosedPayload) => onSessionClosedRef.current?.(payload);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("order:new", handleNewOrder);
    socket.on("order:statusUpdated", handleStatusUpdate);
    socket.on("session:closed", handleSessionClosed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("order:new", handleNewOrder);
      socket.off("order:statusUpdated", handleStatusUpdate);
      socket.off("session:closed", handleSessionClosed);
    };
  }, []);

  return { isConnected };
}
