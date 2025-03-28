import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Check, MessageSquare, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>({});
  
  // Search for users
  const { data: searchResults, isLoading: isLoadingResults, refetch } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      setIsSearching(true);
      try {
        const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const result = await response.json();
        return Array.isArray(result) ? result : [];
      } finally {
        setIsSearching(false);
      }
    },
    enabled: false, // Don't run query automatically
  });

  // Get user's following to check if they follow a user
  const { data: following } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/following`] : ["following-none"],
    enabled: !!user,
  });

  // Check if current user follows a given user
  const isFollowing = (userId: number) => {
    if (!following) return false;
    return (following as any[]).some((followedUser: any) => followedUser.id === userId);
  };

  // Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    refetch();
  };

  // Follow a user
  const handleFollow = async (targetUserId: number) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to follow users",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
      
      await apiRequest("POST", "/api/follows", {
        followerId: user.id,
        followingId: targetUserId
      });
      
      // Invalidate queries to refresh follower/following lists
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/following`] });
      
      toast({
        title: "Success",
        description: "User followed successfully",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Unfollow a user
  const handleUnfollow = async (targetUserId: number) => {
    if (!user || !following) return;
    
    try {
      // Find the follow relationship
      const followRelationship = (following as any[]).find((f: any) => f.id === targetUserId);
      if (!followRelationship || !followRelationship.followId) {
        toast({
          title: "Error",
          description: "Follow relationship not found",
          variant: "destructive"
        });
        return;
      }
      
      setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
      
      await apiRequest("DELETE", `/api/follows/${followRelationship.followId}`, undefined);
      
      // Invalidate queries to refresh the followers/following lists
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/following`] });
      
      toast({
        title: "Success",
        description: "User unfollowed successfully",
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Start a conversation with a user
  const startConversation = async (targetUserId: number) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create a new conversation
      const conversationResponse = await apiRequest("POST", "/api/conversations", {
        name: `Conversation with ${targetUserId}`, // This can be generated better in a real app
      });
      
      const conversation = await conversationResponse.json();
      
      // Add both users as participants
      await apiRequest("POST", "/api/conversation-participants", {
        conversationId: conversation?.id || 0,
        userId: user.id
      });
      
      await apiRequest("POST", "/api/conversation-participants", {
        conversationId: conversation?.id || 0,
        userId: targetUserId
      });
      
      // Redirect to messages page
      setLocation("/messages");
      
      toast({
        title: "Success",
        description: "Conversation started",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-4 shadow-md">
      <h2 className="text-xl font-bold mb-4">Find People</h2>
      
      <div className="flex gap-2 mb-4">
        <Input
          className="bg-zinc-800 border-zinc-700 text-white"
          placeholder="Search users by name or username"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>
      
      {isLoadingResults && (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500" />
          <p className="text-gray-400 mt-2">Searching users...</p>
        </div>
      )}
      
      {searchResults && searchResults.length === 0 && searchQuery.trim() && !isLoadingResults && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-300">No users found</p>
          <p className="text-gray-400">Try a different search term</p>
        </div>
      )}
      
      {searchResults && searchResults.length > 0 && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-700">
              {searchResults.map((searchUser: any) => (
                <div key={searchUser.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={searchUser.avatar} alt={searchUser.displayName} />
                      <AvatarFallback>{getInitials(searchUser.displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{searchUser.displayName}</p>
                      <p className="text-sm text-gray-400">@{searchUser.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-zinc-700 hover:bg-zinc-600 border-zinc-600 text-white"
                      onClick={() => startConversation(searchUser.id)}
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Message
                    </Button>
                    
                    {user && user.id !== searchUser.id && (
                      isFollowing(searchUser.id) ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-primary-600 hover:bg-primary-700 border-primary-600"
                          onClick={() => handleUnfollow(searchUser.id)}
                          disabled={followLoading[searchUser.id]}
                        >
                          {followLoading[searchUser.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check size={14} className="mr-1" />
                              Following
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                          onClick={() => handleFollow(searchUser.id)}
                          disabled={followLoading[searchUser.id]}
                        >
                          {followLoading[searchUser.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus size={14} className="mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}