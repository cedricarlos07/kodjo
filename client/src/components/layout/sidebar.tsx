import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { SidebarItem } from "./sidebar-item";
import {
  LayoutDashboard, Book, Users, Send, Trophy,
  Bot, Settings, FileText, LogOut, MessageSquare,
  Video, Bell, Calendar, Award, BarChart
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-md", className)}>
      <div className="flex items-center justify-center h-12 px-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-primary/20 via-white to-primary/10 dark:from-primary/10 dark:via-gray-900 dark:to-primary/5">
        <h1 className="text-lg font-bold text-gradient">KODJO ENGLISH BOT</h1>
      </div>

      <ScrollArea className="flex flex-col flex-1 overflow-y-auto py-2">
        <div className="px-2 mb-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2">
            Menu principal
          </div>
          <nav className="flex-1 space-y-1.5">
            <SidebarItem
              href="/"
              icon={LayoutDashboard}
              label="Tableau de bord"
              currentPath={location}
            />

            <SidebarItem
              href="/courses"
              icon={Book}
              label="Cours"
              currentPath={location}
            />

            <SidebarItem
              href="/utilisateurs"
              icon={Users}
              label="Utilisateurs"
              currentPath={location}
            />
          </nav>
        </div>

        <div className="px-4 mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-4">
            Communication
          </div>
          <nav className="flex-1 space-y-1.5">
            <SidebarItem
              href="/notifications"
              icon={Send}
              label="Notifications"
              currentPath={location}
            />

            <SidebarItem
              href="/rankings"
              icon={Trophy}
              label="Classements"
              currentPath={location}
            />

            <SidebarItem
              href="/detailed-rankings"
              icon={Trophy}
              label="Classements détaillés"
              currentPath={location}
            />

            <SidebarItem
              href="/point-rules"
              icon={Award}
              label="Règles de points"
              currentPath={location}
            />

            <SidebarItem
              href="/attendance-tracking"
              icon={Calendar}
              label="Suivi des présences"
              currentPath={location}
            />
          </nav>
        </div>

        <div className="px-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-4">
            Administration
          </div>
          <nav className="flex-1 space-y-1.5">
            <SidebarItem
              href="/scenarios"
              icon={Calendar}
              label="Scénarios"
              currentPath={location}
            />

            <SidebarItem
              href="/notification-templates"
              icon={MessageSquare}
              label="Modèles de notifications"
              currentPath={location}
            />

            <SidebarItem
              href="/reminder-templates"
              icon={Bell}
              label="Modèles de rappels"
              currentPath={location}
            />

            <SidebarItem
              href="/zoom-links"
              icon={Video}
              label="Liens Zoom"
              currentPath={location}
            />

            <SidebarItem
              href="/notification-simulator"
              icon={Bell}
              label="Simulateur"
              currentPath={location}
            />

            <SidebarItem
              href="/automation"
              icon={Bot}
              label="Automatisation"
              currentPath={location}
            />

            <SidebarItem
              href="/analytics"
              icon={BarChart}
              label="Statistiques"
              currentPath={location}
            />

            <SidebarItem
              href="/logs"
              icon={FileText}
              label="Journaux"
              currentPath={location}
            />

            <SidebarItem
              href="/settings"
              icon={Settings}
              label="Paramètres"
              currentPath={location}
            />
          </nav>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarImage src={user?.avatar || ""} alt={user?.fullName || "Utilisateur"} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {user?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.fullName || "Utilisateur"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => logout()}
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
