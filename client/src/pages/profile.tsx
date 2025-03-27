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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/post-card";
import { EchoLinkModal } from "@/components/modals/echo-link-modal";
import { LinkIcon, UserIcon, CalendarIcon, AtSignIcon, UsersIcon, UserPlusIcon } from "lucide-react";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isEchoLinkModalOpen, setIsEchoLinkModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // Get user's posts
  const { data: userPosts } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/posts`] : null,
    enabled: !!user,
  });

  // Get user's followers
  const { data: followers } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/followers`] : null,
    enabled: !!user,
  });

  // Get user's following
  const { data: following } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/following`] : null,
    enabled: !!user,
  });

  // Get user's Echo Link
  const { data: echoLink } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/echo-link`] : null,
    enabled: !!user,
  });

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
              {/* Cover Photo */}
              <div className="h-32 sm:h-48 bg-gradient-to-r from-primary-900 to-primary-700"></div>
              
              {/* Profile Info */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 relative">
                {/* Avatar */}
                <div className="absolute -top-16 left-6 border-4 border-zinc-900 rounded-full">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end mb-12 sm:mb-0">
                  <Button 
                    variant="outline" 
                    className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                    onClick={() => setIsEchoLinkModalOpen(true)}
                  >
                    <LinkIcon size={16} className="mr-2" />
                    {echoLink ? "Edit Echo Link" : "Create Echo Link"}
                  </Button>
                </div>
                
                {/* User Info */}
                <div className="mt-2 sm:mt-0">
                  <h1 className="text-xl sm:text-2xl font-bold">{user.displayName}</h1>
                  <p className="text-gray-400 mb-2">@{user.username}</p>
                  
                  {user.bio && (
                    <p className="mb-3">{user.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400 mb-3">
                    {echoLink && (
                      <div className="flex items-center">
                        <LinkIcon size={14} className="mr-1" />
                        <span>echo.social/{echoLink.linkId}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <CalendarIcon size={14} className="mr-1" />
                      <span>{formatJoinDate(user.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 mb-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-white">{following?.length || 0}</span>
                      <span className="ml-1 text-gray-400">Following</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-white">{followers?.length || 0}</span>
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
                {userPosts && userPosts.length > 0 ? (
                  userPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="bg-zinc-900 rounded-xl p-8 text-center">
                    <p className="text-xl font-medium mb-2">No posts yet</p>
                    <p className="text-gray-400">Your posts will appear here</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="followers" className="mt-4">
                {followers && followers.length > 0 ? (
                  <div className="bg-zinc-900 rounded-xl p-4">
                    <div className="grid gap-4">
                      {followers.map((follower: any) => (
                        <div key={follower.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={follower.avatar} alt={follower.displayName} />
                              <AvatarFallback>{getInitials(follower.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{follower.displayName}</p>
                              <p className="text-sm text-gray-400">@{follower.username}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700">
                            <UserPlusIcon size={14} className="mr-1" />
                            Follow
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 rounded-xl p-8 text-center">
                    <UsersIcon size={48} className="mx-auto text-gray-500 mb-4" />
                    <p className="text-xl font-medium mb-2">No followers yet</p>
                    <p className="text-gray-400">When someone follows you, they'll appear here</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="following" className="mt-4">
                {following && following.length > 0 ? (
                  <div className="bg-zinc-900 rounded-xl p-4">
                    <div className="grid gap-4">
                      {following.map((followedUser: any) => (
                        <div key={followedUser.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={followedUser.avatar} alt={followedUser.displayName} />
                              <AvatarFallback>{getInitials(followedUser.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{followedUser.displayName}</p>
                              <p className="text-sm text-gray-400">@{followedUser.username}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="bg-primary-600 hover:bg-primary-700 border-primary-600">
                            Following
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 rounded-xl p-8 text-center">
                    <UserIcon size={48} className="mx-auto text-gray-500 mb-4" />
                    <p className="text-xl font-medium mb-2">Not following anyone</p>
                    <p className="text-gray-400">When you follow someone, they'll appear here</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
