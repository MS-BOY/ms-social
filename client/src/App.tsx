import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { SocketProvider } from "@/contexts/socket-context";

// Pages
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Notifications from "@/pages/notifications";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import UserProfile from "@/pages/user-profile";
import EchoLink from "@/pages/echo-link";
import EditProfile from "@/pages/edit-profile";
import Search from "@/pages/search";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/edit" component={EditProfile} />
      <Route path="/user/:username" component={UserProfile} />
      <Route path="/echo-link" component={EchoLink} />
      <Route path="/search" component={Search} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router />
          <Toaster />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
