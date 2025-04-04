import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CoursesTutorial } from "@/components/tutorials";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { CourseForm } from "@/components/courses/course-form";
import { DynamicFilters } from "@/components/courses/dynamic-filters";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Book, Calculator, Languages, Code, Music, Atom, User, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface Course {
  id: number;
  courseNumber: number | null;
  name: string;
  instructor: string;
  professorName: string | null;
  level: string | null;
  schedule: string | null;
  dayOfWeek: string;
  time: string;
  zoomLink: string;
  zoomId: string | null;
  telegramGroup: string | null;
  startDateTime: string | null;
  duration: number | null;
}

export function Courses() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<number | null>(null);
  const [filters, setFilters] = useState<{
    level: string | null;
    schedule: string | null;
    dayOfWeek: string | null;
    instructor: string | null;
    time: string | null;
  }>({ level: null, schedule: null, dayOfWeek: null, instructor: null, time: null });
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Cours supprimé",
        description: "Le cours a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de la suppression du cours",
        variant: "destructive",
      });
    },
  });

  const handleDeleteCourse = (courseId: number) => {
    setDeleteCourseId(courseId);
  };

  const confirmDeleteCourse = () => {
    if (deleteCourseId) {
      deleteMutation.mutate(deleteCourseId);
      setDeleteCourseId(null);
    }
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    setEditCourse(null);
    queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    toast({
      title: editCourse ? "Cours mis à jour" : "Cours créé",
      description: editCourse
        ? "Le cours a été mis à jour avec succès."
        : "Le cours a été créé avec succès.",
    });
  };

  const getLevelIcon = (level: string | null) => {
    if (!level) return User;
    switch (level) {
      case "BBG":
        return Book;
      case "ABG":
        return Languages;
      case "IG":
        return Calculator;
      case "ZBG":
        return Code;
      default:
        return User;
    }
  };

  const getLevelColor = (level: string | null) => {
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

  const openEditDialog = (course: Course) => {
    setEditCourse(course);
    setCreateDialogOpen(true);
  };

  // Extraire les informations du nom du cours si les champs sont manquants
  const extractCourseInfo = (course: Course) => {
    // Si les champs sont déjà remplis, les utiliser
    const result = {
      professorName: course.professorName || "",
      level: course.level || "",
      schedule: course.schedule || "",
    };

    // Si les champs ne sont pas définis, extraire du nom du cours
    if (!result.professorName || !result.level || !result.schedule) {
      const nameParts = course.name.split(" - ");
      if (nameParts.length >= 3) {
        if (!result.professorName) result.professorName = nameParts[0];
        if (!result.level) result.level = nameParts[1];
        if (!result.schedule) result.schedule = nameParts[2];
      }
    }

    return result;
  };

  // Extraire les valeurs uniques avec support pour les informations dans le nom
  const getUniqueValues = (courses: Course[] | undefined, field: 'level' | 'schedule' | 'professorName') => {
    if (!courses) return [];

    const values = courses.map(course => {
      const info = extractCourseInfo(course);
      return info[field];
    }).filter(Boolean);

    return Array.from(new Set(values));
  };

  // Fonction de rappel pour mettre à jour les filtres
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Filtrage avec support pour les informations dans le nom
  const filteredCourses = courses?.filter(course => {
    const info = extractCourseInfo(course);

    const levelMatch = !filters.level || info.level === filters.level;
    const scheduleMatch = !filters.schedule || info.schedule === filters.schedule;
    const dayOfWeekMatch = !filters.dayOfWeek || course.dayOfWeek === filters.dayOfWeek;
    const instructorMatch = !filters.instructor ||
                           info.professorName === filters.instructor ||
                           course.instructor === filters.instructor;
    const timeMatch = !filters.time || course.time === filters.time;

    return levelMatch && scheduleMatch && dayOfWeekMatch && instructorMatch && timeMatch;
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:w-64`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header
          title="Cours"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gestion des cours</CardTitle>
                {isAdmin && (
                  <Button onClick={() => { setEditCourse(null); setCreateDialogOpen(true); }}>
                    Ajouter un cours
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : courses && courses.length > 0 ? (
                <div className="space-y-4">
                  <DynamicFilters
                    courses={courses}
                    onFilterChange={handleFilterChange}
                  />

                  <Table className="border rounded-md">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold w-12 text-center">Nº</TableHead>
                        <TableHead className="font-semibold">Nom du cours</TableHead>
                        <TableHead className="font-semibold">Coach</TableHead>
                        <TableHead className="font-semibold">Niveau</TableHead>
                        <TableHead className="font-semibold">Jours</TableHead>
                        <TableHead className="font-semibold">Horaire</TableHead>
                        <TableHead className="font-semibold">Jour spécifique</TableHead>
                        <TableHead className="font-semibold">Zoom ID</TableHead>
                        <TableHead className="font-semibold">Groupe Telegram</TableHead>
                        <TableHead className="font-semibold">Durée (min)</TableHead>
                        {isAdmin && <TableHead className="text-right font-semibold">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses?.map((course) => {
                        const courseInfo = extractCourseInfo(course);
                        const IconComponent = getLevelIcon(courseInfo.level);
                        const iconClasses = getLevelColor(courseInfo.level);

                        return (
                          <TableRow key={course.id} className="hover:bg-gray-50">
                            <TableCell className="text-center font-semibold">
                              <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200 px-2 py-1">
                                {course.courseNumber || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md ${iconClasses}`}>
                                  <IconComponent size={20} />
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium">{course.name}</div>
                                  <div className="text-sm text-gray-500">{course.instructor}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {extractCourseInfo(course).professorName || 'Non spécifié'}
                            </TableCell>
                            <TableCell>
                              {extractCourseInfo(course).level ? (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 font-medium">
                                  {extractCourseInfo(course).level}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {extractCourseInfo(course).schedule ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                  {extractCourseInfo(course).schedule}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-gray-900">{course.time}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 font-medium">
                                {course.dayOfWeek}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium px-2 py-1">
                                {course.zoomId || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium px-2 py-1">
                                {course.telegramGroup || "Non défini"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium px-2 py-1">
                                {course.duration || "-"}
                              </Badge>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(course)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Edit size={16} className="mr-1" />
                                    <span className="sr-only md:not-sr-only md:inline-block">Modifier</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 size={16} className="mr-1" />
                                    <span className="sr-only md:not-sr-only md:inline-block">Supprimer</span>
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Book className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun cours trouvé</h3>
                  <p className="text-gray-500 mb-4">Commencez par créer votre premier cours.</p>
                  {isAdmin && (
                    <Button onClick={() => { setEditCourse(null); setCreateDialogOpen(true); }}>
                      Ajouter un cours
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create/Edit Course Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
          </DialogHeader>
          <CourseForm course={editCourse as any} onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteCourseId !== null} onOpenChange={(open) => !open && setDeleteCourseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement ce cours et toutes les données associées. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCourse}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CoursesTutorial />
    </div>
  );
}