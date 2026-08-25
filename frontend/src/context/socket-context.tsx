
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef<Set<(order: OrderStatusUpdate) => void>>(new Set());

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("order:statusUpdated", (order: OrderStatusUpdate) => {
      callbacksRef.current.forEach((cb) => cb(order));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinSession = useCallback((sessionId: string) => {
    socket?.emit("join-session", sessionId);
  }, [socket]);

  const leaveSession = useCallback((sessionId: string) => {
    socket?.emit("leave-session", sessionId);
  }, [socket]);

  const onOrderStatusUpdate = useCallback((callback: (order: OrderStatusUpdate) => void) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
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