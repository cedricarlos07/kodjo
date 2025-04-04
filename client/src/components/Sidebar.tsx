import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  Users, 
  BrandTelegram, 
  Trophy, 
  Bot,
  Settings, 
  Clipboard,
  User
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function SidebarLink({ href, icon, label, isActive }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
        isActive 
          ? "text-white bg-gray-900" 
          : "text-gray-300 hover:text-white hover:bg-gray-700"
      )}>
        <span className="mr-3 text-gray-400">{icon}</span>
        {label}
      </a>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Early return if not authenticated
  if (!isAuthenticated) return null;

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-gray-800 border-r border-gray-700">
        <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
          <h1 className="text-xl font-bold text-white">EduTrack</h1>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            <SidebarLink 
              href="/" 
              icon={<Home size={18} />} 
              label="Dashboard" 
              isActive={location === "/"} 
            />
            
            <SidebarLink 
              href="/courses" 
              icon={<BookOpen size={18} />} 
              label="Courses" 
              isActive={location.startsWith("/courses")} 
            />
            
            <SidebarLink 
              href="/students" 
              icon={<Users size={18} />} 
              label="Students" 
              isActive={location.startsWith("/students")} 
            />
            
            <SidebarLink 
              href="/notifications" 
              icon={<BrandTelegram size={18} />} 
              label="Notifications" 
              isActive={location.startsWith("/notifications")} 
            />
            
            <SidebarLink 
              href="/rankings" 
              icon={<Trophy size={18} />} 
              label="Rankings" 
              isActive={location.startsWith("/rankings")} 
            />
            
            <SidebarLink 
              href="/automation" 
              icon={<Bot size={18} />} 
              label="Automation" 
              isActive={location.startsWith("/automation")} 
            />
            
            <SidebarLink 
              href="/settings" 
              icon={<Settings size={18} />} 
              label="Settings" 
              isActive={location.startsWith("/settings")} 
            />
            
            <SidebarLink 
              href="/logs" 
              icon={<Clipboard size={18} />} 
              label="Logs" 
              isActive={location.startsWith("/logs")} 
            />
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
              {user?.avatarUrl ? (
                <img 
                  className="h-8 w-8 rounded-full" 
                  src={user.avatarUrl} 
                  alt={`${user.fullName}'s profile`}
                />
              ) : (
                <User size={16} className="text-gray-300" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.fullName || "User"}</p>
              <p className="text-xs font-medium text-gray-300">
                {user?.role === "admin" ? "Administrator" : "User"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
