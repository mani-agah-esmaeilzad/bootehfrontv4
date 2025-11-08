// src/components/ui/AxisDonutChart.tsx

import * as React from "react";

const LETTER_COLORS: Record<string, string> = {
  E: "#7C3AED",
  I: "#F97316",
  S: "#10B981",
  N: "#0EA5E9",
  T: "#A855F7",
  F: "#EC4899",
  J: "#FACC15",
  P: "#22D3EE",
};

interface AxisDonutChartProps {
  axis: any;
  size?: number;
}

const rtlFont = "Vazirmatn, Tahoma, sans-serif";

export const AxisDonutChart = ({ axis, size = 180 }: AxisDonutChartProps) => {
  if (!axis?.primary || !axis?.secondary) return null;

  const primaryValue = Number(
    axis.primary.score?.toFixed?.(2) ?? axis.primary.score ?? 0
  );
  const secondaryValue = Number(
    axis.secondary.score?.toFixed?.(2) ?? axis.secondary.score ?? 0
  );

  const outerStroke = Math.max(size * 0.08, 12);
  const innerStroke = outerStroke * 0.75;
  const outerRadius = size / 2 - outerStroke;
  const innerRadius = outerRadius - outerStroke - 10;

  const circumferenceOuter = 2 * Math.PI * outerRadius;
  const circumferenceInner = 2 * Math.PI * innerRadius;

  const dashOuter = `${(primaryValue / 100) * circumferenceOuter} ${
    circumferenceOuter
  }`;
  const dashInner = `${(secondaryValue / 100) * circumferenceInner} ${
    circumferenceInner
  }`;

  const primaryColor = LETTER_COLORS[axis.primary.letter] || "#64748B";
  const secondaryColor = LETTER_COLORS[axis.secondary.letter] || "#CBD5F5";

  return (
    <div
      className="relative rounded-[34px] border border-white/10 bg-gradient-to-br from-[#040816] via-[#050b1e] to-[#0b1326] p-6 shadow-[0_28px_70px_rgba(4,7,17,0.85)]"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="text-white"
      >
        <defs>
          <linearGradient
            id={`track-${axis.dimension}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke={`url(#track-${axis.dimension})`}
          strokeWidth={outerStroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={innerStroke}
          fill="none"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke={primaryColor}
          strokeWidth={outerStroke}
          strokeLinecap="round"
          strokeDasharray={dashOuter}
          strokeDashoffset={circumferenceOuter * 0.25}
          fill="none"
          opacity={0.9}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke={secondaryColor}
          strokeWidth={innerStroke}
          strokeLinecap="round"
          strokeDasharray={dashInner}
          strokeDashoffset={circumferenceInner * 0.25}
          fill="none"
          opacity={0.85}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          {axis.dimension}
        </p>
        <p
          className="text-2xl font-bold text-white"
          style={{ fontFamily: rtlFont }}
        >
          {axis.primary.letter}/{axis.secondary.letter}
        </p>
        <p className="text-xs text-slate-400">
          {axis.primary.score}% / {axis.secondary.score}%
        </p>
        <p className="text-[11px] text-slate-500">
          اختلاف {axis.delta?.toFixed?.(1) ?? axis.delta}
        </p>
      </div>
    </div>
  );
};
