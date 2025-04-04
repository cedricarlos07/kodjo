import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { UpcomingCourses } from "@/components/dashboard/upcoming-courses";
import { UserRankings } from "@/components/dashboard/user-rankings";
import { RecentNotifications } from "@/components/dashboard/recent-notifications";
import { AttendanceOverview } from "@/components/dashboard/attendance-overview";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface DashboardStats {
  activeStudents: number;
  activeCourses: number;
  todaySessions: number;
  notificationsSent: number;
}

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 w-full">
      <div className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:w-60`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 w-full">
        <Header
          title="Tableau de bord"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-0 sm:p-2 w-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 w-full px-2">
                <StatsCard
                  title="Utilisateurs actifs"
                  value={stats?.activeStudents || 0}
                  icon="Users"
                  color="primary"
                />
                <StatsCard
                  title="Cours actifs"
                  value={stats?.activeCourses || 0}
                  icon="Book"
                  color="green"
                />
                <StatsCard
                  title="Sessions aujourd'hui"
                  value={stats?.todaySessions || 0}
                  icon="Video"
                  color="blue"
                />
                <StatsCard
                  title="Notifications envoyées"
                  value={stats?.notificationsSent || 0}
                  icon="MessageSquare"
                  color="yellow"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 w-full px-2">
                {/* Upcoming Courses Section */}
                <div className="lg:col-span-2 bg-white shadow rounded-lg">
                  <UpcomingCourses />
                </div>

                {/* User Rankings Section */}
                <div className="bg-white shadow rounded-lg">
                  <UserRankings />
                </div>
              </div>

              {/* Recent Notifications and Attendance Section */}
              <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-2 w-full px-2">
                {/* Recent Notifications Section */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <RecentNotifications />
                </div>

                {/* Attendance Overview Section */}
                <div className="xl:col-span-2 bg-white shadow rounded-lg">
                  <AttendanceOverview />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
