import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DashboardTutorial } from '@/components/tutorials';
import { AnimatedStatsCard } from '@/components/dashboard/animated-stats-card';
import { AnimatedUpcomingCourses } from '@/components/dashboard/animated-upcoming-courses';
import { AnimatedUserRankings } from '@/components/dashboard/animated-user-rankings';
import { AnimatedNotifications } from '@/components/dashboard/animated-notifications';
import { AnimatedAttendance } from '@/components/dashboard/animated-attendance';
import { AnimatedChart } from '@/components/dashboard/animated-chart';
import { useAuth } from '@/context/auth-context';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { API_ENDPOINTS } from '@/lib/config';

interface DashboardStats {
  activeStudents: number;
  activeCourses: number;
  todaySessions: number;
  notificationsSent: number;
  trends?: {
    students?: number;
    courses?: number;
    sessions?: number;
    notifications?: number;
  };
  activityChart?: {
    name: string;
    value: number;
  }[];
}

export default function ModernDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setIsVisible(true);
  }, []);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: [API_ENDPOINTS.STATS],
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
            <div className="px-2 py-2">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <AnimatedStatsCard
                  title="Utilisateurs actifs"
                  value={stats?.activeStudents || 0}
                  icon="Users"
                  color="primary"
                  trend={stats?.trends?.students || 0}
                  trendLabel="vs. semaine dernière"
                />
                <AnimatedStatsCard
                  title="Cours actifs"
                  value={stats?.activeCourses || 0}
                  icon="Book"
                  color="green"
                  trend={stats?.trends?.courses || 0}
                  trendLabel="vs. semaine dernière"
                />
                <AnimatedStatsCard
                  title="Sessions aujourd'hui"
                  value={stats?.todaySessions || 0}
                  icon="Video"
                  color="blue"
                  trend={stats?.trends?.sessions || 0}
                  trendLabel="vs. hier"
                />
                <AnimatedStatsCard
                  title="Notifications envoyées"
                  value={stats?.notificationsSent || 0}
                  icon="MessageSquare"
                  color="yellow"
                  trend={stats?.trends?.notifications || 0}
                  trendLabel="vs. semaine dernière"
                />
              </div>

              {/* Activity Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-6"
              >
                <AnimatedChart
                  title="Activité de la plateforme"
                  subtitle="Aperçu des 7 derniers jours"
                  data={stats?.activityChart || []}
                  type="area"
                  colors={{
                    primary: '#4f46e5',
                    gradient: {
                      from: 'rgba(79, 70, 229, 0.6)',
                      to: 'rgba(79, 70, 229, 0.1)'
                    }
                  }}
                  height={240}
                />
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Courses Section */}
                <div className="lg:col-span-2">
                  <AnimatedUpcomingCourses />
                </div>

                {/* User Rankings Section */}
                <div>
                  <AnimatedUserRankings />
                </div>
              </div>

              {/* Recent Notifications and Attendance Section */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Notifications Section */}
                <div className="lg:col-span-2">
                  <AnimatedNotifications />
                </div>

                {/* Attendance Overview Section */}
                <div>
                  <AnimatedAttendance />
                </div>
              </div>
            </div>
          )}
        </main>
        <DashboardTutorial />
      </div>
    </div>
  );
}
