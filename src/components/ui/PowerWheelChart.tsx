// src/components/ui/PowerWheelChart.tsx

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { TooltipPayload } from 'recharts/types/component/Tooltip';

interface PowerWheelDatum {
  subject: string;
  score: number;
  fullMark: number;
}

interface PowerWheelChartProps {
  data: PowerWheelDatum[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#6366f1', '#facc15', '#ec4899'];

export function PowerWheelChart({ data }: PowerWheelChartProps) {
  if (data.length === 0) {
    return null;
  }

  const series = data.map((item, index) => ({
    key: `factor_${index}`,
    label: item.subject,
    color: COLORS[index % COLORS.length],
    fullMark: item.fullMark ?? 0,
  }));

  const chartData = data.map((item, itemIndex) => {
    const baseEntry: Record<string, number | string> = {
      dimension: item.subject,
    };

    series.forEach((serie, serieIndex) => {
      baseEntry[serie.key] = serieIndex === itemIndex ? item.score : 0;
    });

    return baseEntry;
  });

  const maxWheelScore = data.length > 0
    ? Math.max(...data.map((item) => item.fullMark || 0)) || 100
    : 100;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={chartData} outerRadius="70%">
        <PolarGrid strokeDasharray="3 6" stroke="rgba(148, 163, 184, 0.4)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#475569', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, maxWheelScore]}
          stroke="#cbd5f5"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
        />
        {series.map((serie) => (
          <Radar
            key={serie.key}
            name={serie.label}
            dataKey={serie.key}
            stroke={serie.color}
            fill={serie.color}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        ))}
        <Tooltip
          formatter={(value: number, _name: string, entry: TooltipPayload<number, string>) => {
            if (typeof value !== 'number' || value <= 0) return null;

            const dataKey = typeof entry.dataKey === 'string' ? entry.dataKey : undefined;
            const dimension =
              entry.payload && typeof (entry.payload as Record<string, unknown>).dimension === 'string'
                ? ((entry.payload as Record<string, unknown>).dimension as string)
                : undefined;
            const matchedSeries = dataKey ? series.find((serie) => serie.key === dataKey) : undefined;
            const factor = dimension ? data.find((item) => item.subject === dimension) : undefined;
            const label = matchedSeries?.label || dimension || '';

            return [`${value} از ${factor?.fullMark ?? 100}`, label];
          }}
          labelFormatter={(label: string) => `مهارت: ${label}`}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: 20, fontSize: 12, color: '#475569' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
