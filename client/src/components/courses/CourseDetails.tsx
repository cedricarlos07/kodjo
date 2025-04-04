import React from 'react';
import { useParams } from 'react-router-dom';
import { useCourse } from '../../hooks/useCourse';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ZoomMeeting } from './ZoomMeeting';

export function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const { course, isLoading, error } = useCourse(Number(courseId));

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error.message}</div>;
  }

  if (!course) {
    return <div>Cours non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{course.description}</p>
        </CardContent>
      </Card>

      <ZoomMeeting courseId={course.id} />
    </div>
  );
} 