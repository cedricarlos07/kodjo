import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from './animated-card';
import { AnimatedChart } from './animated-chart';
import { CheckCircle, Users, Calendar, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface AttendanceData {
  overview: {
    total: number;
    attended: number;
    percentage: number;
  };
  chart: {
    name: string;
    value: number;
  }[];
}

export function AnimatedAttendance() {
  const [_, navigate] = useLocation();
  
  const { data, isLoading } = useQuery<AttendanceData>({
    queryKey: ['/api/attendance/overview'],
  });
  
  return (
    <AnimatedCard 
      title="Présence aux cours" 
      icon="CheckCircle"
      iconColor="green"
      headerAction={
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          onClick={() => navigate('/attendance')}
        >
          Voir les détails
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center justify-center rounded-lg bg-emerald-50 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="mt-2 text-center">
                <span className="text-2xl font-bold text-emerald-600">{data.overview.percentage}%</span>
                <p className="text-xs text-emerald-700">Taux de présence</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center justify-center rounded-lg bg-blue-50 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div className="mt-2 text-center">
                <span className="text-2xl font-bold text-blue-600">{data.overview.attended}</span>
                <p className="text-xs text-blue-700">Présences</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center justify-center rounded-lg bg-purple-50 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="mt-2 text-center">
                <span className="text-2xl font-bold text-purple-600">{data.overview.total}</span>
                <p className="text-xs text-purple-700">Total des cours</p>
              </div>
            </motion.div>
          </div>
          
          <AnimatedChart
            title="Tendance de présence"
            subtitle="7 derniers jours"
            data={data.chart}
            type="area"
            colors={{
              primary: '#10b981',
              gradient: {
                from: 'rgba(16, 185, 129, 0.6)',
                to: 'rgba(16, 185, 129, 0.1)'
              }
            }}
            height={180}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune donnée de présence</h3>
          <p className="mt-1 text-sm text-gray-500">Les données de présence apparaîtront ici une fois disponibles.</p>
        </div>
      )}
    </AnimatedCard>
  );
}
