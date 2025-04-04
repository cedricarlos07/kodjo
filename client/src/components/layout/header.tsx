import { useState } from "react";
import { Menu, Bell, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  onMobileMenuClick: () => void;
}

export function Header({ title, onMobileMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [_, navigate] = useLocation();

  return (
    <header className="nav-container">
      <div className="px-2 sm:px-4 lg:px-6 py-2 flex items-center justify-between h-12">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-600 hover:bg-gray-100 rounded-full"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center">
            <h1 className="text-base md:text-lg font-semibold text-gray-800 tracking-tight">
              <span className="hidden sm:inline">{title}</span>
              <span className="sm:hidden text-gradient">{title}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            className="text-gray-600 hover:text-primary hover:border-primary/50 hover:bg-primary/5 rounded-full h-8 w-8 relative icon-hover"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-gray-200 overflow-hidden hover:border-primary/50 hover:shadow-sm">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatar || ""} alt={user?.fullName || "Utilisateur"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 p-1" align="end" forceMount>
              <div className="flex items-center justify-start gap-3 p-3 bg-gray-50 rounded-md mb-1">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={user?.avatar || ""} alt={user?.fullName || "Utilisateur"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium leading-none text-gray-800">{user?.fullName || "Utilisateur"}</p>
                  <p className="text-xs leading-none text-gray-500 mt-1">
                    {user?.email || (user?.role === "admin" ? "Administrateur" : "Utilisateur")}
                  </p>
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="flex items-center gap-2 py-2.5 rounded-md cursor-pointer focus:bg-gray-100"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                <span>Paramètres</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={() => logout()}
                className="flex items-center gap-2 py-2.5 text-red-600 hover:text-red-700 rounded-md cursor-pointer focus:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
