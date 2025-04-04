import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Check } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

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

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface DynamicFiltersProps {
  courses: Course[] | undefined;
  onFilterChange: (filters: {
    level: string | null;
    schedule: string | null;
    dayOfWeek: string | null;
    instructor: string | null;
    time: string | null;
  }) => void;
}

export function DynamicFilters({ courses, onFilterChange }: DynamicFiltersProps) {
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterSchedule, setFilterSchedule] = useState<string | null>(null);
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<string | null>(null);
  const [filterInstructor, setFilterInstructor] = useState<string | null>(null);
  const [filterTime, setFilterTime] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Extraire les informations du cours
  const extractCourseInfo = (course: Course) => {
    const result = { ...course };

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

  // Obtenir les options de filtre uniques avec le nombre de cours pour chaque option
  const getFilterOptions = (field: 'level' | 'schedule' | 'dayOfWeek' | 'instructor' | 'professorName' | 'time'): FilterOption[] => {
    if (!courses || courses.length === 0) return [];

    const countMap = new Map<string, number>();

    courses.forEach(course => {
      const info = extractCourseInfo(course);
      let value: string | null = null;

      if (field === 'instructor' || field === 'professorName') {
        value = info.professorName || info.instructor;
      } else if (field === 'time') {
        // Utiliser l'heure du cours directement
        value = course.time;
      } else if (field === 'schedule') {
        // Convertir les codes d'horaire en heures réelles
        const scheduleCode = info.schedule;
        if (scheduleCode) {
          switch(scheduleCode) {
            case 'MW':
              value = 'Lundi/Mercredi';
              break;
            case 'TT':
              value = 'Mardi/Jeudi';
              break;
            case 'FS':
              value = 'Vendredi/Samedi';
              break;
            case 'SS':
              value = 'Samedi/Dimanche';
              break;
            default:
              value = scheduleCode;
          }
        }
      } else {
        value = info[field];
      }

      if (value) {
        countMap.set(value, (countMap.get(value) || 0) + 1);
      }
    });

    // Trier les heures correctement si c'est le champ time
    if (field === 'time') {
      return Array.from(countMap.entries())
        .sort((a, b) => {
          // Extraire les heures pour le tri
          const timeA = a[0].split(':')[0];
          const timeB = b[0].split(':')[0];
          return parseInt(timeA) - parseInt(timeB);
        })
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }));
    }

    // Trier par nombre de cours (décroissant) pour les autres champs
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({
        value,
        label: value,
        count
      }));
  };

  // Mettre à jour les filtres actifs
  useEffect(() => {
    const newActiveFilters: string[] = [];

    if (filterLevel) newActiveFilters.push(`Niveau: ${filterLevel}`);
    if (filterSchedule) newActiveFilters.push(`Jours de cours: ${filterSchedule}`);
    if (filterDayOfWeek) newActiveFilters.push(`Jour: ${filterDayOfWeek}`);
    if (filterInstructor) newActiveFilters.push(`Coach: ${filterInstructor}`);
    if (filterTime) newActiveFilters.push(`Heure: ${filterTime}`);

    setActiveFilters(newActiveFilters);

    // Notifier le composant parent des changements de filtre
    onFilterChange({
      level: filterLevel,
      schedule: filterSchedule,
      dayOfWeek: filterDayOfWeek,
      instructor: filterInstructor,
      time: filterTime
    });
  }, [filterLevel, filterSchedule, filterDayOfWeek, filterInstructor, filterTime, onFilterChange]);

  // Réinitialiser tous les filtres
  const resetAllFilters = () => {
    setFilterLevel(null);
    setFilterSchedule(null);
    setFilterDayOfWeek(null);
    setFilterInstructor(null);
    setFilterTime(null);
  };

  // Supprimer un filtre spécifique
  const removeFilter = (filterText: string) => {
    if (filterText.startsWith('Niveau:')) setFilterLevel(null);
    if (filterText.startsWith('Jours de cours:')) setFilterSchedule(null);
    if (filterText.startsWith('Jour:')) setFilterDayOfWeek(null);
    if (filterText.startsWith('Coach:')) setFilterInstructor(null);
    if (filterText.startsWith('Heure:')) setFilterTime(null);
  };

  // Traduire les jours de la semaine en français
  const translateDayOfWeek = (day: string): string => {
    const translations: Record<string, string> = {
      'Monday': 'Lundi',
      'Tuesday': 'Mardi',
      'Wednesday': 'Mercredi',
      'Thursday': 'Jeudi',
      'Friday': 'Vendredi',
      'Saturday': 'Samedi',
      'Sunday': 'Dimanche'
    };
    return translations[day] || day;
  };

  // Options de filtre
  const levelOptions = getFilterOptions('level');
  const scheduleOptions = getFilterOptions('schedule');
  const dayOfWeekOptions = getFilterOptions('dayOfWeek').map(option => ({
    ...option,
    label: translateDayOfWeek(option.value)
  }));
  const instructorOptions = getFilterOptions('instructor');
  const timeOptions = getFilterOptions('time');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtres:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={filterLevel || "all"}
            onValueChange={(value) => setFilterLevel(value === "all" ? null : value)}
          >
            <SelectTrigger className="h-9 w-[130px] bg-white">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {levelOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="outline" className="ml-2 bg-gray-100">
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterSchedule || "all"}
            onValueChange={(value) => setFilterSchedule(value === "all" ? null : value)}
          >
            <SelectTrigger className="h-9 w-[180px] bg-white">
              <SelectValue placeholder="Jours de cours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les jours de cours</SelectItem>
              {scheduleOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="outline" className="ml-2 bg-gray-100">
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterDayOfWeek || "all"}
            onValueChange={(value) => setFilterDayOfWeek(value === "all" ? null : value)}
          >
            <SelectTrigger className="h-9 w-[130px] bg-white">
              <SelectValue placeholder="Jour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les jours</SelectItem>
              {dayOfWeekOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="outline" className="ml-2 bg-gray-100">
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterTime || "all"}
            onValueChange={(value) => setFilterTime(value === "all" ? null : value)}
          >
            <SelectTrigger className="h-9 w-[130px] bg-white">
              <SelectValue placeholder="Heure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les heures</SelectItem>
              {timeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="outline" className="ml-2 bg-gray-100">
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterInstructor || "all"}
            onValueChange={(value) => setFilterInstructor(value === "all" ? null : value)}
          >
            <SelectTrigger className="h-9 w-[180px] bg-white">
              <SelectValue placeholder="Coach" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les coachs</SelectItem>
              {instructorOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="outline" className="ml-2 bg-gray-100">
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="h-9 bg-white"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Affichage des filtres actifs */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2"
          >
            {activeFilters.map((filter, index) => (
              <motion.div
                key={filter}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary"
                >
                  <Check className="h-3 w-3" />
                  {filter}
                  <button
                    onClick={() => removeFilter(filter)}
                    className="ml-1 rounded-full hover:bg-primary/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
