import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  MessageSquare, 
  RefreshCw, 
  Heart, 
  Share2, 
  Trash2, 
  Edit,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PollOptions } from "./poll-options";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: {
    id: number;
    userId: number;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    createdAt: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: postUser } = useQuery<{
    id: number;
    username: string;
    displayName: string;
    avatar: string;
    bio?: string;
  }>({
    queryKey: [`/api/users/${post.userId}`],
    enabled: !!post.userId,
  });
  
  const { data: likes = [] } = useQuery<Array<{
    id: number;
    userId: number;
    postId: number;
    createdAt: string;
  }>>({
    queryKey: [`/api/posts/${post.id}/likes`],
    enabled: !!post.id,
  });
  
  const { data: comments = [] } = useQuery<Array<{
    id: number;
    userId: number;
    postId: number;
    content: string;
    createdAt: string;
  }>>({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: !!post.id,
  });
  
  const { data: polls = [] } = useQuery<Array<{
    id: number;
    postId: number;
    question: string;
    createdAt: string;
  }>>({
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
  
  const deletePost = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      await apiRequest("DELETE", `/api/posts/${post.id}`, undefined);
      
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/posts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/feed/${user.id}`] });
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const hasPoll = polls && polls.length > 0;

  // Fallback user data in case the user isn't found
  const userDisplayData: {
    displayName: string;
    username: string;
    avatar: string;
  } = postUser || {
    displayName: 'Unknown User',
    username: 'user',
    avatar: `https://ui-avatars.com/api/?name=User&background=random`
  };

  return (
    <>
      <div className="bg-zinc-900 rounded-xl mb-4 border border-zinc-800 overflow-hidden shadow-sm">
        {/* Post Header */}
        <div className="p-4">
          <div className="flex items-start">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarImage src={userDisplayData.avatar} alt={userDisplayData.displayName} />
              <AvatarFallback>{getInitials(userDisplayData.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{userDisplayData.displayName}</p>
                  <p className="text-xs text-gray-400 flex items-center">
                    <span>@{userDisplayData.username}</span>
                    <span className="mx-1">·</span>
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </p>
                </div>
                {user && post.userId === user.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-gray-400 hover:text-white">
                        <MoreHorizontal size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                      <DropdownMenuItem 
                        className="flex items-center text-white hover:bg-zinc-700 cursor-pointer"
                      >
                        <Edit size={16} className="mr-2 text-gray-400" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-700" />
                      <DropdownMenuItem 
                        className="flex items-center text-red-500 hover:bg-zinc-700 cursor-pointer"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
                {post.mediaType === 'video' ? (
                  <video 
                    src={post.mediaUrl} 
                    controls 
                    className="w-full h-auto" 
                    preload="metadata"
                  />
                ) : (
                  <img 
                    src={post.mediaUrl} 
                    alt="Post media" 
                    className="w-full h-auto object-cover" 
                  />
                )}
              </div>
            )}

            {/* Poll if exists */}
            {hasPoll && polls.length > 0 && <PollOptions pollId={polls[0].id} />}
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
        
      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. The post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={deletePost}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
