import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from './animated-card';
import { Book, Video, Clock, Calendar, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';

interface Course {
  id: number;
  name: string;
  instructor: string;
  dayOfWeek: string;
  time: string;
  zoomLink: string;
}

export function AnimatedUpcomingCourses() {
  const [_, navigate] = useLocation();
  const [today, setToday] = useState('');
  
  useEffect(() => {
    setToday(getDayName());
  }, []);
  
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses/upcoming'],
  });
  
  // Get today's day name
  const getDayName = () => {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return days[new Date().getDay()];
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
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <AnimatedCard 
      title="Prochains cours" 
      icon="Calendar"
      iconColor="blue"
      headerAction={
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => navigate('/courses')}
        >
          Voir tous les cours
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : courses && courses.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {courses.slice(0, 5).map((course) => {
            const isTodayCourse = course.dayOfWeek === today;
            const status = isTodayCourse ? "Prêt" : "En attente";
            
            return (
              <motion.div
                key={course.id}
                variants={item}
                className="group relative rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Book className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{course.name}</h4>
                      <p className="text-sm text-gray-500">{course.instructor}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-gray-700">{getTodayOrTomorrow(course.dayOfWeek)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-gray-600">{course.time}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    isTodayCourse 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      isTodayCourse ? 'bg-green-600' : 'bg-amber-600'
                    }`} />
                    {status}
                  </div>
                  
                  <a 
                    href={course.zoomLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Rejoindre
                    <ExternalLink className="ml-0.5 h-3 w-3" />
                  </a>
                </div>
                
                <div className="absolute inset-0 rounded-lg border-2 border-transparent transition-all group-hover:border-blue-200" />
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun cours à venir</h3>
          <p className="mt-1 text-sm text-gray-500">Tous les cours programmés apparaîtront ici.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/courses')}
          >
            Ajouter un cours
          </Button>
        </div>
      )}
    </AnimatedCard>
  );
}
