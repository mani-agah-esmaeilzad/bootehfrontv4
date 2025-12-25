// src/components/ui/SpiderChart.tsx

import * as React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { normalizeBidi } from "@/lib/bidi";

const spiderChartFontFamily = "Vazirmatn, Tahoma, sans-serif";

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
    return (
      <div className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-sans text-white shadow-lg">
        <p className="font-bold rtl">{normalizeBidi(payload[0].payload.subject)}</p>
        <p style={{ color: payload[0].color }}>
          امتیاز: {payload[0].value} از {normalizeBidi(payload[0].payload.fullMark)}
        </p>
      </div>
    );
  }
  return null;
};

export function SpiderChart({ data }: SpiderChartProps) {
  const chartColor = "#3b82f6";
  const maxScore = Math.max(...data.map((item) => item.fullMark), 5);
  const domain: [number, number] = [0, maxScore];

  return (
    <ChartContainer
      config={{
        score: { label: "امتیاز", color: chartColor },
      }}
      className="mx-auto h-full w-full max-h-[420px] rounded-2xl bg-white p-4 shadow-lg"
    >
      <ResponsiveContainer className="chart-ltr">
        <RadarChart data={data}>
          <PolarGrid gridType="polygon" stroke="#94a3b8" strokeDasharray="3 3" radialLines />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#0f172a", fontSize: 13, fontWeight: 600, fontFamily: spiderChartFontFamily }}
            tickFormatter={(value: string) => normalizeBidi(value)}
          />
          <PolarRadiusAxis
            angle={90}
            domain={domain}
            tick={{ fill: "#334155", fontSize: 12, fontFamily: spiderChartFontFamily }}
            stroke="#cbd5f5"
            axisLine={false}
          />
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.6} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <Radar
            name="امتیاز شما"
            dataKey="score"
            stroke={chartColor}
            strokeWidth={2.5}
            fill="url(#radarGradient)"
            fillOpacity={0.6}
            dot={{ r: 4, fill: chartColor, stroke: "#fff", strokeWidth: 1.5 }}
            activeDot={{ r: 6 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              color: "#0f172a",
              fontSize: "14px",
              fontWeight: 600,
              paddingTop: "20px",
              fontFamily: spiderChartFontFamily,
              direction: "rtl",
            }}
            formatter={(value) => normalizeBidi(value)}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
