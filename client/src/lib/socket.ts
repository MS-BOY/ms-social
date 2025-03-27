export function createWebSocket(userId: number) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.addEventListener("open", () => {
    console.log("WebSocket connection established");
    
    // Authenticate the WebSocket connection with user ID
    socket.send(JSON.stringify({
      type: "auth",
      userId
    }));
  });
  
  return socket;
}
