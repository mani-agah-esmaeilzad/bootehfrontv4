// src/components/ui/AxisDonutChart.tsx

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Label } from "recharts";

const LETTER_COLORS: Record<string, { base: string; accent: string }> = {
  E: { base: "#4F46E5", accent: "rgba(79,70,229,0.35)" },
  I: { base: "#F97316", accent: "rgba(249,115,22,0.35)" },
  S: { base: "#10B981", accent: "rgba(16,185,129,0.35)" },
  N: { base: "#0EA5E9", accent: "rgba(14,165,233,0.35)" },
  T: { base: "#A855F7", accent: "rgba(168,85,247,0.35)" },
  F: { base: "#EC4899", accent: "rgba(236,72,153,0.35)" },
  J: { base: "#FACC15", accent: "rgba(250,204,21,0.35)" },
  P: { base: "#22D3EE", accent: "rgba(34,211,238,0.35)" },
};

const rtlFont = "Vazirmatn, Tahoma, sans-serif";

interface AxisDonutChartProps {
  axis: any;
  size?: number;
}

const tooltipStyle: React.CSSProperties = {
  direction: "rtl",
  textAlign: "right",
  background: "linear-gradient(145deg, rgba(15,23,42,0.92), rgba(15,23,42,0.78))",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  borderRadius: "14px",
  padding: "10px 16px",
  fontSize: 12,
  color: "#fff",
  boxShadow: "0 14px 35px rgba(3,7,18,0.65)",
};

export const AxisDonutChart = ({ axis, size = 170 }: AxisDonutChartProps) => {
  if (!axis?.primary || !axis?.secondary) return null;

  const primaryColor = LETTER_COLORS[axis.primary.letter] || LETTER_COLORS.E;
  const secondaryColor = LETTER_COLORS[axis.secondary.letter] || LETTER_COLORS.I;

  const data = [
    {
      name: axis.primary.letter,
      value: Number(axis.primary.score?.toFixed?.(2) ?? axis.primary.score ?? 0),
      fill: primaryColor.base,
    },
    {
      name: axis.secondary.letter,
      value: Number(axis.secondary.score?.toFixed?.(2) ?? axis.secondary.score ?? 0),
      fill: secondaryColor.base,
    },
  ];

  return (
    <div
      className="relative rounded-[28px] border border-white/10 bg-gradient-to-br from-[#050715] via-[#050b1c] to-[#0a1227] p-4 shadow-[0_30px_70px_rgba(3,6,16,0.9)]"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-6 rounded-full bg-white/5 blur-3xl" />
      <ResponsiveContainer>
        <PieChart>
          <defs>
            {data.map((entry) => (
              <radialGradient
                key={`${axis.dimension}-${entry.name}`}
                id={`axisGradient-${axis.dimension}-${entry.name}`}
                cx="0.5"
                cy="0.5"
                r="0.8"
              >
                <stop offset="0%" stopColor={entry.fill} stopOpacity={0.95} />
                <stop offset="100%" stopColor={entry.fill} stopOpacity={0.4} />
              </radialGradient>
            ))}
          </defs>
          <Pie
            data={[{ value: 100 }]}
            dataKey="value"
            startAngle={90}
            endAngle={450}
            innerRadius="60%"
            outerRadius="87%"
            stroke="none"
            fill="rgba(255,255,255,0.06)"
            isAnimationActive={false}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            startAngle={90}
            endAngle={450}
            innerRadius="60%"
            outerRadius="87%"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1.4}
            cornerRadius={20}
            animationDuration={1200}
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={`url(#axisGradient-${axis.dimension}-${entry.name})`}
              />
            ))}
          </Pie>
          <Label
            position="center"
            content={() => (
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  {axis.dimension}
                </p>
                <p className="text-lg font-bold text-white" style={{ fontFamily: rtlFont }}>
                  {axis.primary.letter}/{axis.secondary.letter}
                </p>
                <p className="text-[11px] text-slate-400">
                  اختلاف {axis.delta?.toFixed?.(1) ?? axis.delta}
                </p>
              </div>
            )}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, label: string) => [`${value}%`, `ترجیح ${label}`]}
            labelFormatter={() => axis.dimension}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
