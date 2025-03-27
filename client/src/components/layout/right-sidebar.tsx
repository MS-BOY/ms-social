import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";

type TrendingTopic = {
  category: string;
  topic: string;
  count: string;
};

type SuggestedUser = {
  id: number;
  name: string;
  username: string;
  avatar?: string;
};

export function RightSidebar() {
  const [trendingTopics] = useState<TrendingTopic[]>([
    { category: "Technology", topic: "#AIRevolution", count: "5,234 posts" },
    { category: "Design", topic: "#MinimalistUI", count: "3,457 posts" },
    { category: "World", topic: "#ClimateAction", count: "12.5K posts" }
  ]);

  const [suggestedUsers] = useState<SuggestedUser[]>([
    { id: 1, name: "David Kim", username: "davidkim", avatar: "https://ui-avatars.com/api/?name=David+Kim&background=random" },
    { id: 2, name: "Tania Chen", username: "taniachen", avatar: "https://ui-avatars.com/api/?name=Tania+Chen&background=random" }
  ]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="hidden lg:block w-80 border-l border-zinc-800 bg-zinc-900 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 h-screen sticky top-0">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Input 
          type="text" 
          placeholder="Search Echo" 
          className="w-full bg-zinc-950 text-white placeholder-gray-500 pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-500" />
        </div>
      </div>
      
      {/* Trending Section */}
      <div className="bg-zinc-950 rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Trending</h2>
        
        {trendingTopics.map((topic, index) => (
          <div key={index} className="mb-4">
            <p className="text-xs text-gray-400">Trending in {topic.category}</p>
            <p className="font-medium text-gray-100">{topic.topic}</p>
            <p className="text-xs text-gray-400">{topic.count}</p>
          </div>
        ))}
        
        <a href="#" className="text-primary-400 text-sm hover:text-primary-300 transition">Show more</a>
      </div>
      
      {/* Who to Follow */}
      <div className="bg-zinc-950 rounded-xl p-4">
        <h2 className="text-xl font-bold mb-4">Who to follow</h2>
        
        {suggestedUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">@{user.username}</p>
              </div>
            </div>
            <Button className="bg-white text-zinc-950 hover:bg-gray-200 px-3 py-1 rounded-full text-sm font-medium transition h-8">
              Follow
            </Button>
          </div>
        ))}
        
        <a href="#" className="text-primary-400 text-sm hover:text-primary-300 transition">Show more</a>
      </div>
    </aside>
  );
}
