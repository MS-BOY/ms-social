import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { 
  HomeIcon, 
  SearchIcon, 
  BellIcon, 
  MessageSquareIcon, 
  UserIcon, 
  LinkIcon, 
  MoreHorizontalIcon,
  PlusIcon
} from "lucide-react";
import { useState } from "react";
import { CreatePollModal } from "@/components/modals/create-poll-modal";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const links = [
    { href: "/", icon: <HomeIcon size={20} />, text: "Home" },
    { href: "/explore", icon: <SearchIcon size={20} />, text: "Explore" },
    { href: "/notifications", icon: <BellIcon size={20} />, text: "Notifications", count: 3 },
    { href: "/messages", icon: <MessageSquareIcon size={20} />, text: "Messages", count: 2 },
    { href: "/profile", icon: <UserIcon size={20} />, text: "Profile" },
    { href: "/echo-link", icon: <LinkIcon size={20} />, text: "Echo Links" },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900 p-4 h-screen sticky top-0">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center mb-8 mt-2">
          <h1 className="text-3xl font-bold text-white">Echo</h1>
          <span className="text-primary-500 ml-1 text-3xl">.</span>
        </div>
        
        {/* Main Navigation */}
        <nav className="space-y-1 flex-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <a className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition",
                location === link.href 
                  ? "bg-primary-600 text-white font-medium" 
                  : "hover:bg-zinc-800 text-gray-300"
              )}>
                {link.icon}
                <span>{link.text}</span>
                {link.count && (
                  <Badge className="ml-auto bg-primary-500 hover:bg-primary-500 text-white text-xs">{link.count}</Badge>
                )}
              </a>
            </Link>
          ))}
        </nav>
        
        {/* Create Post Button */}
        <Button 
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition mb-4"
          onClick={() => setIsCreatePostModalOpen(true)}
        >
          <PlusIcon size={18} className="mr-2" />
          Create Post
        </Button>
        
        {/* User Profile */}
        {user && (
          <div className="flex items-center p-3 border-t border-zinc-800 mt-auto">
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="font-medium">{user.displayName}</p>
              <p className="text-xs text-gray-400">@{user.username}</p>
            </div>
            <button className="ml-auto text-gray-400 hover:text-white">
              <MoreHorizontalIcon size={18} />
            </button>
          </div>
        )}
      </aside>

      <CreatePollModal 
        isOpen={isCreatePostModalOpen} 
        onClose={() => setIsCreatePostModalOpen(false)} 
      />
    </>
  );
}
