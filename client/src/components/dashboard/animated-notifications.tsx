import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from './animated-card';
import { Bell, MessageSquare, User, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export function AnimatedNotifications() {
  const [showAll, setShowAll] = useState(false);
  
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/recent'],
  });
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'calendar':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-600';
      case 'user':
        return 'bg-purple-100 text-purple-600';
      case 'calendar':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: fr
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const displayNotifications = showAll 
    ? notifications 
    : notifications?.slice(0, 5);

  return (
    <AnimatedCard 
      title="Notifications récentes" 
      icon="Bell"
      iconColor="yellow"
      headerAction={
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Voir moins' : 'Voir tout'}
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : notifications && notifications.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {displayNotifications?.map((notification) => (
            <motion.div
              key={notification.id}
              variants={item}
              className={`group relative rounded-lg border p-4 transition-all ${
                notification.read 
                  ? 'border-gray-100 bg-white' 
                  : 'border-amber-100 bg-amber-50'
              }`}
            >
              <div className="flex gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  getNotificationColor(notification.type)
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                </div>
              </div>
              
              {!notification.read && (
                <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune notification</h3>
          <p className="mt-1 text-sm text-gray-500">Vous n'avez pas de notifications récentes.</p>
        </div>
      )}
    </AnimatedCard>
  );
}
