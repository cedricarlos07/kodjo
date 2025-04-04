import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Book, Calculator, Languages, Code, User, CalendarClock, MessageCircle, BookOpen } from "lucide-react";
import { CourseForm } from "@/components/courses/course-form";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: number;
  name: string;
  instructor: string;
  professorName: string | null;
  level: string | null;
  schedule: string | null;
  dayOfWeek: string;
  time: string;
  zoomLink: string;
  telegramGroup: string | null;
}

export function UpcomingCourses() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [_, navigate] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: courses, isLoading, refetch } = useQuery<Course[]>({
    queryKey: ["/api/courses/upcoming"],
    enabled: isAuthenticated,
  });

  const getLevelColor = (level: string | null) => {
    if (!level) return "bg-gray-100 text-gray-800";
    switch (level) {
      case "BBG":
        return "bg-blue-100 text-blue-800";
      case "ABG":
        return "bg-purple-100 text-purple-800";
      case "IG":
        return "bg-green-100 text-green-800";
      case "ZBG":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScheduleIcon = (schedule: string | null) => {
    if (!schedule) return BookOpen;
    switch (schedule) {
      case "MW":
        return CalendarClock;
      case "TT":
        return BookOpen;
      case "SS":
        return MessageCircle;
      case "FS":
        return Code;
      default:
        return BookOpen;
    }
  };

  const getIconColor = (level: string | null) => {
    if (!level) return "bg-gray-100 text-gray-600";
    switch (level) {
      case "BBG":
        return "bg-blue-100 text-blue-600";
      case "ABG":
        return "bg-purple-100 text-purple-600";
      case "IG":
        return "bg-green-100 text-green-600";
      case "ZBG":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatTime = (time: string) => {
    if (time.includes('h')) return time; // Format français déjà formaté

    // Convert "HH:MM" to "H:MM AM/PM"
    const [hours, minutes] = time.split(":");
    if (!hours || !minutes) return time;

    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  // Get today's day name
  const getDayName = () => {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return days[new Date().getDay()];
  };

  const today = getDayName();

  const handleCreateCourse = async () => {
    await refetch();
    setCreateDialogOpen(false);
  };

  const startZoomSession = (zoomLink: string) => {
    window.open(zoomLink, "_blank");
  };

  // Formatage du jour pour afficher correctement les prochains cours
  const getTodayOrTomorrow = (dayOfWeek: string) => {
    if (dayOfWeek === today) return "Aujourd'hui";

    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const todayIndex = days.indexOf(today);
    const courseIndex = days.indexOf(dayOfWeek);

    // Si le cours est demain
    if ((todayIndex + 1) % 7 === courseIndex) return "Demain";

    return dayOfWeek;
  };

  return (
    <>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <CalendarClock className="mr-2 h-5 w-5 text-primary-500" />
          Prochains cours
        </h3>
        <p className="mt-1 text-sm text-gray-500">Prochains cours au programme</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horaire</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24 mt-1" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </td>
                </tr>
              ))
            ) : courses && courses.length > 0 ? (
              courses.map((course) => {
                const Icon = getScheduleIcon(course.schedule);
                const iconClass = getIconColor(course.level);
                const isTodayCourse = course.dayOfWeek === today;
                const status = isTodayCourse ? "Prêt" : "En attente";
                const statusClass = isTodayCourse
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800";
                const displayDay = getTodayOrTomorrow(course.dayOfWeek);

                return (
                  <tr key={course.id} className={isTodayCourse ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md ${iconClass}`}>
                          <Icon size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 mr-2">
                              {course.professorName || course.instructor}
                            </div>
                            {course.level && (
                              <Badge variant="outline" className={`${getLevelColor(course.level)}`}>
                                {course.level}
                              </Badge>
                            )}
                          </div>
                          {course.telegramGroup && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1 text-primary-400" />
                              ID: {course.telegramGroup}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatTime(course.time)}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <CalendarClock className="h-3 w-3 mr-1 text-primary-400" />
                        {displayDay}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.schedule && (
                        <Badge variant="secondary" className="font-medium">
                          {course.schedule}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        className="text-primary-600 hover:text-primary-900 mr-3 text-xs"
                        onClick={() => startZoomSession(course.zoomLink)}
                      >
                        <Video className="h-3 w-3 mr-1" /> Zoom
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Aucun cours à venir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="mr-2">
                Ajouter un cours
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau cours</DialogTitle>
              </DialogHeader>
              <CourseForm onSuccess={handleCreateCourse} />
            </DialogContent>
          </Dialog>
        )}

        <Button onClick={() => navigate("/courses")}>
          Voir tous les cours
        </Button>
      </div>
    </>
  );
}

// These components are used inside the component but need to be defined
const Video = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

const Edit = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
