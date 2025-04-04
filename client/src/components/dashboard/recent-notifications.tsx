import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Send } from "lucide-react";

interface TelegramMessage {
  id: number;
  userId: number;
  courseId: number;
  content: string;
  sentAt: string;
  pointsAwarded: number;
  courseName: string;
  courseGroup: string;
  userName: string;
}

export function RecentNotifications() {
  const { isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();

  const { data: messages, isLoading } = useQuery<TelegramMessage[]>({
    queryKey: ["/api/notifications/recent", { count: 3 }],
    enabled: isAuthenticated,
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  return (
    <>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">Telegram messages sent</p>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
        <ul className="divide-y divide-gray-200">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="px-4 py-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-11/12 mt-1" />
                <div className="mt-2 flex items-center">
                  <Skeleton className="h-3 w-32" />
                </div>
              </li>
            ))
          ) : messages && messages.length > 0 ? (
            messages.map((message) => (
              <li key={message.id} className="px-4 py-3">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {message.courseGroup || message.courseName}
                  </p>
                  <p className="text-xs text-gray-500">{formatTime(message.sentAt)}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">{message.content}</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <svg className="mr-1 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                    <path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z" />
                  </svg>
                  <span>{message.courseGroup} ({message.userName})</span>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-center text-gray-500">
              No recent notifications found.
            </li>
          )}
        </ul>
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Button onClick={() => navigate("/notifications")}>
          <Send className="h-4 w-4 mr-2" />
          Schedule New
        </Button>
      </div>
    </>
  );
}
