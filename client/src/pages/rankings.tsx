import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy,
  Medal,
  Loader2,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserRanking {
  id: number;
  userId: number;
  attendancePoints: number;
  messagePoints: number;
  totalPoints: number;
  lastActivity: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  userName: string;
  userAvatar: string | null;
  courseName: string;
}

type PeriodType = "daily" | "weekly" | "monthly";

export default function Rankings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: rankings, isLoading } = useQuery<UserRanking[]>({
    queryKey: [`/api/rankings/${period}`, { limit: 100 }],
    enabled: isAuthenticated,
  });

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return "text-yellow-500"; // Gold
      case 1: return "text-gray-400"; // Silver
      case 2: return "text-amber-700"; // Bronze
      default: return "text-gray-300";
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className={`h-6 w-6 ${getMedalColor(position)}`} />;
      case 1: return <Medal className={`h-6 w-6 ${getMedalColor(position)}`} />;
      case 2: return <Medal className={`h-6 w-6 ${getMedalColor(position)}`} />;
      default: return <span className="text-gray-500 font-medium">{position + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:w-64`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header 
          title="Student Rankings" 
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <CardTitle>Student Rankings</CardTitle>
                <Tabs 
                  value={period} 
                  onValueChange={(value) => setPeriod(value as PeriodType)}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : rankings && rankings.length > 0 ? (
                <div className="space-y-4">
                  {/* Top 3 Winners */}
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-10 py-8">
                    {/* 2nd Place */}
                    {rankings.length > 1 && (
                      <div className="flex flex-col items-center order-2 sm:order-1">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-300">
                            <Avatar className="w-full h-full">
                              <AvatarImage src={rankings[1].userAvatar || ""} alt={rankings[1].userName} />
                              <AvatarFallback className="bg-gray-200 text-gray-700 text-2xl">
                                {rankings[1].userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-1">
                            <Medal className="h-6 w-6 text-gray-500" />
                          </div>
                        </div>
                        <h3 className="mt-5 text-lg font-bold text-gray-900">{rankings[1].userName}</h3>
                        <p className="text-sm text-gray-500">{rankings[1].courseName}</p>
                        <div className="mt-1 flex items-center text-gray-900">
                          <span className="font-bold text-xl">{rankings[1].totalPoints}</span>
                          <span className="ml-1 text-sm text-gray-500">pts</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 1st Place */}
                    {rankings.length > 0 && (
                      <div className="flex flex-col items-center order-1 sm:order-2 transform sm:scale-110 sm:-mt-4">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400">
                            <Avatar className="w-full h-full">
                              <AvatarImage src={rankings[0].userAvatar || ""} alt={rankings[0].userName} />
                              <AvatarFallback className="bg-yellow-100 text-yellow-800 text-2xl">
                                {rankings[0].userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 rounded-full p-1">
                            <Trophy className="h-6 w-6 text-yellow-900" />
                          </div>
                        </div>
                        <h3 className="mt-5 text-xl font-bold text-gray-900">{rankings[0].userName}</h3>
                        <p className="text-sm text-gray-500">{rankings[0].courseName}</p>
                        <div className="mt-1 flex items-center text-gray-900">
                          <span className="font-bold text-2xl">{rankings[0].totalPoints}</span>
                          <span className="ml-1 text-sm text-gray-500">pts</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 3rd Place */}
                    {rankings.length > 2 && (
                      <div className="flex flex-col items-center order-3">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-600">
                            <Avatar className="w-full h-full">
                              <AvatarImage src={rankings[2].userAvatar || ""} alt={rankings[2].userName} />
                              <AvatarFallback className="bg-amber-100 text-amber-800 text-2xl">
                                {rankings[2].userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-amber-600 rounded-full p-1">
                            <Medal className="h-6 w-6 text-amber-200" />
                          </div>
                        </div>
                        <h3 className="mt-5 text-lg font-bold text-gray-900">{rankings[2].userName}</h3>
                        <p className="text-sm text-gray-500">{rankings[2].courseName}</p>
                        <div className="mt-1 flex items-center text-gray-900">
                          <span className="font-bold text-xl">{rankings[2].totalPoints}</span>
                          <span className="ml-1 text-sm text-gray-500">pts</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full Rankings Table */}
                  <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                              <span>Total Points</span>
                              <ChevronUp className="ml-1 h-4 w-4" />
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participation</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rankings.map((ranking, index) => (
                          <tr key={ranking.id} className={index < 3 ? "bg-gray-50" : ""}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center w-8 h-8">
                                {getMedalIcon(index)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={ranking.userAvatar || ""} alt={ranking.userName} />
                                  <AvatarFallback className="bg-primary-100 text-primary-600">
                                    {ranking.userName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{ranking.userName}</div>
                                  <div className="text-sm text-gray-500">Last active: {new Date(ranking.lastActivity).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{ranking.courseName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{ranking.totalPoints} points</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{ranking.attendancePoints} points</div>
                              <div className="text-xs text-gray-500">{Math.round(ranking.attendancePoints / 10)} sessions</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{ranking.messagePoints} points</div>
                              <div className="text-xs text-gray-500">{ranking.messagePoints} messages</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Trophy className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No rankings available</h3>
                  <p className="text-gray-500 mb-4">
                    Rankings will appear as students participate in courses and send messages.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
