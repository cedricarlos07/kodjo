import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Calendar, Clock, User, BookOpen, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, parseISO, differenceInMinutes, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Progress } from "@/components/ui/progress";

// Types
interface ZoomAttendance {
  id: number;
  userId: number;
  courseId: number;
  meetingId: string;
  joinTime: string;
  leaveTime: string | null;
  duration: number | null;
  attentionScore: number | null;
  timestamp: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
  };
  course?: {
    id: number;
    name: string;
  };
}

interface AttendanceStats {
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
}

interface Course {
  id: number;
  name: string;
  level: string;
  schedule: string;
  instructor: string;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Columns for attendance table
const attendanceColumns: ColumnDef<ZoomAttendance>[] = [
  {
    accessorKey: "course.name",
    header: "Cours",
  },
  {
    accessorKey: "joinTime",
    header: "Heure d'arrivée",
    cell: ({ row }) => {
      const joinTime = parseISO(row.getValue("joinTime"));
      return format(joinTime, "dd/MM/yyyy HH:mm:ss");
    },
  },
  {
    accessorKey: "leaveTime",
    header: "Heure de départ",
    cell: ({ row }) => {
      const leaveTime = row.getValue("leaveTime");
      return leaveTime ? format(parseISO(leaveTime as string), "dd/MM/yyyy HH:mm:ss") : "En cours";
    },
  },
  {
    accessorKey: "duration",
    header: "Durée",
    cell: ({ row }) => {
      const duration = row.getValue("duration");
      if (duration) {
        const minutes = Number(duration);
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
      } else if (row.getValue("joinTime") && row.getValue("leaveTime")) {
        const joinTime = parseISO(row.getValue("joinTime"));
        const leaveTime = parseISO(row.getValue("leaveTime"));
        const minutes = differenceInMinutes(leaveTime, joinTime);
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
      } else if (row.getValue("joinTime")) {
        const joinTime = parseISO(row.getValue("joinTime"));
        const now = new Date();
        const minutes = differenceInMinutes(now, joinTime);
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m (en cours)`;
      }
      return "N/A";
    },
  },
  {
    accessorKey: "attentionScore",
    header: "Attention",
    cell: ({ row }) => {
      const score = row.getValue("attentionScore");
      if (score === null) return "N/A";

      const numScore = Number(score);
      let color = "bg-red-500";
      if (numScore >= 70) color = "bg-green-500";
      else if (numScore >= 40) color = "bg-yellow-500";

      return (
        <div className="flex items-center gap-2">
          <Progress value={numScore} className="w-20" />
          <span>{numScore}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const leaveTime = row.getValue("leaveTime");
      const joinTime = parseISO(row.getValue("joinTime"));
      const now = new Date();

      if (!leaveTime && differenceInMinutes(now, joinTime) < 180) {
        return <Badge className="bg-green-500">En cours</Badge>;
      } else if (!leaveTime) {
        return <Badge className="bg-red-500">Déconnexion anormale</Badge>;
      } else {
        return <Badge className="bg-blue-500">Terminé</Badge>;
      }
    },
  },
];

export default function AttendanceTrackingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const { isAuthenticated, user, isAdmin } = useAuth();

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: isAuthenticated,
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery<ZoomAttendance[]>({
    queryKey: ["/api/attendance", selectedUserId, selectedCourseId, dateRange],
    enabled: isAuthenticated && (selectedUserId !== null || selectedCourseId !== null),
  });

  // Fetch attendance stats
  const { data: attendanceStats, isLoading: statsLoading } = useQuery<AttendanceStats>({
    queryKey: ["/api/attendance/stats", selectedUserId, selectedCourseId],
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

  // Prepare attendance by day chart data
  const prepareAttendanceByDayData = () => {
    if (!attendanceData) return [];

    const attendanceByDay: Record<string, { date: string, totalDuration: number, count: number }> = {};

    attendanceData.forEach(attendance => {
      const day = format(new Date(attendance.joinTime), "yyyy-MM-dd");

      if (!attendanceByDay[day]) {
        attendanceByDay[day] = {
          date: format(new Date(attendance.joinTime), "dd/MM"),
          totalDuration: 0,
          count: 0
        };
      }

      attendanceByDay[day].totalDuration += attendance.duration || 0;
      attendanceByDay[day].count += 1;
    });

    // Convert to array and sort by date
    return Object.values(attendanceByDay).sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Prepare attendance by course chart data
  const prepareAttendanceByCourseData = () => {
    if (!attendanceData) return [];

    const attendanceByCourse: Record<string, { name: string, totalDuration: number, count: number }> = {};

    attendanceData.forEach(attendance => {
      const courseName = attendance.course?.name || `Course #${attendance.courseId}`;

      if (!attendanceByCourse[courseName]) {
        attendanceByCourse[courseName] = {
          name: courseName,
          totalDuration: 0,
          count: 0
        };
      }

      attendanceByCourse[courseName].totalDuration += attendance.duration || 0;
      attendanceByCourse[courseName].count += 1;
    });

    // Convert to array
    return Object.values(attendanceByCourse);
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
          title="Suivi des présences"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 w-full">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>
                Filtrer les données de présence par utilisateur, cours et période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isAdmin && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Utilisateur</label>
                    <Select
                      value={selectedUserId?.toString() || "all"}
                      onValueChange={(value) => setSelectedUserId(value === 'all' ? null : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les utilisateurs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les utilisateurs</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">Cours</label>
                  <Select
                    value={selectedCourseId?.toString() || "all"}
                    onValueChange={(value) => setSelectedCourseId(value === 'all' ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les cours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les cours</SelectItem>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Période</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={format(dateRange.start, "yyyy-MM-dd")}
                      onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                    />
                    <span>à</span>
                    <Input
                      type="date"
                      value={format(dateRange.end, "yyyy-MM-dd")}
                      onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {selectedUserId && attendanceStats && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Statistiques de présence</CardTitle>
                <CardDescription>
                  Résumé des présences pour {users?.find(u => u.id === selectedUserId)?.fullName || `Utilisateur #${selectedUserId}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div className="text-sm font-medium text-gray-500">Sessions totales</div>
                    </div>
                    <div className="text-2xl font-bold mt-2">{attendanceStats.totalSessions}</div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-500" />
                      <div className="text-sm font-medium text-gray-500">Durée totale</div>
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {Math.floor(attendanceStats.totalDuration / 60)}h {attendanceStats.totalDuration % 60}m
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      <div className="text-sm font-medium text-gray-500">Durée moyenne</div>
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {Math.floor(attendanceStats.averageDuration / 60)}h {attendanceStats.averageDuration % 60}m
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          {attendanceData && attendanceData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Présence par jour</CardTitle>
                  <CardDescription>
                    Durée totale de présence par jour
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareAttendanceByDayData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${Math.floor(Number(value) / 60)}h ${Number(value) % 60}m`, 'Durée']} />
                        <Legend />
                        <Bar dataKey="totalDuration" name="Durée totale" fill="#4ade80" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Présence par cours</CardTitle>
                  <CardDescription>
                    Répartition du temps par cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareAttendanceByCourseData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalDuration"
                        >
                          {prepareAttendanceByCourseData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${Math.floor(Number(value) / 60)}h ${Number(value) % 60}m`, 'Durée']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des présences</CardTitle>
              <CardDescription>
                Liste détaillée des présences aux cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : attendanceData && attendanceData.length > 0 ? (
                <DataTable columns={attendanceColumns} data={attendanceData} />
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Aucune donnée de présence trouvée pour les filtres sélectionnés
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
