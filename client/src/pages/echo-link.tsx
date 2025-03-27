import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MessagingPanel } from "@/components/messaging/messaging-panel";
import { SparklesCore } from "@/components/ui/sparkles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EchoLinkModal } from "@/components/modals/echo-link-modal";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LinkIcon, SendIcon, CheckIcon, MessageSquareIcon } from "lucide-react";

export default function EchoLink() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEchoLinkModalOpen, setIsEchoLinkModalOpen] = useState(false);
  const [anonymousMessage, setAnonymousMessage] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // Get user's Echo Link
  const { data: echoLink } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/echo-link`] : null,
    enabled: !!user,
  });

  // Get anonymous messages for Echo Link
  const { data: anonymousMessages } = useQuery({
    queryKey: echoLink ? [`/api/echo-links/${echoLink.id}/messages`] : null,
    enabled: !!echoLink,
  });

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Copy Echo Link to clipboard
  const copyEchoLink = () => {
    if (!echoLink) return;
    
    const linkToCopy = `echo.social/${echoLink.linkId}`;
    navigator.clipboard.writeText(linkToCopy);
    
    toast({
      title: "Link copied",
      description: "Your Echo Link has been copied to clipboard"
    });
  };

  // Send a test anonymous message to yourself
  const sendTestMessage = async () => {
    if (!echoLink || !anonymousMessage.trim()) return;
    
    setMessageSending(true);
    try {
      await apiRequest("POST", "/api/anonymous-messages", {
        echoLinkId: echoLink.id,
        content: anonymousMessage.trim()
      });
      
      // Refresh anonymous messages
      queryClient.invalidateQueries({ queryKey: [`/api/echo-links/${echoLink.id}/messages`] });
      
      setAnonymousMessage("");
      
      toast({
        title: "Message sent",
        description: "Test message sent successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setMessageSending(false);
    }
  };

  // Mark anonymous message as answered
  const markAsAnswered = async (messageId: number) => {
    try {
      await apiRequest("PATCH", `/api/anonymous-messages/${messageId}`, {
        answered: true
      });
      
      // Refresh anonymous messages
      queryClient.invalidateQueries({ queryKey: [`/api/echo-links/${echoLink?.id}/messages`] });
      
      toast({
        title: "Success",
        description: "Message marked as answered"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update message",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

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
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Echo Link</h1>
            
            {echoLink ? (
              <>
                {/* Echo Link Info */}
                <div className="bg-zinc-900 rounded-xl p-6 mb-6 border border-zinc-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">Your Echo Link</h2>
                      <p className="text-gray-400 mb-4 md:mb-0">Send this link to receive anonymous messages</p>
                    </div>
                    <Button 
                      className="bg-primary-600 hover:bg-primary-700"
                      onClick={() => setIsEchoLinkModalOpen(true)}
                    >
                      <LinkIcon size={16} className="mr-2" />
                      Edit Link
                    </Button>
                  </div>
                  
                  <div className="flex items-center bg-zinc-950 p-3 rounded-lg mb-4">
                    <span className="flex-1 font-medium">echo.social/{echoLink.linkId}</span>
                    <Button 
                      variant="ghost" 
                      className="text-primary-400 hover:text-primary-300 hover:bg-zinc-900"
                      onClick={copyEchoLink}
                    >
                      Copy
                    </Button>
                  </div>
                  
                  <div className="bg-zinc-950 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">Welcome Message:</p>
                    <p className="text-gray-300">{echoLink.welcomeMessage || "Ask me anything..."}</p>
                  </div>
                </div>
                
                {/* Messages Tab */}
                <Tabs defaultValue="received" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
                    <TabsTrigger value="received">Received Messages</TabsTrigger>
                    <TabsTrigger value="test">Test Your Link</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="received" className="space-y-4">
                    {anonymousMessages && anonymousMessages.length > 0 ? (
                      anonymousMessages.map((message: any) => (
                        <div 
                          key={message.id} 
                          className={`bg-zinc-900 rounded-xl p-4 border ${
                            message.answered ? 'border-zinc-800' : 'border-primary-800'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400">
                              {formatTimestamp(message.createdAt)}
                            </span>
                            {!message.answered && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary-400 hover:text-primary-300"
                                onClick={() => markAsAnswered(message.id)}
                              >
                                <CheckIcon size={14} className="mr-1" />
                                Mark as answered
                              </Button>
                            )}
                          </div>
                          <p className="text-gray-100 whitespace-pre-wrap">{message.content}</p>
                          {message.answered && (
                            <div className="mt-2 flex items-center">
                              <span className="text-xs bg-primary-900/30 text-primary-300 px-2 py-1 rounded">
                                Answered
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-zinc-900 rounded-xl p-8 text-center">
                        <MessageSquareIcon size={48} className="mx-auto text-gray-500 mb-4" />
                        <p className="text-xl font-medium mb-2">No messages yet</p>
                        <p className="text-gray-400">Share your Echo Link to receive anonymous messages</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="test" className="space-y-4">
                    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                      <h3 className="text-lg font-medium mb-3">Test Your Echo Link</h3>
                      <p className="text-gray-400 mb-4">
                        Send yourself an anonymous message to see how it works
                      </p>
                      
                      <Textarea 
                        placeholder="Write an anonymous message..." 
                        className="bg-zinc-950 border-zinc-800 mb-4"
                        rows={4}
                        value={anonymousMessage}
                        onChange={(e) => setAnonymousMessage(e.target.value)}
                      />
                      
                      <Button 
                        className="bg-primary-600 hover:bg-primary-700 w-full"
                        onClick={sendTestMessage}
                        disabled={!anonymousMessage.trim() || messageSending}
                      >
                        <SendIcon size={16} className="mr-2" />
                        Send Test Message
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              // No Echo Link created yet
              <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800">
                <LinkIcon size={48} className="mx-auto text-gray-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">You don't have an Echo Link yet</h2>
                <p className="text-gray-400 mb-6">
                  Create your Echo Link to receive anonymous messages and questions from anyone
                </p>
                <Button 
                  className="bg-primary-600 hover:bg-primary-700"
                  onClick={() => setIsEchoLinkModalOpen(true)}
                >
                  <LinkIcon size={16} className="mr-2" />
                  Create Echo Link
                </Button>
              </div>
            )}
          </div>
        </main>
        
        <RightSidebar />
        
        <MobileNavigation />
      </div>
      
      {/* Messaging Panel */}
      <MessagingPanel />
      
      {/* Echo Link Modal */}
      <EchoLinkModal 
        isOpen={isEchoLinkModalOpen}
        onClose={() => setIsEchoLinkModalOpen(false)}
      />
    </div>
  );
}
