import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  SearchIcon,
  BellIcon,
  MessageSquareIcon,
  UserIcon
} from "lucide-react";

export function MobileNavigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", icon: <HomeIcon size={22} /> },
    { href: "/explore", icon: <SearchIcon size={22} /> },
    { href: "/notifications", icon: <BellIcon size={22} /> },
    { href: "/messages", icon: <MessageSquareIcon size={22} /> },
    { href: "/profile", icon: <UserIcon size={22} /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around items-center py-2 px-4 z-40">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <a className={cn(
            "p-2 flex items-center justify-center",
            location === link.href ? "text-white" : "text-gray-400"
          )}>
            {link.icon}
          </a>
        </Link>
      ))}
    </nav>
  );
}
