import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Trophy, Medal, Award, Star, Calendar, Clock, User, BookOpen, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Types
interface UserRanking {
  id: number;
  userId: number;
  totalPoints: number;
  attendancePoints: number;
  messagePoints: number;
  period: string;
  periodStart: string;
  periodEnd: string;
  lastActivity: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  };
}

interface UserPoints {
  id: number;
  userId: number;
  points: number;
  reason: string;
  description: string;
  courseId: number | null;
  timestamp: string;
  expiresAt: string | null;
  course?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    username: string;
    fullName: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function DetailedRankingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState<string>("daily");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Fetch rankings
  const { data: rankings, isLoading: rankingsLoading } = useQuery<UserRanking[]>({
    queryKey: ["/api/rankings", period],
    enabled: isAuthenticated,
  });

  // Fetch user points if a user is selected
  const { data: userPoints, isLoading: pointsLoading } = useQuery<UserPoints[]>({
    queryKey: ["/api/user-points", selectedUserId],
    enabled: isAuthenticated && selectedUserId !== null,
  });

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: fr });
  };

  // Get medal icon based on rank
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-700" />;
      default:
        return <Star className="h-6 w-6 text-blue-500" />;
    }
  };

  // Get reason icon
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "attendance":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "participation":
        return <User className="h-4 w-4 text-blue-500" />;
      case "homework":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get reason label
  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "attendance":
        return "Présence";
      case "participation":
        return "Participation";
      case "homework":
        return "Devoir";
      case "message":
        return "Message";
      case "bonus":
        return "Bonus";
      default:
        return reason;
    }
  };

  // Prepare chart data
  const preparePointsDistributionData = () => {
    if (!userPoints) return [];

    const distribution: Record<string, number> = {};
    
    userPoints.forEach(point => {
      const reason = getReasonLabel(point.reason);
      distribution[reason] = (distribution[reason] || 0) + point.points;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  // Prepare points history data
  const preparePointsHistoryData = () => {
    if (!userPoints) return [];

    // Group points by day
    const pointsByDay: Record<string, { date: string, total: number, attendance: number, message: number, homework: number, participation: number, bonus: number }> = {};
    
    userPoints.forEach(point => {
      const day = format(new Date(point.timestamp), "yyyy-MM-dd");
      
      if (!pointsByDay[day]) {
        pointsByDay[day] = {
          date: format(new Date(point.timestamp), "dd/MM"),
          total: 0,
          attendance: 0,
          message: 0,
          homework: 0,
          participation: 0,
          bonus: 0
        };
      }
      
      pointsByDay[day].total += point.points;
      
      switch (point.reason) {
        case "attendance":
          pointsByDay[day].attendance += point.points;
          break;
        case "message":
          pointsByDay[day].message += point.points;
          break;
        case "homework":
          pointsByDay[day].homework += point.points;
          break;
        case "participation":
          pointsByDay[day].participation += point.points;
          break;
        case "bonus":
          pointsByDay[day].bonus += point.points;
          break;
      }
    });

    // Convert to array and sort by date
    return Object.values(pointsByDay).sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });
  };

  // If not authenticated, redirect to login
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
          title="Classements détaillés"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 w-full">
          <div className="mb-6">
            <Tabs defaultValue={period} onValueChange={setPeriod}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Quotidien</TabsTrigger>
                <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
                <TabsTrigger value="monthly">Mensuel</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Rankings */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Classement {period === "daily" ? "quotidien" : period === "weekly" ? "hebdomadaire" : "mensuel"}</CardTitle>
                <CardDescription>
                  {period === "daily" ? "Aujourd'hui" : period === "weekly" ? "Cette semaine" : "Ce mois-ci"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rankingsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : rankings && rankings.length > 0 ? (
                  <div className="space-y-4">
                    {rankings
                      .sort((a, b) => b.totalPoints - a.totalPoints)
                      .map((ranking, index) => (
                        <div
                          key={ranking.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            selectedUserId === ranking.userId ? "bg-blue-50 border-blue-200" : "bg-white"
                          } hover:bg-blue-50 cursor-pointer transition-colors`}
                          onClick={() => setSelectedUserId(ranking.userId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {getMedalIcon(index)}
                            </div>
                            <div>
                              <div className="font-medium">{ranking.user?.fullName || `Utilisateur #${ranking.userId}`}</div>
                              <div className="text-sm text-gray-500">{ranking.user?.username}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{ranking.totalPoints}</div>
                            <div className="text-xs text-gray-500">
                              <span className="text-green-600">{ranking.attendancePoints} présence</span> • 
                              <span className="text-blue-600"> {ranking.messagePoints} messages</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    Aucun classement disponible pour cette période
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Points Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Détails des points</CardTitle>
                <CardDescription>
                  {selectedUserId 
                    ? `Points de ${rankings?.find(r => r.userId === selectedUserId)?.user?.fullName || `Utilisateur #${selectedUserId}`}`
                    : "Sélectionnez un utilisateur pour voir ses points"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedUserId ? (
                  <div className="text-center py-10 text-gray-500">
                    Cliquez sur un utilisateur dans le classement pour voir ses points
                  </div>
                ) : pointsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userPoints && userPoints.length > 0 ? (
                  <Tabs defaultValue="history">
                    <TabsList className="mb-4">
                      <TabsTrigger value="history">Historique</TabsTrigger>
                      <TabsTrigger value="distribution">Distribution</TabsTrigger>
                      <TabsTrigger value="details">Détails</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="history">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={preparePointsHistoryData()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="attendance" name="Présence" stackId="a" fill="#4ade80" />
                            <Bar dataKey="message" name="Messages" stackId="a" fill="#60a5fa" />
                            <Bar dataKey="homework" name="Devoirs" stackId="a" fill="#a78bfa" />
                            <Bar dataKey="participation" name="Participation" stackId="a" fill="#f97316" />
                            <Bar dataKey="bonus" name="Bonus" stackId="a" fill="#facc15" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="distribution">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={preparePointsDistributionData()}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {preparePointsDistributionData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details">
                      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                        {userPoints.map(point => (
                          <div key={point.id} className="flex items-start justify-between p-3 rounded-lg border bg-white">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getReasonIcon(point.reason)}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {getReasonLabel(point.reason)}
                                  <Badge variant="outline">{point.points} points</Badge>
                                </div>
                                <div className="text-sm text-gray-500">{point.description || "Aucune description"}</div>
                                {point.course && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Cours: {point.course.name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div>{formatDate(point.timestamp)}</div>
                              <div>{formatTime(point.timestamp)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    Aucun point trouvé pour cet utilisateur
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Global Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques globales</CardTitle>
              <CardDescription>
                Vue d'ensemble des points et classements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm font-medium text-gray-500 mb-1">Total des points distribués</div>
                  <div className="text-2xl font-bold">
                    {rankings?.reduce((sum, ranking) => sum + ranking.totalPoints, 0) || 0}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm font-medium text-gray-500 mb-1">Utilisateurs actifs</div>
                  <div className="text-2xl font-bold">
                    {rankings?.filter(r => r.totalPoints > 0).length || 0}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm font-medium text-gray-500 mb-1">Moyenne des points</div>
                  <div className="text-2xl font-bold">
                    {rankings && rankings.length > 0
                      ? Math.round(rankings.reduce((sum, ranking) => sum + ranking.totalPoints, 0) / rankings.length)
                      : 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
