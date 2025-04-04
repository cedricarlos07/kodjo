import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconMap } from '@/lib/minimal-icons';

interface AnimatedStatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
}

export function AnimatedStatsCard({
  title,
  value,
  icon,
  color,
  prefix = '',
  suffix = '',
  trend,
  trendLabel
}: AnimatedStatsCardProps) {
  const [isInView, setIsInView] = useState(false);
  const Icon = iconMap[icon] as LucideIcon;

  const colorVariants = {
    primary: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 shadow-indigo-200',
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-emerald-200',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 shadow-blue-200',
    yellow: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 shadow-amber-200',
    red: 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 shadow-rose-200',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 shadow-purple-200',
  };

  const iconColorVariants = {
    primary: 'bg-indigo-500 text-white',
    green: 'bg-emerald-500 text-white',
    blue: 'bg-blue-500 text-white',
    yellow: 'bg-amber-500 text-white',
    red: 'bg-rose-500 text-white',
    purple: 'bg-purple-500 text-white',
  };

  const trendColorVariants = {
    positive: 'text-emerald-600',
    negative: 'text-rose-600',
    neutral: 'text-gray-600',
  };

  useEffect(() => {
    setIsInView(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={cn(
        'relative overflow-hidden rounded-xl p-6 shadow-lg',
        colorVariants[color as keyof typeof colorVariants]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium opacity-80">{title}</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-bold tracking-tight">
              {prefix}
              <CountUp
                end={value}
                duration={2.5}
                separator=" "
                decimal=","
                decimals={0}
              />
              {suffix}
            </p>

            {trend !== undefined && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className={cn(
                  "ml-2 text-xs font-medium",
                  trend > 0
                    ? trendColorVariants.positive
                    : trend < 0
                      ? trendColorVariants.negative
                      : trendColorVariants.neutral
                )}
              >
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
                {trendLabel && <span className="ml-1 opacity-70">{trendLabel}</span>}
              </motion.p>
            )}
          </div>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            iconColorVariants[color as keyof typeof iconColorVariants]
          )}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -top-2 -left-2 h-16 w-16 rounded-full bg-white/10 blur-xl" />
    </motion.div>
  );
}
