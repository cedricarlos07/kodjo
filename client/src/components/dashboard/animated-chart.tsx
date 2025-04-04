import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface AnimatedChartProps {
  title: string;
  subtitle?: string;
  data: ChartData[];
  type?: 'area' | 'bar' | 'line';
  colors?: {
    primary: string;
    secondary?: string;
    gradient?: {
      from: string;
      to: string;
    };
  };
  height?: number;
  className?: string;
}

export function AnimatedChart({
  title,
  subtitle,
  data,
  type = 'area',
  colors = {
    primary: '#4f46e5',
    secondary: '#818cf8',
    gradient: {
      from: 'rgba(79, 70, 229, 0.6)',
      to: 'rgba(79, 70, 229, 0.1)'
    }
  },
  height = 240,
  className
}: AnimatedChartProps) {
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    setIsInView(true);
  }, []);

  // Generate a unique ID for the gradient
  const gradientId = `chart-gradient-${Math.floor(Math.random() * 1000)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        'rounded-xl bg-white p-6 shadow-md',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      <div style={{ height: `${height}px` }} className="mt-4">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.gradient?.from} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors.gradient?.to} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toString()}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: 'none',
                  padding: '0.75rem'
                }}
                itemStyle={{ color: '#111827' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={colors.primary} 
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`} 
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toString()}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: 'none',
                  padding: '0.75rem'
                }}
                itemStyle={{ color: '#111827' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}
              />
              <Bar 
                dataKey="value" 
                fill={`url(#${gradientId})`} 
                radius={[4, 4, 0, 0]}
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toString()}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: 'none',
                  padding: '0.75rem'
                }}
                itemStyle={{ color: '#111827' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors.primary} 
                strokeWidth={2}
                dot={{ 
                  stroke: colors.primary, 
                  strokeWidth: 2, 
                  r: 4, 
                  fill: '#ffffff' 
                }}
                activeDot={{ 
                  stroke: colors.primary, 
                  strokeWidth: 2, 
                  r: 6, 
                  fill: '#ffffff' 
                }}
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
              {colors.secondary && (
                <Line 
                  type="monotone" 
                  dataKey="secondaryValue" 
                  stroke={colors.secondary} 
                  strokeWidth={2}
                  dot={{ 
                    stroke: colors.secondary, 
                    strokeWidth: 2, 
                    r: 4, 
                    fill: '#ffffff' 
                  }}
                  activeDot={{ 
                    stroke: colors.secondary, 
                    strokeWidth: 2, 
                    r: 6, 
                    fill: '#ffffff' 
                  }}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
