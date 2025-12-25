// src/components/ui/PowerWheelChart.tsx

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { normalizeBidi } from "@/lib/bidi";

type SegmentStatus = "pending" | "partial" | "completed";

const STATUS_COLORS: Record<SegmentStatus, string> = {
  pending: "#94a3b8",
  partial: "#facc15",
  completed: "#22c55e",
};

export interface PowerWheelDatum {
  label: string;
  value: number;
  status: SegmentStatus;
  completedCount: number;
  totalAssignments: number;
}

interface PowerWheelChartProps {
  data: PowerWheelDatum[];
  title?: string;
}

const PowerWheelTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0]?.payload as PowerWheelDatum;
  if (!entry) return null;

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-lg rtl" dir="rtl">
      <p className="text-sm font-semibold">{normalizeBidi(entry.label)}</p>
      <p className="mt-1 text-[11px] text-slate-300">
        {normalizeBidi(`امتیاز: ${entry.value.toFixed(1)} از ۱۰۰`)}
      </p>
      <p className="text-[11px] text-slate-300">
        وضعیت:{" "}
        {entry.status === "completed"
          ? "تکمیل‌شده"
          : entry.status === "partial"
            ? "در حال انجام"
            : "در انتظار شروع"}
      </p>
      <p className="text-[11px] text-slate-400">
        {normalizeBidi(`مدیریت شده: ${entry.completedCount}/${entry.totalAssignments || 0}`)}
      </p>
    </div>
  );
};

export const PowerWheelChart = ({ data }: PowerWheelChartProps) => {
  const average = React.useMemo(() => {
    if (!data.length) return 0;
    const total = data.reduce((acc, entry) => acc + entry.value, 0);
    return total / data.length;
  }, [data]);

  return (
    <ChartContainer
      config={{}}
      className="relative flex h-full w-full max-h-[400px] min-h-[320px] flex-col justify-center rounded-3xl bg-slate-900/40 p-6 text-white"
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="55%"
          outerRadius="80%"
          strokeWidth={2}
          paddingAngle={3}
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, index) => (
            <Cell key={`${entry.label}-${index}`} fill={STATUS_COLORS[entry.status]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<PowerWheelTooltip />} />
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-xs uppercase tracking-widest text-slate-300">Power Wheel</p>
        <p className="text-4xl font-black text-white">{normalizeBidi(average.toFixed(0))}</p>
        <p className="text-[11px] text-slate-400">{normalizeBidi("میانگین امتیاز دسته‌بندی‌ها")}</p>
      </div>
    </ChartContainer>
  );
};
