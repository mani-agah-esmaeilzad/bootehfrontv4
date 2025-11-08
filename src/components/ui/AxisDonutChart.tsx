// src/components/ui/AxisDonutChart.tsx

import * as React from "react";

const LETTER_COLORS: Record<string, { bar: string; glow: string }> = {
  E: { bar: "from-indigo-400 to-blue-500", glow: "rgba(99,102,241,0.35)" },
  I: { bar: "from-amber-400 to-orange-500", glow: "rgba(249,115,22,0.35)" },
  S: { bar: "from-emerald-400 to-teal-500", glow: "rgba(16,185,129,0.35)" },
  N: { bar: "from-sky-400 to-cyan-500", glow: "rgba(14,165,233,0.35)" },
  T: { bar: "from-fuchsia-400 to-purple-500", glow: "rgba(192,132,252,0.35)" },
  F: { bar: "from-rose-400 to-pink-500", glow: "rgba(244,114,182,0.35)" },
  J: { bar: "from-yellow-300 to-amber-400", glow: "rgba(250,204,21,0.35)" },
  P: { bar: "from-cyan-300 to-teal-400", glow: "rgba(34,211,238,0.35)" },
};

const rtlFont = "Vazirmatn, Tahoma, sans-serif";

interface AxisDonutChartProps {
  axis: any;
}

export const AxisDonutChart = ({ axis }: AxisDonutChartProps) => {
  if (!axis?.primary || !axis?.secondary) return null;

  const primaryValue = Number(
    axis.primary.score?.toFixed?.(2) ?? axis.primary.score ?? 0
  );
  const secondaryValue = Number(
    axis.secondary.score?.toFixed?.(2) ?? axis.secondary.score ?? 0
  );

  const primaryStyles = LETTER_COLORS[axis.primary.letter] || LETTER_COLORS.E;
  const secondaryStyles =
    LETTER_COLORS[axis.secondary.letter] || LETTER_COLORS.I;

  const renderBar = (
    label: string,
    letter: string,
    value: number,
    styles: { bar: string; glow: string }
  ) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-200">
        <span>
          {label} ({letter})
        </span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-white/5 to-white/0" style={{ boxShadow: `0 0 15px ${styles.glow}` }}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
          style={{ width: `${value}%`, boxShadow: `0 2px 12px ${styles.glow}` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent" />
      </div>
    </div>
  );

  return (
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#050816] via-[#040a1c] to-[#0b1428] p-5 text-white shadow-[0_25px_60px_rgba(4,7,18,0.9)]">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
        <span>{axis.dimension}</span>
        <span style={{ fontFamily: rtlFont }}>
          {axis.primary.letter}/{axis.secondary.letter}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {renderBar(axis.primary.label, axis.primary.letter, primaryValue, primaryStyles)}
        {renderBar(axis.secondary.label, axis.secondary.letter, secondaryValue, secondaryStyles)}
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-[11px] text-slate-200">
        تمایل غالب: <span className="font-semibold text-white">{axis.dominantLetter}</span> | اختلاف {axis.delta}
      </div>
    </div>
  );
};
