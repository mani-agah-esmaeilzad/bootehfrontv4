// src/components/ui/SpiderChart.tsx

import * as React from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const spiderChartFontFamily = "Vazirmatn, Tahoma, sans-serif";
const COLORS = [
  "#3b82f6",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#22c55e",
  "#ec4899",
  "#eab308",
  "#14b8a6",
];

// --- Type Definitions ---
interface ChartData {
  subject: string;
  score: number;
  fullMark: number;
}

interface SpiderChartProps {
  data: ChartData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="rounded-md border border-white/20 bg-slate-900/95 px-3 py-2 text-sm font-sans text-white shadow-lg">
        <p className="font-bold">{item.subject}</p>
        <p style={{ color: payload[0].color }}>
          امتیاز: {item.score} از {item.fullMark} ({Math.round((item.score / item.fullMark) * 100)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function SpiderChart({ data }: SpiderChartProps) {
  if (!data?.length) return null;

  const processed = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
    percent: Math.round((item.score / item.fullMark) * 100),
  }));

  const maxScore = Math.max(...processed.map((item) => item.fullMark), 1);

  return (
    <ChartContainer
      config={{
        score: { label: "Power Wheel", color: "#fff" },
      }}
      className="mx-auto h-full w-full max-h-[420px] rounded-[32px] bg-[#050714] p-6 shadow-[0_40px_100px_rgba(8,15,40,0.7)]"
    >
      <ResponsiveContainer>
        <RadialBarChart
          innerRadius="25%"
          outerRadius="95%"
          data={processed}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, maxScore]}
            tick={false}
            axisLine={false}
          />
          <RadialBar
            background
            clockWise
            dataKey="score"
            nameKey="subject"
            cornerRadius={12}
            minAngle={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            verticalAlign="bottom"
            formatter={(value: string, entry: any) => {
              const item = entry?.payload as typeof processed[number];
              return `${value} – ${item.percent}%`;
            }}
            wrapperStyle={{
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
              paddingTop: 20,
              fontFamily: spiderChartFontFamily,
            }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
