import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { SparklesCore } from "@/components/ui/sparkles";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4">
      {/* Particle Background Effect */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <SparklesCore
          background="#121212"
          particleColor="#6366F1"
          particleDensity={50}
          minSize={1}
          maxSize={2}
          speed={2}
        />
        <div className="absolute inset-x-20 top-1/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
        <div className="absolute inset-x-20 top-1/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white">Echo<span className="text-primary-500">.</span></h1>
        <p className="text-gray-400 mt-2">Connect, Share, Engage</p>
      </div>

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="bg-zinc-950 border-zinc-800 text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="bg-zinc-950 border-zinc-800 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary-400 hover:text-primary-300">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
