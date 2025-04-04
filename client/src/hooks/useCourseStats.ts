import { useQuery } from '@tanstack/react-query';

interface CourseStats {
  attendance: number;
  notifications: number;
  students: number;
}

const fetchCourseStats = async (courseId: number): Promise<CourseStats> => {
  const response = await fetch(`/api/courses/${courseId}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch course stats');
  }
  return response.json();
};

export const useCourseStats = (courseId: number) => {
  return useQuery({
    queryKey: ['courseStats', courseId],
    queryFn: () => fetchCourseStats(courseId),
    enabled: !!courseId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}; 