import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { createWebSocket } from "../lib/socket";

interface AuthReturnType {
  user: { id: number } | null;
  isLoading: boolean;
}

export function useWebSocket() {
  const { user } = useAuth() as AuthReturnType;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only create a socket if user is authenticated
    if (user) {
      const newSocket = createWebSocket(user.id);
      
      // Handle connection open
      newSocket.addEventListener("open", () => {
        setIsConnected(true);
      });
      
      // Handle connection close
      newSocket.addEventListener("close", () => {
        setIsConnected(false);
      });
      
      // Handle errors
      newSocket.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      });
      
      setSocket(newSocket);
      
      // Clean up when component unmounts
      return () => {
        newSocket.close();
      };
    }
  }, [user]);
  
  return { socket, isConnected };
}