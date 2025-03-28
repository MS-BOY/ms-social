import { SparklesCore } from "@/components/ui/sparkles";
import { Sidebar } from "@/components/layout/sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { MessagingPanel } from "@/components/messaging/messaging-panel";
import { UserSearch } from "@/components/search/user-search"; 
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SearchPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

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
          <div className="max-w-3xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Search</h1>
            <UserSearch />
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