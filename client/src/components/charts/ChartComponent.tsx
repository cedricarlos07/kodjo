import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

// Couleurs pour les graphiques
const COLORS = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#f97316', // Orange
];

interface ChartComponentProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  dataKey: string;
  nameKey?: string;
  height?: number;
  width?: number;
  colors?: string[];
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  secondaryDataKey?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: string) => string;
  pieInnerRadius?: number;
  pieOuterRadius?: number;
  barSize?: number;
  stacked?: boolean;
  lines?: { dataKey: string; color: string; name?: string }[];
  bars?: { dataKey: string; color: string; name?: string }[];
  areas?: { dataKey: string; color: string; name?: string }[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  type,
  data,
  dataKey,
  nameKey = 'name',
  height = 300,
  width = '100%',
  colors = COLORS,
  xAxisDataKey,
  yAxisDataKey,
  secondaryDataKey,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  valueFormatter = (value) => `${value}`,
  labelFormatter = (value) => value,
  pieInnerRadius = 60,
  pieOuterRadius = 80,
  barSize = 20,
  stacked = false,
  lines = [],
  bars = [],
  areas = []
}) => {
  // Si aucune donnée n'est fournie, afficher un message
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/30 rounded-md"
        style={{ height: `${height}px`, width }}
      >
        <span className="text-muted-foreground">Aucune donnée disponible</span>
      </div>
    );
  }

  // Formatter pour les tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{labelFormatter(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {valueFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Rendu du graphique en fonction du type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey={xAxisDataKey || nameKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={labelFormatter}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={valueFormatter}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {lines.length > 0 ? (
              lines.map((line, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.color || colors[index % colors.length]}
                  name={line.name || line.dataKey}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {secondaryDataKey && (
              <Line
                type="monotone"
                dataKey={secondaryDataKey}
                stroke={colors[1]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey={xAxisDataKey || nameKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={labelFormatter}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={valueFormatter}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {bars.length > 0 ? (
              bars.map((bar, index) => (
                <Bar
                  key={index}
                  dataKey={bar.dataKey}
                  fill={bar.color || colors[index % colors.length]}
                  name={bar.name || bar.dataKey}
                  barSize={barSize}
                  stackId={stacked ? "stack" : undefined}
                />
              ))
            ) : (
              <Bar
                dataKey={dataKey}
                fill={colors[0]}
                barSize={barSize}
                stackId={stacked ? "stack" : undefined}
              />
            )}
            {secondaryDataKey && (
              <Bar
                dataKey={secondaryDataKey}
                fill={colors[1]}
                barSize={barSize}
                stackId={stacked ? "stack" : undefined}
              />
            )}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={pieOuterRadius}
              innerRadius={pieInnerRadius}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey={xAxisDataKey || nameKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={labelFormatter}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={valueFormatter}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {areas.length > 0 ? (
              areas.map((area, index) => (
                <Area
                  key={index}
                  type="monotone"
                  dataKey={area.dataKey}
                  fill={area.color || colors[index % colors.length]}
                  stroke={area.color || colors[index % colors.length]}
                  name={area.name || area.dataKey}
                  fillOpacity={0.3}
                  stackId={stacked ? "stack" : undefined}
                />
              ))
            ) : (
              <Area
                type="monotone"
                dataKey={dataKey}
                fill={colors[0]}
                stroke={colors[0]}
                fillOpacity={0.3}
                stackId={stacked ? "stack" : undefined}
              />
            )}
            {secondaryDataKey && (
              <Area
                type="monotone"
                dataKey={secondaryDataKey}
                fill={colors[1]}
                stroke={colors[1]}
                fillOpacity={0.3}
                stackId={stacked ? "stack" : undefined}
              />
            )}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default ChartComponent;
