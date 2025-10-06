// src/components/ui/SpiderChart.tsx

import * as React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

// --- Type Definitions ---
interface ChartData {
  subject: string;
  score: number;
  fullMark: number;
}

interface SpiderChartProps {
  data: ChartData[];
}

// Tooltip سفارشی برای نمایش زیباتر
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm shadow-lg border border-gray-700 font-sans">
        <p className="font-bold">{payload[0].payload.subject}</p>
        <p style={{ color: payload[0].color }}>
          امتیاز: {payload[0].value} از {payload[0].payload.fullMark}
        </p>
      </div>
    );
  }
  return null;
};

// *** FIX: The component now accepts a 'data' prop to be dynamic ***
export function SpiderChart({ data }: SpiderChartProps) {
  const chartColor = '#3b82f6'; // رنگ آبی برای نمودار
  
  // پیدا کردن بیشترین امتیاز برای تنظیم دامنه نمودار
  const maxScore = Math.max(...data.map(item => item.fullMark), 5);
  const domain: [number, number] = [0, maxScore];

  return (
    <ChartContainer
      config={{
        score: { label: 'امتیاز', color: chartColor },
      }}
      className="mx-auto aspect-square w-full h-full max-h-[420px] rounded-2xl shadow-lg bg-[#0b0f19] p-4"
    >
      <ResponsiveContainer>
        <RadarChart data={data}>
          {/* حلقه‌های شعاعی */}
          <PolarGrid
            gridType="polygon"
            stroke="#555"
            strokeDasharray="3 3"
            radialLines={true}
          />

          {/* لیبل‌های فاکتورها */}
          <PolarAngleAxis
            dataKey="subject" //  استفاده از 'subject' به جای 'factor'
            tick={{ fill: '#fff', fontSize: 13, fontWeight: 600 }}
          />

          {/* محور امتیازات */}
          <PolarRadiusAxis
            angle={90}
            domain={domain}
            tick={{ fill: '#888', fontSize: 12 }}
            stroke="#666"
            axisLine={false}
          />

          {/* گرادیان برای پر کردن داخل نمودار */}
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.6} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0.2} />
            </linearGradient>
          </defs>

          {/* نمودار اصلی */}
          <Radar
            name="امتیاز شما"
            dataKey="score" //  استفاده از 'score'
            stroke={chartColor}
            strokeWidth={2.5}
            fill="url(#radarGradient)"
            fillOpacity={0.6}
            dot={{ r: 4, fill: chartColor, stroke: '#fff', strokeWidth: 1.5 }}
            activeDot={{ r: 6 }}
          />

          {/* Tooltip و Legend */}
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              paddingTop: '20px',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
