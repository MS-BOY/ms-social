import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CreatePost } from "./create-post";
import { PostCard } from "./post-card";
import { Skeleton } from "@/components/ui/skeleton";

export function Feed() {
  const { user } = useAuth();

  const { data: posts, isLoading } = useQuery({
    queryKey: user ? ['/api/posts/feed', user.id] : ['/api/posts'],
    enabled: true,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {user && <CreatePost />}
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-start space-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32 mb-4" />
                  <Skeleton className="h-20 w-full mb-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        posts && posts.length > 0 ? (
          posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-10">
            <h3 className="text-xl font-medium mb-2">No posts yet</h3>
            <p className="text-gray-500">
              {user ? "Start by creating a post or following users" : "Sign in to see personalized posts"}
            </p>
          </div>
        )
      )}
    </div>
  );
}
