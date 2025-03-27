import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ConversationList } from "./conversation-list";
import { Chat } from "./chat";
import { MinusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/use-websocket";

export function MessagingPanel() {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: conversations } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/conversations`] : null,
    enabled: !!user,
  });

  useEffect(() => {
    if (socket && user) {
      socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_message") {
          // If the conversation is not active, increment unread count
          if (data.message.conversationId !== activeConversation) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      });
    }
  }, [socket, user, activeConversation]);

  const toggleMessagingPanel = () => {
    setIsOpen(!isOpen);
  };

  const handleConversationSelect = (conversationId: number) => {
    setActiveConversation(conversationId);
    setUnreadCount(Math.max(0, unreadCount - 1)); // Reduce unread count
  };

  return (
    <div 
      className={`fixed bottom-0 right-4 z-50 w-80 shadow-lg transform transition-transform ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ marginBottom: "0" }}
    >
      <div className="bg-zinc-900 rounded-t-xl border border-zinc-800 border-b-0 overflow-hidden">
        {/* Header */}
        <div 
          className="bg-primary-700 p-3 flex items-center justify-between cursor-pointer"
          onClick={toggleMessagingPanel}
        >
          <div className="flex items-center">
            <span className="mr-2">💬</span>
            <h3 className="font-medium">Messages</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <button className="text-white/80 hover:text-white" title="Minimize">
              <MinusIcon size={16} />
            </button>
            <button className="text-white/80 hover:text-white" title="Close">
              <XIcon size={16} />
            </button>
          </div>
        </div>
        
        {/* Messaging Content */}
        <div className="h-96 flex flex-col">
          {activeConversation ? (
            <Chat 
              conversationId={activeConversation}
              onBack={() => setActiveConversation(null)}
            />
          ) : (
            <ConversationList 
              conversations={conversations || []}
              onSelect={handleConversationSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
