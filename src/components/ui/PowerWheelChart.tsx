// src/components/ui/PowerWheelChart.tsx

import * as React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";
import type { WheelCategory, WheelDataRow } from "@/lib/personalityChart";
import { cn } from "@/lib/utils";

interface PowerWheelChartProps {
  categories: WheelCategory[];
  data: WheelDataRow[];
  maxValue?: number;
  height?: number;
  className?: string;
}

const rtlFont = "Vazirmatn, Tahoma, sans-serif";

const tooltipStyle: React.CSSProperties = {
  direction: "rtl",
  textAlign: "right",
  backgroundColor: "rgba(15,23,42,0.95)",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "12px",
  color: "white",
};

export const PowerWheelChart = ({
  categories,
  data,
  maxValue = 100,
  height = 360,
  className,
}: PowerWheelChartProps) => {
  if (!categories.length || !data.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-800/60 bg-slate-900/40 px-6 text-xs text-slate-400">
        داده‌ای برای نمایش نمودار پاور ویل وجود ندارد.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[32px] border border-slate-800/60 bg-gradient-to-br from-[#050814] via-[#070c1c] to-[#0b1124] p-6 shadow-[0_25px_60px_rgba(6,11,25,0.8)]",
        className
      )}
    >
      <div style={{ height }}>
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid strokeDasharray="3 6" stroke="#1d283a" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "#e2e8f0", fontSize: 11, fontFamily: rtlFont }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, maxValue]}
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: rtlFont }}
            />
            {categories.map((category) => (
              <Radar
                key={category.key}
                name={category.label}
                dataKey={category.key}
                stroke={category.color}
                strokeWidth={2}
                fill={category.color}
                fillOpacity={0.2}
              />
            ))}
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, _name: string, item: any) => {
                if (typeof value !== "number" || value === 0 || !item) return null;
                const categoryLabel = categories.find((cat) => cat.key === item.dataKey)?.label;
                return [`${value} از ${maxValue}`, categoryLabel];
              }}
              labelFormatter={(label: string) => `بعد: ${label}`}
            />
            <Legend
              wrapperStyle={{ direction: "rtl", color: "#cbd5f5", fontFamily: rtlFont, fontSize: 12, paddingTop: 16 }}
              iconType="circle"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
