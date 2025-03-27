import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: any[];
  onSelect: (conversationId: number) => void;
}

export function ConversationList({ conversations, onSelect }: ConversationListProps) {
  const { user } = useAuth();

  if (!user) return null;

  // Function to get other participants (for display name)
  const getOtherParticipants = (conversation: any) => {
    return conversation.participants?.filter((p: any) => p.id !== user.id) || [];
  };

  // Get conversation name
  const getConversationName = (conversation: any) => {
    if (conversation.isGroup && conversation.name) {
      return conversation.name;
    }
    
    const others = getOtherParticipants(conversation);
    if (others.length === 0) return "No participants";
    
    return others.map((p: any) => p.displayName).join(", ");
  };

  // Get avatar for conversation
  const getConversationAvatar = (conversation: any) => {
    if (conversation.isGroup) {
      return null; // Group avatar
    }
    
    const others = getOtherParticipants(conversation);
    if (others.length === 0) return null;
    
    return others[0].avatar;
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Format time
  const formatMessageTime = (date: string) => {
    if (!date) return "";
    
    const messageDate = new Date(date);
    const now = new Date();
    
    // Today
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollArea className="h-full overflow-y-auto p-2 space-y-1">
      {conversations.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No conversations yet</p>
          <p className="text-sm">Start chatting with someone!</p>
        </div>
      ) : (
        conversations.map((conversation: any) => {
          const isOnline = Math.random() > 0.5; // Mock online status
          const lastMessage = conversation.lastMessage;
          
          return (
            <div
              key={conversation.id}
              className={cn(
                "flex items-center p-2 hover:bg-zinc-950 rounded-lg cursor-pointer",
                conversation.unread && "bg-primary-900/20"
              )}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="relative">
                {conversation.isGroup ? (
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                    <span>G</span>
                  </div>
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getConversationAvatar(conversation)} />
                    <AvatarFallback>{getInitials(getConversationName(conversation))}</AvatarFallback>
                  </Avatar>
                )}
                <span 
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900",
                    isOnline ? "bg-green-500" : "bg-gray-500"
                  )}
                ></span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium text-white truncate">{getConversationName(conversation)}</p>
                  {lastMessage && (
                    <span className="text-xs text-gray-400">{formatMessageTime(lastMessage.createdAt)}</span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {lastMessage ? lastMessage.content : "No messages yet"}
                </p>
              </div>
            </div>
          );
        })
      )}
    </ScrollArea>
  );
}
