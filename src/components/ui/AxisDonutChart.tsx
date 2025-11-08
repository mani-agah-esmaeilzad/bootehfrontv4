// src/components/ui/AxisDonutChart.tsx

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const LETTER_COLORS: Record<string, string> = {
  E: "#2563eb",
  I: "#f97316",
  S: "#22c55e",
  N: "#14b8a6",
  T: "#a855f7",
  F: "#ec4899",
  J: "#facc15",
  P: "#0ea5e9",
};

const rtlFont = "Vazirmatn, Tahoma, sans-serif";

interface AxisDonutChartProps {
  axis: any;
  size?: number;
}

const tooltipStyle: React.CSSProperties = {
  direction: "rtl",
  textAlign: "right",
  backgroundColor: "rgba(15,23,42,0.95)",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  borderRadius: "10px",
  padding: "6px 10px",
  fontSize: 12,
  color: "#fff",
};

export const AxisDonutChart = ({ axis, size = 140 }: AxisDonutChartProps) => {
  if (!axis?.primary || !axis?.secondary) return null;

  const data = [
    {
      name: axis.primary.letter,
      value: Number(axis.primary.score?.toFixed?.(2) ?? axis.primary.score ?? 0),
      fill: LETTER_COLORS[axis.primary.letter] || "#38bdf8",
    },
    {
      name: axis.secondary.letter,
      value: Number(axis.secondary.score?.toFixed?.(2) ?? axis.secondary.score ?? 0),
      fill: LETTER_COLORS[axis.secondary.letter] || "#f87171",
    },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            startAngle={90}
            endAngle={450}
            innerRadius="50%"
            outerRadius="80%"
            stroke="rgba(15,23,42,0.2)"
            strokeWidth={1.5}
            cornerRadius={8}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, label: string) => [`${value}٪`, `ترجیح ${label}`]}
            labelFormatter={() => axis.dimension}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-semibold uppercase text-slate-400">{axis.dimension}</p>
        <p className="text-lg font-bold text-white" style={{ fontFamily: rtlFont }}>
          {axis.primary.letter}/{axis.secondary.letter}
        </p>
      </div>
    </div>
  );
};
