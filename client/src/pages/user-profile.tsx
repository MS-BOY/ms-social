import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { SparklesCore } from "@/components/ui/sparkles";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/post-card";
import { MessageSquareIcon, ArrowLeftIcon, CalendarIcon, UsersIcon, UserPlusIcon, UserMinusIcon, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Define a simple spinner component
function LoadingSpinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`animate-spin ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
    </div>
  );
}

export default function UserProfile() {
  const [, params] = useRoute<{ username: string }>("/user/:username");
  const username = params?.username;
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Loading states for follow/unfollow actions
  const [followLoading, setFollowLoading] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  // Get the profile of the user being viewed
  const { data: profileUser, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/search`, username || ""],
    queryFn: async () => {
      if (!username) return null;
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(username)}`);
      const data = await response.json();
      // Find the exact username match
      const exactMatch = data.find((u: any) => u.username === username);
      if (!exactMatch) {
        throw new Error("User not found");
      }
      return exactMatch;
    },
    enabled: !!username
  });

  // Get user's posts
  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: profileUser ? [`/api/users/${profileUser.id}/posts`] : ["posts-none"],
    enabled: !!profileUser,
  });

  // Get user's followers
  const { data: followers, isLoading: followersLoading } = useQuery({
    queryKey: profileUser ? [`/api/users/${profileUser.id}/followers`] : ["followers-none"],
    enabled: !!profileUser,
  });

  // Get user's following
  const { data: following, isLoading: followingLoading } = useQuery({
    queryKey: profileUser ? [`/api/users/${profileUser.id}/following`] : ["following-none"],
    enabled: !!profileUser,
  });

  // Get current user's following to determine if they follow the profile user
  const { data: currentUserFollowing, isLoading: currentUserFollowingLoading } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/following`] : ["current-following-none"],
    enabled: !!user && !!profileUser,
  });

  // Check if current user follows this profile
  const isFollowing = () => {
    if (!currentUserFollowing || !profileUser || !user) return false;
    // Handle type checking to ensure we have an array
    if (Array.isArray(currentUserFollowing)) {
      return currentUserFollowing.some((f: any) => f.id === profileUser.id);
    }
    return false;
  };

  // Find the follow relationship ID
  const getFollowId = () => {
    if (!currentUserFollowing || !profileUser) return null;
    // Handle type checking to ensure we have an array
    if (Array.isArray(currentUserFollowing)) {
      const relationship = currentUserFollowing.find((f: any) => f.id === profileUser.id);
      return relationship?.followId;
    }
    return null;
  };

  // Follow a user
  const handleFollow = async () => {
    if (!user || !profileUser) return;
    
    try {
      setFollowLoading(true);
      
      await apiRequest("POST", "/api/follows", {
        followerId: user.id,
        followingId: profileUser.id
      });
      
      // Invalidate queries to refresh follow lists
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUser.id}/followers`] });
      
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
      setFollowLoading(false);
    }
  };

  // Unfollow a user
  const handleUnfollow = async () => {
    if (!user || !profileUser) return;
    
    const followId = getFollowId();
    if (!followId) {
      toast({
        title: "Error",
        description: "Follow relationship not found",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setFollowLoading(true);
      
      await apiRequest("DELETE", `/api/follows/${followId}`);
      
      // Invalidate queries to refresh follow lists
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUser.id}/followers`] });
      
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
      setFollowLoading(false);
    }
  };

  // Start a conversation with this user
  const startConversation = async () => {
    if (!user || !profileUser) return;
    
    try {
      setIsStartingConversation(true);
      
      // Create a new conversation
      const conversationResponse = await apiRequest("POST", "/api/conversations", {
        name: `Conversation with ${profileUser.id}`,
        isGroup: false
      });
      const conversationData = await conversationResponse.json();
      
      // Add participants
      await apiRequest("POST", "/api/conversation-participants", {
        conversationId: conversationData.id,
        userId: user.id
      });
      
      await apiRequest("POST", "/api/conversation-participants", {
        conversationId: conversationData.id,
        userId: profileUser.id
      });
      
      toast({
        title: "Conversation started",
        description: "You can now message this user"
      });
      
      // Navigate to messages
      setLocation("/messages");
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStartingConversation(false);
    }
  };

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">User not found</h1>
          <p className="text-gray-400 mb-4">The user you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Format date to display "Joined [Month] [Year]"
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Joined ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  };

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
          <div className="max-w-3xl mx-auto">
            {/* Profile Header */}
            <div className="bg-zinc-900 border-b border-zinc-800">
              {/* Back Navigation */}
              <div className="px-4 py-3 flex items-center border-b border-zinc-800">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mr-2"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeftIcon size={18} />
                </Button>
                <h1 className="text-xl font-bold">{profileUser.displayName}</h1>
              </div>
              
              {/* Cover Photo */}
              <div className="h-32 sm:h-48 bg-gradient-to-r from-primary-900 to-primary-700"></div>
              
              {/* Profile Info */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 relative">
                {/* Avatar */}
                <div className="absolute -top-16 left-6 border-4 border-zinc-900 rounded-full">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileUser.avatar} alt={profileUser.displayName} />
                    <AvatarFallback>{getInitials(profileUser.displayName)}</AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Actions */}
                {user && user.id !== profileUser.id && (
                  <div className="flex justify-end mb-12 sm:mb-0 space-x-2">
                    <Button 
                      variant="outline" 
                      className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                      onClick={startConversation}
                      disabled={isStartingConversation}
                    >
                      <MessageSquareIcon size={16} className="mr-2" />
                      {isStartingConversation ? 'Starting...' : 'Message'}
                    </Button>
                    
                    {isFollowing() ? (
                      <Button 
                        variant="outline" 
                        className="bg-primary-600 hover:bg-primary-700 border-primary-600"
                        onClick={handleUnfollow}
                        disabled={followLoading}
                      >
                        {followLoading ? (
                          <span className="animate-pulse">Loading...</span>
                        ) : (
                          <>
                            <Check size={16} className="mr-2" />
                            Following
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {followLoading ? (
                          <span className="animate-pulse">Loading...</span>
                        ) : (
                          <>
                            <UserPlusIcon size={16} className="mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
                
                {/* User Info */}
                <div className="mt-2 sm:mt-0">
                  <h1 className="text-xl sm:text-2xl font-bold">{profileUser.displayName}</h1>
                  <p className="text-gray-400 mb-2">@{profileUser.username}</p>
                  
                  {profileUser.bio && (
                    <p className="mb-3">{profileUser.bio}</p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-400 mb-3">
                    <CalendarIcon size={14} className="mr-1" />
                    <span>{formatJoinDate(profileUser.createdAt || new Date().toISOString())}</span>
                  </div>
                  
                  <div className="flex space-x-4 mb-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-white">
                        {Array.isArray(following) ? following.length : 0}
                      </span>
                      <span className="ml-1 text-gray-400">Following</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-white">
                        {Array.isArray(followers) ? followers.length : 0}
                      </span>
                      <span className="ml-1 text-gray-400">Followers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <Tabs defaultValue="posts" className="mt-4 px-4">
              <TabsList className="grid grid-cols-3 bg-zinc-900">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="followers">Followers</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="mt-4">
                {postsLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner size={24} />
                  </div>
                ) : userPosts && Array.isArray(userPosts) && userPosts.length > 0 ? (
                  userPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="bg-zinc-900 rounded-xl p-8 text-center">
                    <p className="text-xl font-medium mb-2">No posts yet</p>
                    <p className="text-gray-400">This user hasn't posted anything yet</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="followers" className="mt-4">
                {followersLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner size={24} />
                  </div>
                ) : followers && Array.isArray(followers) && followers.length > 0 ? (
                  <div className="bg-zinc-900 rounded-xl p-4">
                    <div className="grid gap-4">
                      {followers.map((follower: any) => (
                        <div key={follower.id} className="flex items-center justify-between">
                          <div 
                            className="flex items-center cursor-pointer" 
                            onClick={() => setLocation(`/user/${follower.username}`)}
                          >
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={follower.avatar} alt={follower.displayName} />
                              <AvatarFallback>{getInitials(follower.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{follower.displayName}</p>
                              <p className="text-sm text-gray-400">@{follower.username}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 rounded-xl p-8 text-center">
                    <UsersIcon size={48} className="mx-auto text-gray-500 mb-4" />
                    <p className="text-xl font-medium mb-2">No followers yet</p>
                    <p className="text-gray-400">This user doesn't have any followers yet</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="following" className="mt-4">
                {followingLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner size={24} />
                  </div>
                ) : following && Array.isArray(following) && following.length > 0 ? (
                  <div className="bg-zinc-900 rounded-xl p-4">
                    <div className="grid gap-4">
                      {following.map((followedUser: any) => (
                        <div key={followedUser.id} className="flex items-center justify-between">
                          <div 
                            className="flex items-center cursor-pointer" 
                            onClick={() => setLocation(`/user/${followedUser.username}`)}
                          >
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={followedUser.avatar} alt={followedUser.displayName} />
                              <AvatarFallback>{getInitials(followedUser.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{followedUser.displayName}</p>
                              <p className="text-sm text-gray-400">@{followedUser.username}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 rounded-xl p-8 text-center">
                    <UsersIcon size={48} className="mx-auto text-gray-500 mb-4" />
                    <p className="text-xl font-medium mb-2">Not following anyone</p>
                    <p className="text-gray-400">This user isn't following anyone yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <RightSidebar />
        
        <MobileNavigation />
      </div>
    </div>
  );
}