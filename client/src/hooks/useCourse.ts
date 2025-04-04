import { useQuery } from '@tanstack/react-query';

interface Course {
  id: number;
  title: string;
  description: string;
  date: string;
  duration: number;
}

export function useCourse(courseId: number) {
  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      return response.json();
    }
  });

  return {
    course,
    isLoading,
    error
  };
} 