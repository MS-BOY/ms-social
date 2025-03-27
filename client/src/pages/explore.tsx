import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MessagingPanel } from "@/components/messaging/messaging-panel";
import { SparklesCore } from "@/components/ui/sparkles";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SearchIcon, UserPlusIcon, UserCheckIcon } from "lucide-react";

export default function Explore() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // Get trending posts
  const { data: trendingPosts } = useQuery({
    queryKey: ['/api/posts'],
    enabled: !!user,
  });

  // Search users when query changes
  const { data: searchResults, refetch: searchUsers } = useQuery({
    queryKey: [`/api/users/search`, searchQuery],
    enabled: false,
  });

  const { data: followingUsers } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/following`] : null,
    enabled: !!user,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      await searchUsers();
    } finally {
      setSearching(false);
    }
  };

  const isFollowing = (userId: number) => {
    if (!followingUsers) return false;
    return followingUsers.some((followedUser: any) => followedUser.id === userId);
  };

  const toggleFollow = async (userId: number) => {
    if (!user) return;
    
    try {
      if (isFollowing(userId)) {
        // Find follow relationship and unfollow
        const follow = await apiRequest("GET", `/api/users/${user.id}/following`);
        const followData = await follow.json();
        const relationship = followData.find((f: any) => f.followingId === userId);
        
        if (relationship) {
          await apiRequest("DELETE", `/api/follows/${relationship.id}`);
        }
      } else {
        // Follow user
        await apiRequest("POST", "/api/follows", {
          followerId: user.id,
          followingId: userId
        });
      }
      
      // Refresh following list
      await searchUsers();
      
      toast({
        title: "Success",
        description: isFollowing(userId) 
          ? "User unfollowed successfully" 
          : "User followed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
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
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Explore</h1>
            
            {/* Search Bar */}
            <div className="mb-8">
              <div className="flex items-center">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search for people"
                    className="bg-zinc-900 border-zinc-800 pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
                <Button 
                  className="ml-2 bg-primary-600 hover:bg-primary-700"
                  onClick={handleSearch}
                  disabled={searching}
                >
                  Search
                </Button>
              </div>
            </div>
            
            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">People</h2>
                <div className="space-y-4">
                  {searchResults.map((result: any) => (
                    <div key={result.id} className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={result.avatar} alt={result.displayName} />
                          <AvatarFallback>{getInitials(result.displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.displayName}</p>
                          <p className="text-sm text-gray-400">@{result.username}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className={isFollowing(result.id) 
                          ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700" 
                          : "bg-primary-600 hover:bg-primary-700 border-primary-600"}
                        onClick={() => toggleFollow(result.id)}
                      >
                        {isFollowing(result.id) ? (
                          <>
                            <UserCheckIcon size={16} className="mr-2" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlusIcon size={16} className="mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Trending Posts */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Trending Posts</h2>
              {trendingPosts && trendingPosts.length > 0 ? (
                trendingPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-8 bg-zinc-900 rounded-lg">
                  <p className="text-gray-400">No trending posts available</p>
                </div>
              )}
            </div>
          </div>
        </main>
        
        <RightSidebar />
        
        <MobileNavigation />
      </div>
      
      {/* Messaging Panel */}
      <MessagingPanel />
    </div>
  );
}
