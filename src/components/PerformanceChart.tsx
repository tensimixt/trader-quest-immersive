
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
    <div className="h-[300px] mb-4 bg-black/40 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyData}>
          <XAxis 
            dataKey="month" 
            stroke="#10B981"
            tick={{ fill: '#10B981', fontSize: 12 }}
            axisLine={{ stroke: '#10B981', strokeWidth: 1 }}
          />
          <YAxis 
            stroke="#10B981"
            tick={{ fill: '#10B981', fontSize: 12 }}
            domain={[0, 100]}
            axisLine={{ stroke: '#10B981', strokeWidth: 1 }}
            tickLine={{ stroke: '#10B981' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.9)', 
              border: '1px solid #10B981',
              borderRadius: '8px',
              color: '#10B981'
            }}
          />
          <Bar
            dataKey="winRate"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-center text-emerald-400 font-mono mt-2">
        Monthly Win Rate Analysis
      </div>
    </div>
  );
};

export default PerformanceChart;
