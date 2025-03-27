import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MessagingPanel } from "@/components/messaging/messaging-panel";
import { SparklesCore } from "@/components/ui/sparkles";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HeartIcon, MessageSquareIcon, UserPlusIcon, BellIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // Get user notifications
  const { data: notifications, isLoading: loadingNotifications } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/notifications`] : null,
    enabled: !!user,
  });

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await apiRequest("POST", `/api/users/${user.id}/notifications/read-all`, undefined);
      
      // Refresh notifications
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/notifications`] });
      
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark notifications as read",
        variant: "destructive"
      });
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`, undefined);
      
      // Refresh notifications
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/notifications`] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <HeartIcon size={16} className="text-red-500" />;
      case 'comment':
        return <MessageSquareIcon size={16} className="text-blue-500" />;
      case 'follow':
        return <UserPlusIcon size={16} className="text-green-500" />;
      case 'message':
        return <MessageSquareIcon size={16} className="text-primary-500" />;
      case 'anonymous_message':
        return <MessageSquareIcon size={16} className="text-purple-500" />;
      default:
        return <BellIcon size={16} className="text-gray-500" />;
    }
  };

  // Format notification time
  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Notifications</h1>
              
              {notifications && notifications.some((n: any) => !n.read) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-primary-400 border-zinc-800 hover:bg-zinc-800"
                  onClick={markAllAsRead}
                >
                  <CheckIcon size={16} className="mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
            
            {loadingNotifications ? (
              <div className="text-center py-20">
                <BellIcon size={48} className="mx-auto text-gray-500 mb-4" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification: any) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border ${
                      notification.read ? 'bg-zinc-900 border-zinc-800' : 'bg-primary-900/20 border-primary-900/30'
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex">
                      <div className="mr-3 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{notification.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary-500 self-start mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900 rounded-lg">
                <BellIcon size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-xl font-medium mb-2">No notifications</p>
                <p className="text-gray-400">You're all caught up!</p>
              </div>
            )}
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
