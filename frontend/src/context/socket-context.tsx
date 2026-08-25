
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

interface OrderStatusUpdate {
  id: string;
  sessionId: string;
  status: string;
  updatedByStaffId: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    menuItemId: string;
    quantity: number;
    unitPrice: string;
    costPriceAtOrder: string;
    menuItem: {
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      price: string;
    } | null;
  }>;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  onOrderStatusUpdate: (callback: (order: OrderStatusUpdate) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:3000";

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef<Set<(order: OrderStatusUpdate) => void>>(new Set());

  const socketRef = useRef<Socket | null>(null);
  if (!socketRef.current) {
    const accessToken = localStorage.getItem("tabletap.auth")
      ? JSON.parse(localStorage.getItem("tabletap.auth")!).accessToken
      : undefined;

    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  useEffect(() => {
    const newSocket = socketRef.current!;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onOrderStatusUpdate = (order: OrderStatusUpdate) => {
      callbacksRef.current.forEach((cb) => cb(order));
    };

    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("order:statusUpdated", onOrderStatusUpdate);

    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("order:statusUpdated", onOrderStatusUpdate);
    };
  }, []);

  const joinSession = useCallback((sessionId: string) => {
    socketRef.current?.emit("join-session", sessionId);
  }, []);

  const leaveSession = useCallback((sessionId: string) => {
    socketRef.current?.emit("leave-session", sessionId);
  }, []);

  const onOrderStatusUpdate = useCallback((callback: (order: OrderStatusUpdate) => void) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinSession,
        leaveSession,
        onOrderStatusUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
