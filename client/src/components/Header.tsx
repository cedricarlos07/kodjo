import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(3); // Dummy notification count
  
  // Get the page title based on the current location
  const getPageTitle = () => {
    if (location === "/") return "Dashboard";
    if (location.startsWith("/courses")) return "Courses";
    if (location.startsWith("/students")) return "Students";
    if (location.startsWith("/notifications")) return "Notifications";
    if (location.startsWith("/rankings")) return "Rankings";
    if (location.startsWith("/automation")) return "Automation";
    if (location.startsWith("/settings")) return "Settings";
    if (location.startsWith("/logs")) return "Logs";
    
    return "EduTrack";
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  return (
    <header className="bg-white shadow">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            onClick={toggleSidebar} 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                  {notifications}
                </span>
              )}
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 flex items-center">
                <span className="hidden md:block mr-2 text-sm font-medium text-gray-700">
                  {user?.fullName || "User"}
                </span>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img 
                      className="h-8 w-8 rounded-full" 
                      src={user.avatarUrl} 
                      alt={`${user.fullName}'s profile`}
                    />
                  ) : (
                    <User size={16} className="text-gray-500" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
