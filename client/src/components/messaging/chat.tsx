import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { ArrowLeftIcon, SendIcon, PhoneIcon, VideoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatProps {
  conversationId: number;
  onBack: () => void;
}

export function Chat({ conversationId, onBack }: ChatProps) {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get conversation data
  const { data: conversation } = useQuery({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId,
  });

  // Get conversation participants
  const { data: participants } = useQuery({
    queryKey: [`/api/conversations/${conversationId}/participants`],
    enabled: !!conversationId,
  });

  // Get conversation messages
  const { data: conversationMessages } = useQuery({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
  });

  // Update messages when data changes
  useEffect(() => {
    if (conversationMessages) {
      setMessages(conversationMessages);
    }
  }, [conversationMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Listen for new messages from WebSocket
  useEffect(() => {
    if (socket) {
      const messageHandler = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_message" && data.message.conversationId === conversationId) {
          setMessages((prev) => [...prev, data.message]);
        }
      };

      socket.addEventListener("message", messageHandler);

      return () => {
        socket.removeEventListener("message", messageHandler);
      };
    }
  }, [socket, conversationId]);

  // Get participant data by ID
  const getParticipant = (userId: number) => {
    if (!participants) return null;
    return participants.find((p: any) => p.userId === userId);
  };

  // Get user data for a participant
  const { data: participantsData } = useQuery({
    queryKey: [`/api/users/${conversationId}/participants`],
    enabled: !!participants,
  });

  // Get conversation name
  const getConversationName = () => {
    if (conversation?.isGroup && conversation?.name) {
      return conversation.name;
    }

    if (!participants || !participantsData) return "Chat";

    const otherParticipants = participantsData.filter((p: any) => p.id !== user?.id);
    if (otherParticipants.length === 0) return "No participants";

    return otherParticipants.map((p: any) => p.displayName).join(", ");
  };

  // Get avatar for conversation
  const getConversationAvatar = () => {
    if (conversation?.isGroup) {
      return null;
    }

    if (!participantsData) return null;
    
    const otherParticipants = participantsData.filter((p: any) => p.id !== user?.id);
    if (otherParticipants.length === 0) return null;

    return otherParticipants[0].avatar;
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

  // Format message time
  const formatMessageTime = (date: string) => {
    if (!date) return "";
    
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Send a new message
  const sendMessage = () => {
    if (!user || !message.trim()) return;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "message",
        conversationId,
        userId: user.id,
        content: message.trim()
      }));
      
      // Add message to local state (optimistic update)
      const newMessage = {
        id: Date.now(), // temporary ID
        conversationId,
        senderId: user.id,
        content: message.trim(),
        createdAt: new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
    } else {
      toast({
        title: "Error",
        description: "Connection issue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center">
        <button 
          className="mr-2 text-gray-400 hover:text-white"
          onClick={onBack}
        >
          <ArrowLeftIcon size={18} />
        </button>
        
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={getConversationAvatar()} />
          <AvatarFallback>{getInitials(getConversationName())}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{getConversationName()}</p>
        </div>
        
        <div className="flex space-x-2">
          <button className="text-gray-400 hover:text-primary-400" title="Voice call">
            <PhoneIcon size={18} />
          </button>
          <button className="text-gray-400 hover:text-primary-400" title="Video call">
            <VideoIcon size={18} />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMine = msg.senderId === user?.id;
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isMine ? 'order-2' : 'order-1'}`}>
                    {!isMine && (
                      <Avatar className="h-6 w-6 mb-1 inline-block mr-1">
                        <AvatarImage src={getParticipant(msg.senderId)?.avatar} />
                        <AvatarFallback>{getInitials(getParticipant(msg.senderId)?.displayName || "")}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`${
                      isMine 
                        ? 'bg-primary-700 text-white rounded-t-lg rounded-bl-lg' 
                        : 'bg-zinc-800 text-white rounded-t-lg rounded-br-lg'
                    } p-3 break-words text-sm`}>
                      {msg.content}
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <div className="p-3 border-t border-zinc-800 flex items-center">
        <Input 
          type="text" 
          placeholder="Type a message..." 
          className="flex-1 bg-zinc-950 text-white border-zinc-800"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button 
          className="ml-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full w-9 h-9 p-0 flex items-center justify-center"
          onClick={sendMessage}
          disabled={!message.trim()}
        >
          <SendIcon size={16} />
        </Button>
      </div>
    </div>
  );
}
