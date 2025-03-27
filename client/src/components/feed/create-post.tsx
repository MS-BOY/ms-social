import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreatePollModal } from "@/components/modals/create-poll-modal";
import {
  ImageIcon,
  FileVideoIcon,
  BarChart2Icon,
  MapPinIcon
} from "lucide-react";

export function CreatePost() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Post content cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/posts", {
        userId: user.id,
        content: content.trim(),
      });

      setContent("");
      toast({
        title: "Success",
        description: "Post created successfully"
      });

      // Refresh the feed
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed', user.id] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-zinc-900 p-4 rounded-xl mb-6 shadow-sm border border-zinc-800">
        <div className="flex space-x-3">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="What's happening?" 
              className="w-full bg-zinc-950 text-white placeholder-gray-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none" 
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex space-x-4">
                <button className="text-primary-400 hover:text-primary-300" title="Add image">
                  <ImageIcon size={18} />
                </button>
                <button className="text-primary-400 hover:text-primary-300" title="Add video">
                  <FileVideoIcon size={18} />
                </button>
                <button 
                  className="text-primary-400 hover:text-primary-300" 
                  title="Create poll"
                  onClick={() => setIsPollModalOpen(true)}
                >
                  <BarChart2Icon size={18} />
                </button>
                <button className="text-primary-400 hover:text-primary-300" title="Add location">
                  <MapPinIcon size={18} />
                </button>
              </div>
              <Button 
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CreatePollModal 
        isOpen={isPollModalOpen} 
        onClose={() => setIsPollModalOpen(false)} 
      />
    </>
  );
}
