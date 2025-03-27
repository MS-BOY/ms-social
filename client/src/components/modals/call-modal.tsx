import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneIcon, PhoneOffIcon, VideoIcon, MicOffIcon, MicIcon } from "lucide-react";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVideo?: boolean;
  caller?: {
    id: number;
    name: string;
    avatar?: string;
    username: string;
  };
}

export function CallModal({ isOpen, onClose, isVideo = false, caller }: CallModalProps) {
  const [callState, setCallState] = useState<'ringing' | 'ongoing' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (callState === 'ongoing') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answerCall = () => {
    setCallState('ongoing');
  };

  const endCall = () => {
    setCallState('ended');
    setTimeout(() => {
      onClose();
      setCallState('ringing');
      setCallDuration(0);
    }, 1500);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white p-0 overflow-hidden">
        <div className="bg-zinc-900 p-6 flex flex-col items-center justify-center">
          {isVideo && callState === 'ongoing' ? (
            <div className="relative w-full h-64 bg-zinc-950 rounded-lg mb-4 flex items-center justify-center">
              {isVideoEnabled ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Video stream would appear here
                </div>
              ) : (
                <div className="text-gray-500">Video is disabled</div>
              )}
              
              {/* Self view (small box) */}
              <div className="absolute bottom-2 right-2 w-24 h-24 bg-zinc-800 rounded-lg flex items-center justify-center">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={caller?.avatar} alt="You" />
                  <AvatarFallback>YOU</AvatarFallback>
                </Avatar>
              </div>
            </div>
          ) : (
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={caller?.avatar} alt={caller?.name} />
              <AvatarFallback>{getInitials(caller?.name || "")}</AvatarFallback>
            </Avatar>
          )}
          
          <h3 className="text-xl font-bold mb-1">{caller?.name || "Unknown"}</h3>
          
          {callState === 'ringing' && (
            <p className="text-gray-400 mb-6">Calling...</p>
          )}
          
          {callState === 'ongoing' && (
            <p className="text-gray-400 mb-6">{formatDuration(callDuration)}</p>
          )}
          
          {callState === 'ended' && (
            <p className="text-gray-400 mb-6">Call ended</p>
          )}
          
          <div className="flex justify-center space-x-4">
            <Button 
              className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xl transition" 
              onClick={endCall}
            >
              <PhoneOffIcon />
            </Button>
            
            {callState === 'ringing' && (
              <Button 
                className="w-12 h-12 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-white text-xl transition" 
                onClick={answerCall}
              >
                <PhoneIcon />
              </Button>
            )}
            
            {callState === 'ongoing' && (
              <>
                <Button 
                  className="w-12 h-12 bg-zinc-700 hover:bg-zinc-800 rounded-full flex items-center justify-center text-white text-xl transition" 
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOffIcon /> : <MicIcon />}
                </Button>
                
                {isVideo && (
                  <Button 
                    className="w-12 h-12 bg-zinc-700 hover:bg-zinc-800 rounded-full flex items-center justify-center text-white text-xl transition" 
                    onClick={toggleVideo}
                  >
                    <VideoIcon />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
