import { useContext } from "react";
import { SocketContext } from "@/contexts/socket-context";

export function useWebSocket() {
  return useContext(SocketContext);
}
