import { createContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
}

interface UpdateProfileData {
  displayName?: string;
  bio?: string | null;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (loginIdentifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  updateProfile: (userId: number, data: UpdateProfileData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  updateProfile: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for user session on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (loginIdentifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", { loginIdentifier, password });
      const userData = await response.json();
      setUser(userData);
      
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Redirect to home page
      setLocation("/");
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.displayName}`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email/username or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", { 
        username,
        email,
        password, 
        displayName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random` 
      });
      const userData = await response.json();
      setUser(userData);
      
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Redirect to home page
      setLocation("/");
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    
    // Clear all queries from the cache
    queryClient.clear();
    
    // Redirect to login page
    setLocation("/login");
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const updateProfile = async (userId: number, data: UpdateProfileData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, data);
      const updatedUser = await response.json();
      
      // Update user state
      setUser(updatedUser);
      
      // Update user data in localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      return updatedUser;
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
