
import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface PerformanceChartProps {
  monthlyData: Array<{
    month: string;
    winRate: number;
  }>;
}

const PerformanceChart = ({ monthlyData }: PerformanceChartProps) => {
  return (
    <div className="h-[300px] mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyData}>
          <XAxis 
            dataKey="month" 
            stroke="#10B981"
            tick={{ fill: '#10B981', fontSize: 12 }}
          />
          <YAxis 
            stroke="#10B981"
            tick={{ fill: '#10B981', fontSize: 12 }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '8px'
            }}
          />
          <Bar
            dataKey="winRate"
            fill="#10B981"
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-center text-emerald-400 font-mono">
        Monthly Win Rate Analysis
      </div>
    </div>
  );
};

export default PerformanceChart;
