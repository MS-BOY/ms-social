import { createContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      // User is not logged in, disconnect WebSocket if connected
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Set up WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.addEventListener("open", () => {
      setIsConnected(true);
      console.log("WebSocket connected");
      
      // Authenticate the WebSocket connection with user ID
      newSocket.send(JSON.stringify({
        type: "auth",
        userId: user.id
      }));
    });

    newSocket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === "new_message" && data.message) {
          // Message handled by individual components
        } else if (data.type === "error") {
          console.error("WebSocket error:", data.message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    newSocket.addEventListener("close", () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
      
      // Attempt to reconnect after delay if user is still logged in
      setTimeout(() => {
        if (user) {
          console.log("Attempting to reconnect WebSocket...");
        }
      }, 3000);
    });

    newSocket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection error",
        description: "Failed to establish real-time connection. Some features may be limited.",
        variant: "destructive",
      });
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.close();
    };
  }, [user, toast]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
