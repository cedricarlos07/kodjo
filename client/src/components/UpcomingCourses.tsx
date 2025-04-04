import { useQuery } from "@tanstack/react-query";
import { CourseItem } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UpcomingCourses() {
  const { toast } = useToast();
  
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["/api/courses/upcoming"],
  });
  
  const handleStartZoomSession = (course: CourseItem) => {
    // In a real app, this would integrate with Zoom API
    toast({
      title: "Starting Zoom session",
      description: `Launching Zoom session for ${course.name}`,
    });
    window.open(course.zoomLink, "_blank");
  };
  
  const handleEditCourse = (course: CourseItem) => {
    toast({
      title: "Edit Course",
      description: `Editing ${course.name}`,
    });
    // This would open course edit modal in a real app
  };
  
  return (
    <div className="xl:col-span-2 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Courses</h3>
        <p className="mt-1 text-sm text-gray-500">Next 24 hours</p>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-4 text-center">Loading upcoming courses...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Failed to load upcoming courses</div>
        ) : courses?.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No upcoming courses in the next 24 hours</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses?.map((course: CourseItem) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-primary-100 text-primary-600">
                        <BookIcon />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.instructor}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatTime(course.startTime)} - {formatTime(course.endTime)}</div>
                    <div className="text-sm text-gray-500">{course.dayOfWeek}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Ready
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-600 hover:text-primary-900 mr-3"
                      onClick={() => handleStartZoomSession(course)}
                    >
                      <Video className="mr-1 h-4 w-4" /> Start
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Button className="bg-primary-600 hover:bg-primary-700">
          View All Courses
        </Button>
      </div>
    </div>
  );
}

// Helper components
function BookIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

// Helper functions
function formatTime(time: string) {
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert 0 to 12
    return `${formattedHour}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
}
