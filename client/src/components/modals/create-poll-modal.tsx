import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusIcon, XIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePollModal({ isOpen, onClose }: CreatePollModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [pollLength, setPollLength] = useState("3");
  const [votePrivacy, setVotePrivacy] = useState("anonymous");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    } else {
      toast({
        title: "Limit reached",
        description: "You can only have up to 5 options",
        variant: "destructive"
      });
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    } else {
      toast({
        title: "Minimum required",
        description: "A poll needs at least 2 options",
        variant: "destructive"
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const getPollEndDate = () => {
    const now = new Date();
    const days = parseInt(pollLength);
    now.setDate(now.getDate() + days);
    return now.toISOString();
  };

  const createPoll = async () => {
    if (!user) return;

    // Validate inputs
    if (!question.trim()) {
      toast({
        title: "Missing question",
        description: "Please enter a poll question",
        variant: "destructive"
      });
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "Not enough options",
        description: "Please enter at least 2 poll options",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First create a post
      const post = await apiRequest("POST", "/api/posts", {
        userId: user.id,
        content: question.trim()
      });

      // Then create the poll
      const poll = await apiRequest("POST", "/api/polls", {
        postId: post.id,
        question: question.trim(),
        endsAt: getPollEndDate(),
        isAnonymous: votePrivacy === "anonymous"
      });

      // Create poll options
      for (const option of validOptions) {
        await apiRequest("POST", "/api/poll-options", {
          pollId: poll.id,
          text: option.trim()
        });
      }

      // Reset form and close modal
      resetForm();
      onClose();

      // Refresh feed
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      toast({
        title: "Poll created",
        description: "Your poll has been created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create poll",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setQuestion("");
    setOptions(["", ""]);
    setPollLength("3");
    setVotePrivacy("anonymous");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Poll</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Label htmlFor="poll-question" className="block text-gray-300 mb-1 text-sm">Poll Question</Label>
          <Input 
            id="poll-question"
            type="text" 
            placeholder="Ask a question..." 
            className="w-full bg-zinc-950 text-white border-zinc-800"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        
        <div className="space-y-2 mb-4">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input 
                type="text" 
                placeholder={`Option ${index + 1}`} 
                className="flex-1 bg-zinc-950 text-white border-zinc-800"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-red-500"
                onClick={() => removeOption(index)}
              >
                <XIcon size={16} />
              </Button>
            </div>
          ))}
        </div>
        
        <Button 
          variant="ghost" 
          className="text-primary-400 hover:text-primary-300 flex items-center mb-6"
          onClick={addOption}
        >
          <PlusIcon size={16} className="mr-2" /> Add Option
        </Button>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <Label htmlFor="poll-length" className="block text-gray-300 mb-1 text-sm">Poll Length</Label>
            <Select 
              value={pollLength} 
              onValueChange={setPollLength}
            >
              <SelectTrigger className="bg-zinc-950 text-white border-zinc-800">
                <SelectValue placeholder="Select poll length" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="14">2 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vote-privacy" className="block text-gray-300 mb-1 text-sm">Vote Privacy</Label>
            <Select 
              value={votePrivacy} 
              onValueChange={setVotePrivacy}
            >
              <SelectTrigger className="bg-zinc-950 text-white border-zinc-800">
                <SelectValue placeholder="Select privacy" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="anonymous">Anonymous</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            className="bg-zinc-700 hover:bg-zinc-800 text-white" 
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button 
            className="bg-primary-600 hover:bg-primary-700 text-white" 
            onClick={createPoll}
            disabled={isSubmitting}
          >
            Create Poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
