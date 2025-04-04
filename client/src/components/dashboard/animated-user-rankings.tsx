import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from './animated-card';
import { Trophy, Medal, Award, Star, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserRanking {
  id: number;
  fullName: string;
  avatar: string | null;
  points: number;
  rank: number;
  progress: number;
  attendance: number;
}

export function AnimatedUserRankings() {
  const { data: rankings, isLoading } = useQuery<{
    daily: UserRanking[];
    weekly: UserRanking[];
    monthly: UserRanking[];
  }>({
    queryKey: ['/api/users/rankings'],
  });
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Trophy className="h-3.5 w-3.5" />
          </div>
        );
      case 2:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600">
            <Medal className="h-3.5 w-3.5" />
          </div>
        );
      case 3:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Award className="h-3.5 w-3.5" />
          </div>
        );
      default:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <span className="text-xs font-medium">{rank}</span>
          </div>
        );
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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  return (
    <AnimatedCard 
      title="Top Utilisateurs" 
      icon="Trophy"
      iconColor="yellow"
    >
      <Tabs defaultValue="quotidien" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="quotidien">Quotidien</TabsTrigger>
          <TabsTrigger value="hebdomadaire">Hebdomadaire</TabsTrigger>
          <TabsTrigger value="mensuel">Mensuel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quotidien">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            </div>
          ) : rankings?.daily && rankings.daily.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {rankings.daily.map((user) => (
                <motion.div
                  key={user.id}
                  variants={item}
                  className="group flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 transition-all hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(user.rank)}
                    
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage src={user.avatar || ''} alt={user.fullName} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{user.fullName}</h4>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-medium text-gray-600">{user.points} points</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-900">{user.attendance}%</div>
                      <div className="text-xs text-gray-500">Participation</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Trophy className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun classement d'utilisateurs disponible pour cette période</h3>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="hebdomadaire">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            </div>
          ) : rankings?.weekly && rankings.weekly.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {rankings.weekly.map((user) => (
                <motion.div
                  key={user.id}
                  variants={item}
                  className="group flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 transition-all hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(user.rank)}
                    
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage src={user.avatar || ''} alt={user.fullName} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{user.fullName}</h4>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-medium text-gray-600">{user.points} points</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-900">{user.attendance}%</div>
                      <div className="text-xs text-gray-500">Participation</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Trophy className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun classement d'utilisateurs disponible pour cette période</h3>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="mensuel">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            </div>
          ) : rankings?.monthly && rankings.monthly.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {rankings.monthly.map((user) => (
                <motion.div
                  key={user.id}
                  variants={item}
                  className="group flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 transition-all hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(user.rank)}
                    
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage src={user.avatar || ''} alt={user.fullName} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{user.fullName}</h4>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-medium text-gray-600">{user.points} points</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-900">{user.attendance}%</div>
                      <div className="text-xs text-gray-500">Participation</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Trophy className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun classement d'utilisateurs disponible pour cette période</h3>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AnimatedCard>
  );
}
