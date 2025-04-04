import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCourseStats } from '../../hooks/useCourseStats';

interface Course {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  instructor: string;
}

const fetchCourses = async (): Promise<Course[]> => {
  const response = await fetch('/api/courses');
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  return response.json();
};

export const CourseList: React.FC = () => {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses
  });

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses?.map((course) => {
        const { data: stats } = useCourseStats(course.id);
        
        return (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{course.name}</span>
                <Badge variant="secondary">
                  {stats?.students || 0} étudiants
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{course.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Présence</span>
                  <span>{stats?.attendance || 0}%</span>
                </div>
                <Progress value={stats?.attendance || 0} />
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Début: {format(new Date(course.startDate), 'PPP', { locale: fr })}
                </p>
                <p className="text-sm text-gray-500">
                  Fin: {format(new Date(course.endDate), 'PPP', { locale: fr })}
                </p>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {stats?.notifications || 0} notifications
                </span>
                <Button variant="outline">Voir détails</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 