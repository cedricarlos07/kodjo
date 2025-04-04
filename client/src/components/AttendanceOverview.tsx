import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AttendanceOverview() {
  const { data: attendanceData, isLoading, error } = useQuery({
    queryKey: ["/api/attendance?hours=24"],
  });
  
  // In a real app, we would process raw attendance data to create meaningful statistics
  // For now, we'll just display it directly
  
  return (
    <div className="xl:col-span-2 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Attendance</h3>
        <p className="mt-1 text-sm text-gray-500">Last 24 hours</p>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-4 text-center">Loading attendance data...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Failed to load attendance data</div>
        ) : !attendanceData || attendanceData.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No recent attendance data</div>
        ) : (
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
              {/* For demo purposes, we'll show sample data - In a real app, this would be dynamic */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Web Development</div>
                  <div className="text-xs text-gray-500">Prof. Johnson</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Today</div>
                  <div className="text-sm text-gray-500">10:00 AM - 11:30 AM</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">21/24 students</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "87%" }}></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">82 minutes</div>
                  <div className="text-xs text-gray-500">91% of class time</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">210</span>
                    <span className="ml-1 text-xs text-gray-500">pts</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Python Programming</div>
                  <div className="text-xs text-gray-500">Dr. Williams</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Yesterday</div>
                  <div className="text-sm text-gray-500">3:00 PM - 4:30 PM</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">18/20 students</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "90%" }}></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">85 minutes</div>
                  <div className="text-xs text-gray-500">94% of class time</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">180</span>
                    <span className="ml-1 text-xs text-gray-500">pts</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Link href="/courses/attendance">
          <Button className="bg-primary-600 hover:bg-primary-700">
            View All Reports
          </Button>
        </Link>
      </div>
    </div>
  );
}
