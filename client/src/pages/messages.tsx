import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MessagingPanel } from "@/components/messaging/messaging-panel";
import { SparklesCore } from "@/components/ui/sparkles";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquareIcon, SearchIcon, PhoneIcon, VideoIcon, SendIcon, PlusIcon } from "lucide-react";
import { Chat } from "@/components/messaging/chat";
import { CallModal } from "@/components/modals/call-modal";

export default function Messages() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // Get user conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/conversations`] : null,
    enabled: !!user,
  });

  // Search users
  const { data: searchResults, refetch: searchUsers } = useQuery({
    queryKey: [`/api/users/search`, searchQuery],
    enabled: false,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await searchUsers();
  };

  const startConversation = async (userId: number) => {
    if (!user) return;
    
    try {
      // Create new conversation
      const conversation = await apiRequest("POST", "/api/conversations", {
        isGroup: false
      });
      const conversationData = await conversation.json();
      
      // Add participants
      await apiRequest("POST", "/api/conversation-participants", {
        conversationId: conversationData.id,
        userId: user.id
      });
      
      await apiRequest("POST", "/api/conversation-participants", {
        conversationId: conversationData.id,
        userId: userId
      });
      
      // Set as active conversation
      setActiveConversation(conversationData.id);
      setSearchQuery("");
      
      toast({
        title: "Conversation started",
        description: "You can now start messaging"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const initiateCall = (userData: any, video: boolean) => {
    setSelectedUser(userData);
    setIsVideoCall(video);
    setIsCallModalOpen(true);
  };

  // Get conversation data including participants
  const { data: activeConversationData } = useQuery({
    queryKey: activeConversation ? [`/api/conversations/${activeConversation}`] : null,
    enabled: !!activeConversation,
  });

  // Get participants for active conversation
  const { data: participants } = useQuery({
    queryKey: activeConversation ? [`/api/conversations/${activeConversation}/participants`] : null,
    enabled: !!activeConversation,
  });

  // Get user data for participants
  const { data: participantUsers } = useQuery({
    queryKey: participants ? [`/api/users/participants`] : null,
    enabled: !!participants,
  });

  // Get other user in conversation (for 1:1 chats)
  const getOtherUser = () => {
    if (!participants || !participantUsers || !user) return null;
    
    const otherParticipant = participants.find((p: any) => p.userId !== user.id);
    if (!otherParticipant) return null;
    
    return participantUsers.find((u: any) => u.id === otherParticipant.userId);
  };

  // Format last message preview
  const getLastMessagePreview = (conversation: any) => {
    if (!conversation.lastMessage) return "No messages yet";
    if (conversation.lastMessage.content.length > 30) {
      return conversation.lastMessage.content.substring(0, 30) + "...";
    }
    return conversation.lastMessage.content;
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
  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  const otherUser = getOtherUser();

  return (
    <div className="relative min-h-screen bg-zinc-950 text-gray-200 font-sans flex flex-col">
      {/* Particle Background Effect */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <SparklesCore
          background="#121212"
          particleColor="#6366F1"
          particleDensity={50}
          minSize={1}
          maxSize={2}
          speed={2}
        />
        <div className="absolute inset-x-20 top-1/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
        <div className="absolute inset-x-20 top-1/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
      </div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row min-h-screen relative">
        <Sidebar />
        
        <main className="flex-1 min-w-0 overflow-hidden pb-16 md:pb-0">
          <div className="h-screen flex flex-col bg-zinc-950">
            <div className="border-b border-zinc-800 p-4">
              <h1 className="text-2xl font-bold">Messages</h1>
            </div>
            
            <div className="flex flex-1 min-h-0">
              {/* Conversations List */}
              <div className={`${activeConversation ? 'hidden md:block' : ''} w-full md:w-1/3 border-r border-zinc-800`}>
                <div className="p-3">
                  <div className="relative mb-3">
                    <Input 
                      type="text" 
                      placeholder="Search people..." 
                      className="bg-zinc-900 border-zinc-800 pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <Button 
                      className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-white"
                      variant="ghost"
                      onClick={handleSearch}
                    >
                      <PlusIcon size={18} />
                    </Button>
                  </div>
                  
                  {/* Search Results */}
                  {searchQuery && searchResults && (
                    <ScrollArea className="h-48 mb-3 overflow-y-auto rounded-lg bg-zinc-900 p-2">
                      {searchResults.length > 0 ? (
                        searchResults
                          .filter((result: any) => result.id !== user.id) // Exclude current user
                          .map((result: any) => (
                            <div 
                              key={result.id} 
                              className="flex items-center p-2 hover:bg-zinc-800 rounded-lg cursor-pointer"
                              onClick={() => startConversation(result.id)}
                            >
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={result.avatar} alt={result.displayName} />
                                <AvatarFallback>{getInitials(result.displayName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{result.displayName}</p>
                                <p className="text-xs text-gray-400">@{result.username}</p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p>No users found</p>
                        </div>
                      )}
                    </ScrollArea>
                  )}
                  
                  {/* Conversations */}
                  <ScrollArea className="h-[calc(100vh-200px)] overflow-y-auto">
                    {conversationsLoading ? (
                      <div className="text-center py-10">
                        <p>Loading conversations...</p>
                      </div>
                    ) : conversations && conversations.length > 0 ? (
                      conversations.map((conversation: any) => {
                        const isActive = conversation.id === activeConversation;
                        
                        return (
                          <div 
                            key={conversation.id}
                            className={`flex items-center p-3 rounded-lg cursor-pointer mb-1 ${
                              isActive ? 'bg-primary-900/30' : 'hover:bg-zinc-900'
                            }`}
                            onClick={() => setActiveConversation(conversation.id)}
                          >
                            <Avatar className="h-12 w-12 mr-3">
                              <AvatarImage src={conversation.avatar} alt={conversation.name || "Conversation"} />
                              <AvatarFallback>
                                {conversation.isGroup ? 'G' : getInitials(conversation.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline">
                                <p className="font-medium truncate">{conversation.name || "New conversation"}</p>
                                {conversation.lastMessage && (
                                  <span className="text-xs text-gray-400">
                                    {formatTime(conversation.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 truncate">
                                {getLastMessagePreview(conversation)}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="ml-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10">
                        <MessageSquareIcon size={48} className="mx-auto text-gray-500 mb-4" />
                        <p className="text-xl font-medium mb-2">No conversations yet</p>
                        <p className="text-gray-400 mb-4">Search for people to start chatting</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
              
              {/* Active Conversation / Chat */}
              <div className={`${activeConversation ? 'block' : 'hidden md:block'} w-full md:w-2/3 flex flex-col`}>
                {activeConversation ? (
                  <>
                    {/* Chat component */}
                    <Chat 
                      conversationId={activeConversation}
                      onBack={() => setActiveConversation(null)}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8">
                      <MessageSquareIcon size={64} className="mx-auto text-gray-600 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                      <p className="text-gray-400">Choose an existing conversation or start a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        
        <RightSidebar />
        
        <MobileNavigation />
      </div>
      
      {/* Call Modal */}
      <CallModal 
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        isVideo={isVideoCall}
        caller={selectedUser}
      />
    </div>
  );
}
