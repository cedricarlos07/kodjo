import { ElementType } from "react";
import { 
  Users, Book, Video, MessageSquare, 
  Trophy, Clock, Calendar, Bell, 
  Check, Activity 
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const icons: Record<string, ElementType> = {
    Users,
    Book,
    Video,
    MessageSquare,
    Trophy,
    Clock,
    Calendar,
    Bell,
    Check,
    Activity
  };

  const IconComponent = icons[icon] || Users;
  
  const colorClasses: Record<string, { bg: string, text: string }> = {
    primary: {
      bg: "bg-primary-100",
      text: "text-primary-600",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600",
    },
    gray: {
      bg: "bg-gray-100",
      text: "text-gray-600",
    },
  };

  const { bg, text } = colorClasses[color] || colorClasses.primary;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${bg} rounded-md p-3`}>
            <IconComponent className={`text-xl ${text}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
