import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, MessageSquare, RefreshCw, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PollOptions } from "./poll-options";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: {
    id: number;
    userId: number;
    content: string;
    mediaUrl?: string;
    createdAt: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  
  const { data: postUser } = useQuery({
    queryKey: [`/api/users/${post.userId}`],
    enabled: !!post.userId,
  });
  
  const { data: likes } = useQuery({
    queryKey: [`/api/posts/${post.id}/likes`],
    enabled: !!post.id,
  });
  
  const { data: comments } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: !!post.id,
  });
  
  const { data: polls } = useQuery({
    queryKey: [`/api/posts/${post.id}/polls`],
    enabled: !!post.id,
  });

  useEffect(() => {
    if (likes) {
      setLikesCount(likes.length);
      if (user) {
        setHasLiked(likes.some((like: any) => like.userId === user.id));
      }
    }
  }, [likes, user]);

  useEffect(() => {
    if (comments) {
      setCommentsCount(comments.length);
    }
  }, [comments]);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatTimeAgo = (dateString: string) => {
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

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to like posts",
        variant: "destructive"
      });
      return;
    }

    try {
      if (hasLiked) {
        // Find the like and delete it
        const like = (likes as any[]).find(l => l.userId === user.id);
        if (like) {
          await apiRequest("DELETE", `/api/likes/${like.id}`, undefined);
          setHasLiked(false);
          setLikesCount(prev => prev - 1);
        }
      } else {
        // Create a new like
        await apiRequest("POST", "/api/likes", {
          userId: user.id,
          postId: post.id
        });
        setHasLiked(true);
        setLikesCount(prev => prev + 1);
      }
      
      // Refresh likes
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/likes`] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process like",
        variant: "destructive"
      });
    }
  };

  const hasPoll = polls && polls.length > 0;

  if (!postUser) return null;

  return (
    <div className="bg-zinc-900 rounded-xl mb-4 border border-zinc-800 overflow-hidden shadow-sm">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={postUser.avatar} alt={postUser.displayName} />
            <AvatarFallback>{getInitials(postUser.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{postUser.displayName}</p>
                <p className="text-xs text-gray-400 flex items-center">
                  <span>@{postUser.username}</span>
                  <span className="mx-1">·</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </p>
              </div>
              <button className="text-gray-400 hover:text-white">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Post Content */}
        <div className="mt-3">
          <p className="text-gray-100 whitespace-pre-wrap">
            {post.content.split(/(#\w+)/g).map((part, i) => 
              part.startsWith('#') 
                ? <span key={i} className="text-primary-400">{part}</span> 
                : part
            )}
          </p>
          
          {/* Post Media */}
          {post.mediaUrl && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img src={post.mediaUrl} alt="Post media" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* Poll if exists */}
          {hasPoll && <PollOptions pollId={polls[0].id} />}
        </div>
      </div>
      
      {/* Post Actions */}
      <div className="flex border-t border-zinc-800">
        <button className="flex items-center justify-center space-x-2 flex-1 p-2.5 text-gray-400 hover:text-primary-400 hover:bg-zinc-950 transition">
          <MessageSquare size={16} />
          <span>{commentsCount}</span>
        </button>
        <button className="flex items-center justify-center space-x-2 flex-1 p-2.5 text-gray-400 hover:text-green-500 hover:bg-zinc-950 transition">
          <RefreshCw size={16} />
          <span>0</span>
        </button>
        <button 
          className={cn(
            "flex items-center justify-center space-x-2 flex-1 p-2.5 hover:bg-zinc-950 transition",
            hasLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
          )}
          onClick={toggleLike}
        >
          <Heart size={16} className={cn(hasLiked && "fill-current")} />
          <span>{likesCount}</span>
        </button>
        <button className="flex items-center justify-center space-x-2 flex-1 p-2.5 text-gray-400 hover:text-primary-400 hover:bg-zinc-950 transition">
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
}
