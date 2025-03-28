import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreatePollModal } from "@/components/modals/create-poll-modal";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  ImageIcon,
  FileVideoIcon,
  BarChart2Icon,
  MapPinIcon,
  X,
  Loader2
} from "lucide-react";

export function CreatePost() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedMedia(file);
    setMediaType('image');
    setMediaPreview(URL.createObjectURL(file));
  };
  
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Please select a valid video file",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedMedia(file);
    setMediaType('video');
    setMediaPreview(URL.createObjectURL(file));
  };
  
  const clearMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    
    // Reset file inputs
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim() && !selectedMedia) {
      toast({
        title: "Error",
        description: "Post must have content or media",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let mediaUrl = '';
      let mediaTypeValue = '';
      
      // If media was selected, upload it first
      if (selectedMedia) {
        setIsUploading(true);
        setUploadProgress(0);
        
        const formData = new FormData();
        formData.append('media', selectedMedia);
        
        // Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        
        // Setup the progress event
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });
        
        // Create a promise to handle the XHR request
        const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
          xhr.open('POST', '/api/media/upload', true);
          
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch (e) {
                reject(new Error('Invalid response from server'));
              }
            } else {
              reject(new Error('Failed to upload media'));
            }
          };
          
          xhr.onerror = function() {
            reject(new Error('Network error occurred'));
          };
          
          xhr.send(formData);
        });
        
        try {
          const data = await uploadPromise;
          mediaUrl = data.url;
          mediaTypeValue = mediaType || '';
        } catch (error) {
          throw error;
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
      
      // Create the post with or without media
      await apiRequest("POST", "/api/posts", {
        userId: user.id,
        content: content.trim(),
        ...(mediaUrl && { mediaUrl, mediaType: mediaTypeValue })
      });

      // Reset states
      setContent("");
      clearMedia();
      
      toast({
        title: "Success",
        description: "Post created successfully"
      });

      // Refresh the feed
      queryClient.invalidateQueries({ queryKey: [`/api/posts/feed/${user.id}`] });
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
            
            {/* Media Preview */}
            {mediaPreview && (
              <div className="mt-3 relative">
                <div className="rounded-lg overflow-hidden">
                  {mediaType === 'video' ? (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="w-full h-auto" 
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={mediaPreview} 
                      alt="Media preview" 
                      className="w-full h-auto object-cover max-h-80" 
                    />
                  )}
                  
                  {/* Upload progress overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                      <CircularProgress 
                        value={uploadProgress}
                        size={70}
                        strokeWidth={5}
                        progressColor="rgb(70, 130, 246)"
                        bgColor="rgba(255, 255, 255, 0.2)"
                        textClassName="text-white font-semibold"
                      />
                      <div className="text-white text-sm mt-3">Uploading...</div>
                    </div>
                  )}
                </div>
                <button 
                  className="absolute top-2 right-2 bg-zinc-800 bg-opacity-75 rounded-full p-1 text-white hover:bg-opacity-100"
                  onClick={clearMedia}
                  disabled={isUploading}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex space-x-4">
                <button 
                  className="text-primary-400 hover:text-primary-300" 
                  title="Add image"
                  onClick={() => imageInputRef.current?.click()}
                  type="button"
                >
                  <ImageIcon size={18} />
                </button>
                <input 
                  type="file" 
                  ref={imageInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                
                <button 
                  className="text-primary-400 hover:text-primary-300" 
                  title="Add video"
                  onClick={() => videoInputRef.current?.click()}
                  type="button"
                >
                  <FileVideoIcon size={18} />
                </button>
                <input 
                  type="file" 
                  ref={videoInputRef}
                  className="hidden" 
                  accept="video/*"
                  onChange={handleVideoUpload}
                />
                
                <button 
                  className="text-primary-400 hover:text-primary-300" 
                  title="Create poll"
                  onClick={() => setIsPollModalOpen(true)}
                  type="button"
                >
                  <BarChart2Icon size={18} />
                </button>
                
                <button 
                  className="text-primary-400 hover:text-primary-300" 
                  title="Add location"
                  type="button"
                >
                  <MapPinIcon size={18} />
                </button>
              </div>
              <Button 
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting || isUploading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Posting...'}
                  </div>
                ) : (
                  'Post'
                )}
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
