import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface PollOptionsProps {
  pollId: number;
}

export function PollOptions({ pollId }: PollOptionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [votingEnded, setVotingEnded] = useState(false);

  const { data: poll, isLoading: pollLoading } = useQuery({
    queryKey: [`/api/polls/${pollId}`],
    enabled: !!pollId,
  });

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: [`/api/polls/${pollId}/options`],
    enabled: !!pollId,
  });

  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: [`/api/polls/${pollId}/votes`],
    enabled: !!pollId,
  });

  useEffect(() => {
    if (votes) {
      setTotalVotes(votes.length);
      
      // Check if user has already voted
      if (user) {
        const userVote = votes.find((vote: any) => vote.userId === user.id);
        if (userVote) {
          setSelectedOption(userVote.optionId);
        }
      }
    }
  }, [votes, user]);

  useEffect(() => {
    if (poll) {
      const endDate = new Date(poll.endsAt);
      setVotingEnded(endDate < new Date());
    }
  }, [poll]);

  const getVotePercentage = (optionId: number) => {
    if (!votes || votes.length === 0) return 0;
    const optionVotes = votes.filter((vote: any) => vote.optionId === optionId).length;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  const getRemainingTime = () => {
    if (!poll) return "";
    
    const endDate = new Date(poll.endsAt);
    const now = new Date();
    
    if (endDate < now) return "Ended";
    
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} remaining`;
    }
    
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} remaining`;
    }
    
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} remaining`;
  };

  const handleVote = async (optionId: number) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to vote",
        variant: "destructive"
      });
      return;
    }

    if (votingEnded) {
      toast({
        title: "Error",
        description: "This poll has ended",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/polls/vote", {
        pollId,
        optionId,
        userId: user.id
      });
      
      setSelectedOption(optionId);
      
      // Refresh votes
      queryClient.invalidateQueries({ queryKey: [`/api/polls/${pollId}/votes`] });
      
      toast({
        title: "Success",
        description: "Your vote has been recorded"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to vote",
        variant: "destructive"
      });
    }
  };

  if (pollLoading || optionsLoading || votesLoading || !options || !poll) {
    return <div className="mt-4 text-gray-400">Loading poll...</div>;
  }

  return (
    <div className="space-y-2 mt-4">
      <p className="text-gray-100 mb-3">
        {poll.question}
      </p>
      
      {options.map((option: any) => {
        const percentage = getVotePercentage(option.id);
        
        return (
          <div key={option.id} className="relative">
            <div 
              className="absolute h-full bg-primary-900/50 rounded-lg" 
              style={{ width: `${percentage}%` }}
            ></div>
            <button 
              className="relative w-full text-left p-3 border border-zinc-800 rounded-lg flex justify-between items-center hover:bg-zinc-950/50 transition"
              onClick={() => handleVote(option.id)}
              disabled={votingEnded || (selectedOption !== null && selectedOption !== option.id)}
            >
              <span>{option.text}</span>
              {(selectedOption !== null || votingEnded) && (
                <span className="text-primary-400">{percentage}%</span>
              )}
            </button>
          </div>
        );
      })}
      
      <p className="text-gray-400 text-sm mt-3">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} · {getRemainingTime()}
      </p>
    </div>
  );
}
