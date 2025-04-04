import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, Users, BookOpen, MessageSquare, Trophy, Clock, BarChart3, PieChart, LineChart, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { format, subDays, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { ExportButton } from "@/components/export";

import ChartComponent from "@/components/charts/ChartComponent";

// Types pour les statistiques
interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalAttendance: number;
  totalMessages: number;
  activeUsers: number;
  averageAttendanceRate: number;
  totalPoints: number;
}

interface AttendanceStats {
  courseAttendance: {
    courseName: string;
    attendanceRate: number;
    totalSessions: number;
  }[];
  userAttendance: {
    userName: string;
    attendanceRate: number;
    totalSessions: number;
  }[];
  attendanceByDay: {
    day: string;
    count: number;
  }[];
  attendanceByTime: {
    hour: number;
    count: number;
  }[];
}

interface EngagementStats {
  messagesByUser: {
    userName: string;
    messageCount: number;
  }[];
  messagesByGroup: {
    groupName: string;
    messageCount: number;
  }[];
  messagesByDay: {
    day: string;
    count: number;
  }[];
  messagesByHour: {
    hour: number;
    count: number;
  }[];
}

interface PerformanceStats {
  topPerformers: {
    userName: string;
    points: number;
    rank: number;
  }[];
  pointsByCategory: {
    category: string;
    points: number;
  }[];
  pointsTrend: {
    date: string;
    points: number;
  }[];
}

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState("30days");
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Calculer les dates de début et de fin en fonction de la plage sélectionnée
  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "7days":
        startDate = subDays(endDate, 7);
        break;
      case "30days":
        startDate = subDays(endDate, 30);
        break;
      case "90days":
        startDate = subDays(endDate, 90);
        break;
      case "6months":
        startDate = subMonths(endDate, 6);
        break;
      case "1year":
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd")
    };
  };

  // Obtenir un libellé lisible pour la plage de dates
  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case "7days":
        return "7 derniers jours";
      case "30days":
        return "30 derniers jours";
      case "90days":
        return "90 derniers jours";
      case "6months":
        return "6 derniers mois";
      case "1year":
        return "Dernière année";
      default:
        return "30 derniers jours";
    }
  };

  // Requête pour obtenir les statistiques générales
  const { data: platformStats, isLoading: isLoadingPlatformStats } = useQuery<PlatformStats>({
    queryKey: ["/api/stats/platform", dateRange],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const response = await apiRequest(`/api/stats/platform?startDate=${startDate}&endDate=${endDate}`);
      return response;
    },
    enabled: isAuthenticated && isAdmin,
  });

  // Requête pour obtenir les statistiques de présence
  const { data: attendanceStats, isLoading: isLoadingAttendanceStats } = useQuery<AttendanceStats>({
    queryKey: ["/api/stats/attendance", dateRange],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const response = await apiRequest(`/api/stats/attendance?startDate=${startDate}&endDate=${endDate}`);
      return response;
    },
    enabled: isAuthenticated && isAdmin,
  });

  // Requête pour obtenir les statistiques d'engagement
  const { data: engagementStats, isLoading: isLoadingEngagementStats } = useQuery<EngagementStats>({
    queryKey: ["/api/stats/engagement", dateRange],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const response = await apiRequest(`/api/stats/engagement?startDate=${startDate}&endDate=${endDate}`);
      return response;
    },
    enabled: isAuthenticated && isAdmin,
  });

  // Requête pour obtenir les statistiques de performance
  const { data: performanceStats, isLoading: isLoadingPerformanceStats } = useQuery<PerformanceStats>({
    queryKey: ["/api/stats/performance", dateRange],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const response = await apiRequest(`/api/stats/performance?startDate=${startDate}&endDate=${endDate}`);
      return response;
    },
    enabled: isAuthenticated && isAdmin,
  });



  // Données fictives pour les graphiques (à remplacer par les données réelles)
  const mockPlatformStats: PlatformStats = {
    totalUsers: 120,
    totalCourses: 25,
    totalAttendance: 1250,
    totalMessages: 3450,
    activeUsers: 85,
    averageAttendanceRate: 78.5,
    totalPoints: 12500
  };

  const mockAttendanceStats: AttendanceStats = {
    courseAttendance: [
      { courseName: "Anglais Débutant", attendanceRate: 85, totalSessions: 24 },
      { courseName: "Anglais Intermédiaire", attendanceRate: 78, totalSessions: 24 },
      { courseName: "Anglais Avancé", attendanceRate: 92, totalSessions: 24 },
      { courseName: "Conversation Anglaise", attendanceRate: 65, totalSessions: 12 },
      { courseName: "Business English", attendanceRate: 88, totalSessions: 18 }
    ],
    userAttendance: [
      { userName: "Jean Dupont", attendanceRate: 95, totalSessions: 20 },
      { userName: "Marie Martin", attendanceRate: 88, totalSessions: 18 },
      { userName: "Pierre Durand", attendanceRate: 75, totalSessions: 16 },
      { userName: "Sophie Lefebvre", attendanceRate: 92, totalSessions: 22 },
      { userName: "Lucas Bernard", attendanceRate: 80, totalSessions: 15 }
    ],
    attendanceByDay: [
      { day: "Lundi", count: 250 },
      { day: "Mardi", count: 320 },
      { day: "Mercredi", count: 280 },
      { day: "Jeudi", count: 220 },
      { day: "Vendredi", count: 180 },
      { day: "Samedi", count: 120 },
      { day: "Dimanche", count: 80 }
    ],
    attendanceByTime: [
      { hour: 8, count: 120 },
      { hour: 10, count: 180 },
      { hour: 12, count: 90 },
      { hour: 14, count: 150 },
      { hour: 16, count: 200 },
      { hour: 18, count: 220 },
      { hour: 20, count: 100 }
    ]
  };

  const mockEngagementStats: EngagementStats = {
    messagesByUser: [
      { userName: "Jean Dupont", messageCount: 320 },
      { userName: "Marie Martin", messageCount: 280 },
      { userName: "Pierre Durand", messageCount: 250 },
      { userName: "Sophie Lefebvre", messageCount: 220 },
      { userName: "Lucas Bernard", messageCount: 180 }
    ],
    messagesByGroup: [
      { groupName: "Anglais Débutant", messageCount: 850 },
      { groupName: "Anglais Intermédiaire", messageCount: 720 },
      { groupName: "Anglais Avancé", messageCount: 650 },
      { groupName: "Conversation Anglaise", messageCount: 520 },
      { groupName: "Business English", messageCount: 710 }
    ],
    messagesByDay: [
      { day: "Lundi", count: 520 },
      { day: "Mardi", count: 480 },
      { day: "Mercredi", count: 620 },
      { day: "Jeudi", count: 380 },
      { day: "Vendredi", count: 450 },
      { day: "Samedi", count: 320 },
      { day: "Dimanche", count: 280 }
    ],
    messagesByHour: [
      { hour: 8, count: 180 },
      { hour: 10, count: 250 },
      { hour: 12, count: 320 },
      { hour: 14, count: 280 },
      { hour: 16, count: 350 },
      { hour: 18, count: 420 },
      { hour: 20, count: 280 }
    ]
  };

  const mockPerformanceStats: PerformanceStats = {
    topPerformers: [
      { userName: "Jean Dupont", points: 1250, rank: 1 },
      { userName: "Marie Martin", points: 1180, rank: 2 },
      { userName: "Pierre Durand", points: 1050, rank: 3 },
      { userName: "Sophie Lefebvre", points: 980, rank: 4 },
      { userName: "Lucas Bernard", points: 920, rank: 5 }
    ],
    pointsByCategory: [
      { category: "Présence", points: 5200 },
      { category: "Messages", points: 3450 },
      { category: "Participation", points: 2800 },
      { category: "Devoirs", points: 1050 },
      { category: "Bonus", points: 800 }
    ],
    pointsTrend: [
      { date: "2023-01-01", points: 850 },
      { date: "2023-02-01", points: 920 },
      { date: "2023-03-01", points: 1050 },
      { date: "2023-04-01", points: 980 },
      { date: "2023-05-01", points: 1120 },
      { date: "2023-06-01", points: 1250 }
    ]
  };

  // Utiliser les données réelles si disponibles, sinon utiliser les données fictives
  const stats = {
    platform: platformStats || mockPlatformStats,
    attendance: attendanceStats || mockAttendanceStats,
    engagement: engagementStats || mockEngagementStats,
    performance: performanceStats || mockPerformanceStats
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Statistiques et Rapports" />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Statistiques et Rapports</h1>
            <div className="flex items-center space-x-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                  <SelectItem value="90days">90 derniers jours</SelectItem>
                  <SelectItem value="6months">6 derniers mois</SelectItem>
                  <SelectItem value="1year">Dernière année</SelectItem>
                </SelectContent>
              </Select>
              <ExportButton
                data={[
                  ...stats.platform.totalUsers ? [{ category: 'Vue d\'ensemble', ...stats.platform }] : [],
                  ...stats.attendance.courseAttendance.map(item => ({ category: 'Présence par cours', ...item })),
                  ...stats.attendance.userAttendance.map(item => ({ category: 'Présence par utilisateur', ...item })),
                  ...stats.engagement.messagesByUser.map(item => ({ category: 'Messages par utilisateur', ...item })),
                  ...stats.engagement.messagesByGroup.map(item => ({ category: 'Messages par groupe', ...item })),
                  ...stats.performance.topPerformers.map(item => ({ category: 'Top performers', ...item }))
                ]}
                columns={[
                  { header: 'Catégorie', dataKey: 'category' },
                  { header: 'Utilisateur', dataKey: 'userName' },
                  { header: 'Cours', dataKey: 'courseName' },
                  { header: 'Groupe', dataKey: 'groupName' },
                  { header: 'Taux de présence', dataKey: 'attendanceRate' },
                  { header: 'Sessions totales', dataKey: 'totalSessions' },
                  { header: 'Nombre de messages', dataKey: 'messageCount' },
                  { header: 'Points', dataKey: 'points' },
                  { header: 'Rang', dataKey: 'rank' },
                  { header: 'Utilisateurs totaux', dataKey: 'totalUsers' },
                  { header: 'Utilisateurs actifs', dataKey: 'activeUsers' },
                  { header: 'Cours totaux', dataKey: 'totalCourses' },
                  { header: 'Présences totales', dataKey: 'totalAttendance' },
                  { header: 'Messages totaux', dataKey: 'totalMessages' },
                  { header: 'Points totaux', dataKey: 'totalPoints' }
                ]}
                defaultOptions={{
                  fileName: `statistiques_${dateRange}`,
                  title: 'Rapport de statistiques',
                  subtitle: `Période: ${getDateRangeLabel(dateRange)}`,
                  includeTimestamp: true,
                  author: user?.fullName || 'Administrateur',
                  dateRange: {
                    startDate: new Date(getDateRange().startDate),
                    endDate: new Date(getDateRange().endDate)
                  }
                }}
              />
            </div>
          </div>

          {isLoadingPlatformStats || isLoadingAttendanceStats || isLoadingEngagementStats || isLoadingPerformanceStats ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Chargement des statistiques...</span>
            </div>
          ) : (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="attendance">Présence</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Vue d'ensemble */}
              <TabsContent value="overview">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.platform.totalUsers}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.platform.activeUsers} utilisateurs actifs
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cours</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.platform.totalCourses}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.platform.totalAttendance} présences enregistrées
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Messages</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.platform.totalMessages}</div>
                      <p className="text-xs text-muted-foreground">
                        Dans tous les groupes Telegram
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Points</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.platform.totalPoints}</div>
                      <p className="text-xs text-muted-foreground">
                        Attribués à tous les utilisateurs
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Taux de présence</CardTitle>
                      <CardDescription>
                        Taux de présence moyen par cours
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="bar"
                        data={stats.attendance.courseAttendance}
                        dataKey="attendanceRate"
                        nameKey="courseName"
                        valueFormatter={(value) => `${value}%`}
                      />
                    </CardContent>
                  </Card>
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Activité des utilisateurs</CardTitle>
                      <CardDescription>
                        Messages et présences par jour
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="line"
                        data={[
                          { day: 'Lundi', messages: stats.engagement.messagesByDay.find(d => d.day === 'Lundi')?.count || 0, attendance: stats.attendance.attendanceByDay.find(d => d.day === 'Lundi')?.count || 0 },
                          { day: 'Mardi', messages: stats.engagement.messagesByDay.find(d => d.day === 'Mardi')?.count || 0, attendance: stats.attendance.attendanceByDay.find(d => d.day === 'Mardi')?.count || 0 },
                          { day: 'Mercredi', messages: stats.engagement.messagesByDay.find(d => d.day === 'Mercredi')?.count || 0, attendance: stats.attendance.attendanceByDay.find(d => d.day === 'Mercredi')?.count || 0 },
                          { day: 'Jeudi', messages: stats.engagement.messagesByDay.find(d => d.day === 'Jeudi')?.count || 0, attendance: stats.attendance.attendanceByDay.find(d => d.day === 'Jeudi')?.count || 0 },
                          { day: 'Vendredi', messages: stats.engagement.messagesByDay.find(d => d.day === 'Vendredi')?.count || 0, attendance: stats.attendance.attendanceByDay.find(d => d.day === 'Vendredi')?.count || 0 },
                          { day: 'Samedi', messages: stats.engagement.messagesByDay.find(d => d.day === 'Samedi')?.count || 0, attendance: stats.attendance.attendanceByDay.find(d => d.day === 'Samedi')?.count || 0 },
                          { day: 'Dimanche', messages: stats.engagement.messagesByDay.find(d => d.day === 'Dimanche')?.count || 0, attendance: stats.attendance.attendanceByDay.find(d => d.day === 'Dimanche')?.count || 0 }
                        ]}
                        lines={[
                          { dataKey: 'messages', color: '#0ea5e9', name: 'Messages' },
                          { dataKey: 'attendance', color: '#10b981', name: 'Présences' }
                        ]}
                        xAxisDataKey="day"
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Distribution des points</CardTitle>
                      <CardDescription>
                        Points attribués par catégorie
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                      type="pie"
                      data={stats.performance.pointsByCategory}
                      dataKey="points"
                      nameKey="category"
                      valueFormatter={(value) => `${value} pts`}
                    />
                    </CardContent>
                  </Card>
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Tendance d'engagement</CardTitle>
                      <CardDescription>
                        Évolution de l'engagement au fil du temps
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="area"
                        data={stats.performance.pointsTrend}
                        dataKey="points"
                        xAxisDataKey="date"
                        valueFormatter={(value) => `${value} pts`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Présence */}
              <TabsContent value="attendance">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Taux de présence par cours</CardTitle>
                      <CardDescription>
                        Pourcentage de présence pour chaque cours
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="bar"
                        data={stats.attendance.courseAttendance}
                        dataKey="attendanceRate"
                        nameKey="courseName"
                        valueFormatter={(value) => `${value}%`}
                      />
                      <div className="mt-4 space-y-2">
                        {stats.attendance.courseAttendance.map((course, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{course.courseName}</span>
                            <div className="flex items-center">
                              <span className="text-sm mr-2">{course.attendanceRate}%</span>
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${course.attendanceRate}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Taux de présence par utilisateur</CardTitle>
                      <CardDescription>
                        Pourcentage de présence pour les utilisateurs les plus actifs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="bar"
                        data={stats.attendance.userAttendance}
                        dataKey="attendanceRate"
                        nameKey="userName"
                        valueFormatter={(value) => `${value}%`}
                      />
                      <div className="mt-4 space-y-2">
                        {stats.attendance.userAttendance.map((user, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{user.userName}</span>
                            <div className="flex items-center">
                              <span className="text-sm mr-2">{user.attendanceRate}%</span>
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${user.attendanceRate}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Présence par jour de la semaine</CardTitle>
                      <CardDescription>
                        Nombre de présences pour chaque jour
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="bar"
                        data={stats.attendance.attendanceByDay}
                        dataKey="count"
                        nameKey="day"
                      />
                    </CardContent>
                  </Card>
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Présence par heure</CardTitle>
                      <CardDescription>
                        Nombre de présences pour chaque heure de la journée
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="line"
                        data={stats.attendance.attendanceByTime}
                        dataKey="count"
                        nameKey="hour"
                        xAxisDataKey="hour"
                        labelFormatter={(value) => `${value}h`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Engagement */}
              <TabsContent value="engagement">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Messages par utilisateur</CardTitle>
                      <CardDescription>
                        Nombre de messages envoyés par les utilisateurs les plus actifs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="bar"
                        data={stats.engagement.messagesByUser}
                        dataKey="messageCount"
                        nameKey="userName"
                      />
                      <div className="mt-4 space-y-2">
                        {stats.engagement.messagesByUser.map((user, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{user.userName}</span>
                            <span className="text-sm">{user.messageCount} messages</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Messages par groupe</CardTitle>
                      <CardDescription>
                        Nombre de messages envoyés dans chaque groupe
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="pie"
                        data={stats.engagement.messagesByGroup}
                        dataKey="messageCount"
                        nameKey="groupName"
                      />
                      <div className="mt-4 space-y-2">
                        {stats.engagement.messagesByGroup.map((group, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{group.groupName}</span>
                            <span className="text-sm">{group.messageCount} messages</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Messages par jour de la semaine</CardTitle>
                      <CardDescription>
                        Nombre de messages envoyés chaque jour
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="bar"
                        data={stats.engagement.messagesByDay}
                        dataKey="count"
                        nameKey="day"
                      />
                    </CardContent>
                  </Card>
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Messages par heure</CardTitle>
                      <CardDescription>
                        Nombre de messages envoyés à chaque heure
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="line"
                        data={stats.engagement.messagesByHour}
                        dataKey="count"
                        nameKey="hour"
                        xAxisDataKey="hour"
                        labelFormatter={(value) => `${value}h`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Performance */}
              <TabsContent value="performance">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Top 5 des utilisateurs</CardTitle>
                      <CardDescription>
                        Utilisateurs ayant accumulé le plus de points
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="bar"
                        data={stats.performance.topPerformers}
                        dataKey="points"
                        nameKey="userName"
                        valueFormatter={(value) => `${value} pts`}
                      />
                      <div className="mt-4 space-y-2">
                        {stats.performance.topPerformers.map((user, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2">
                                {user.rank}
                              </span>
                              <span className="text-sm font-medium">{user.userName}</span>
                            </div>
                            <span className="text-sm">{user.points} points</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Points par catégorie</CardTitle>
                      <CardDescription>
                        Distribution des points par type d'activité
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="pie"
                        data={stats.performance.pointsByCategory}
                        dataKey="points"
                        nameKey="category"
                        valueFormatter={(value) => `${value} pts`}
                      />
                      <div className="mt-4 space-y-2">
                        {stats.performance.pointsByCategory.map((category, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{category.category}</span>
                            <span className="text-sm">{category.points} points</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 mt-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Évolution des points</CardTitle>
                      <CardDescription>
                        Tendance des points attribués au fil du temps
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartComponent
                        type="area"
                        data={stats.performance.pointsTrend}
                        dataKey="points"
                        xAxisDataKey="date"
                        valueFormatter={(value) => `${value} pts`}
                        height={400}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
