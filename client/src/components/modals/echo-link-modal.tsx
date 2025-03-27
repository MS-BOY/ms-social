import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface EchoLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EchoLinkModal({ isOpen, onClose }: EchoLinkModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [linkId, setLinkId] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [echoLinkId, setEchoLinkId] = useState<number | null>(null);

  // Check if user already has an Echo Link
  const { data: existingEchoLink } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/echo-link`] : null,
    enabled: !!user && isOpen,
    onError: () => {
      setIsEditing(false);
    }
  });

  // Initialize form with existing data if available
  useEffect(() => {
    if (existingEchoLink) {
      setLinkId(existingEchoLink.linkId);
      setWelcomeMessage(existingEchoLink.welcomeMessage || "");
      setEchoLinkId(existingEchoLink.id);
      setIsEditing(true);
    } else {
      // Initialize with username as default link ID
      if (user && !linkId) {
        setLinkId(user.username);
      }
      setWelcomeMessage("Ask me anything...");
      setIsEditing(false);
    }
  }, [existingEchoLink, user, isOpen, linkId]);

  const saveEchoLink = async () => {
    if (!user) return;

    if (!linkId.trim()) {
      toast({
        title: "Link ID required",
        description: "Please provide a link ID for your Echo Link",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && echoLinkId) {
        // Update existing Echo Link
        await apiRequest("PATCH", `/api/echo-links/${echoLinkId}`, {
          linkId: linkId.trim(),
          welcomeMessage: welcomeMessage.trim()
        });
      } else {
        // Create new Echo Link
        await apiRequest("POST", "/api/echo-links", {
          userId: user.id,
          linkId: linkId.trim(),
          welcomeMessage: welcomeMessage.trim(),
          active: true
        });
      }

      // Refresh Echo Link data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/echo-link`] });
      
      toast({
        title: "Success",
        description: `Echo Link ${isEditing ? 'updated' : 'created'} successfully`
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : `Failed to ${isEditing ? 'update' : 'create'} Echo Link`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Update Echo Link" : "Setup Echo Link"}
          </DialogTitle>
        </DialogHeader>

        <p className="text-gray-300 mb-4">
          Your Echo Link allows others to send you anonymous questions and messages. Customize your link below.
        </p>
        
        <div className="mb-4">
          <Label htmlFor="echo-link" className="block text-gray-300 mb-1 text-sm">Your Link</Label>
          <div className="flex">
            <span className="bg-zinc-950 text-gray-400 p-3 rounded-l-lg border-r border-zinc-800">
              echo.social/
            </span>
            <Input 
              id="echo-link"
              type="text" 
              className="flex-1 bg-zinc-950 text-white border-zinc-800 rounded-l-none"
              value={linkId}
              onChange={(e) => setLinkId(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <Label htmlFor="welcome-message" className="block text-gray-300 mb-1 text-sm">Custom Welcome Message</Label>
          <Textarea 
            id="welcome-message"
            placeholder="Ask me anything..." 
            className="w-full bg-zinc-950 text-white border-zinc-800 resize-none" 
            rows={2}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
        </div>
        
        <DialogFooter>
          <Button 
            className="bg-zinc-700 hover:bg-zinc-800 text-white" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            className="bg-primary-600 hover:bg-primary-700 text-white" 
            onClick={saveEchoLink}
            disabled={isSubmitting}
          >
            {isEditing ? "Update Echo Link" : "Save Echo Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
