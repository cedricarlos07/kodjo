import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { iconMap } from '@/lib/minimal-icons';

interface AnimatedCardProps {
  title: string;
  icon?: string;
  iconColor?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
  headerAction?: ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
}

export function AnimatedCard({
  title,
  icon,
  iconColor = 'primary',
  children,
  className,
  delay = 0.2,
  headerAction,
  variant = 'default'
}: AnimatedCardProps) {
  const Icon = icon ? (iconMap[icon] as LucideIcon) : null;

  const colorVariants = {
    primary: 'text-indigo-600',
    green: 'text-emerald-600',
    blue: 'text-blue-600',
    yellow: 'text-amber-600',
    red: 'text-rose-600',
    purple: 'text-purple-600',
  };

  const cardVariants = {
    default: 'bg-white shadow-md',
    outline: 'bg-white border border-gray-200',
    ghost: 'bg-gray-50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'rounded-xl overflow-hidden',
        cardVariants[variant],
        className
      )}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {Icon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: delay + 0.1
              }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-gray-100',
                colorVariants[iconColor as keyof typeof colorVariants]
              )}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
          )}
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>

        {headerAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 }}
          >
            {headerAction}
          </motion.div>
        )}
      </div>

      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
}
