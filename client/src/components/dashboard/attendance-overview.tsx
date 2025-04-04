import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

interface AttendanceData {
  courseId: number;
  courseName: string;
  courseInstructor: string;
  date: string;
  attendanceRecords: Array<any>;
  totalStudents: number;
  presentStudents: number;
  averageDuration: number;
  totalPoints: number;
}

export function AttendanceOverview() {
  const { isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();

  const { data: attendanceData, isLoading } = useQuery<AttendanceData[]>({
    queryKey: ["/api/attendance/recent", { days: 1 }],
    enabled: isAuthenticated,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return format(date, "h:mm a");
  };

  const getAttendancePercentage = (present: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  return (
    <>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Attendance</h3>
        <p className="mt-1 text-sm text-gray-500">Last 24 hours</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Awarded</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32 mt-1" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2 w-full mt-2" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-16" />
                  </td>
                </tr>
              ))
            ) : attendanceData && attendanceData.length > 0 ? (
              attendanceData.map((attendance) => (
                <tr key={attendance.courseId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{attendance.courseName}</div>
                    <div className="text-xs text-gray-500">{attendance.courseInstructor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(attendance.date)}</div>
                    <div className="text-sm text-gray-500">{formatTime(attendance.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {attendance.presentStudents}/{attendance.totalStudents} students
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${getAttendancePercentage(attendance.presentStudents, attendance.totalStudents)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{attendance.averageDuration} minutes</div>
                    <div className="text-xs text-gray-500">
                      {attendance.averageDuration ? `${Math.round((attendance.averageDuration / 90) * 100)}% of class time` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{attendance.totalPoints}</span>
                      <span className="ml-1 text-xs text-gray-500">pts</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No recent attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Button onClick={() => navigate("/students")}>
          <CalendarDays className="h-4 w-4 mr-2" />
          View All Reports
        </Button>
      </div>
    </>
  );
}
