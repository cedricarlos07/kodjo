import { useQuery } from "@tanstack/react-query";
import { NotificationItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BrandTelegram } from "lucide-react";
import { useState } from "react";
import { ScheduleNotificationModal } from "./ScheduleNotificationModal";

export default function RecentNotifications() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ["/api/notifications?count=5"],
  });
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">Telegram messages sent</p>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
        {isLoading ? (
          <div className="p-4 text-center">Loading notifications...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Failed to load notifications</div>
        ) : notifications?.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No recent notifications</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications?.map((notification: NotificationItem) => (
              <li key={notification.id} className="px-4 py-3">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {formatNotificationTitle(notification.messageText)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatNotificationTime(notification.sentTime)}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {truncateMessage(notification.messageText, 100)}
                </p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <BrandTelegram className="text-blue-500 mr-1 h-4 w-4" />
                  <span>Group ID: {truncateId(notification.telegramGroupId)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Button 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={() => setIsModalOpen(true)}
        >
          <span className="mr-2">+</span> Schedule New
        </Button>
      </div>
      
      <ScheduleNotificationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

// Helper functions
function formatNotificationTitle(message: string): string {
  // Extract first 30 chars as title or first line
  const firstLine = message.split('\n')[0];
  return firstLine.length > 30 ? `${firstLine.substring(0, 30)}...` : firstLine;
}

function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // If less than 24 hours, show time
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If today, show "Today"
  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }
  
  // If yesterday, show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // Otherwise show date
  return date.toLocaleDateString();
}

function truncateMessage(message: string, maxLength: number): string {
  return message.length > maxLength 
    ? `${message.substring(0, maxLength)}...` 
    : message;
}

function truncateId(id: string): string {
  return id.length > 10 ? `${id.substring(0, 10)}...` : id;
}
