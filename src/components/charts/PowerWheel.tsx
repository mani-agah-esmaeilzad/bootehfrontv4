// src/components/charts/PowerWheel.tsx

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_POWER_WHEEL_COLORS,
  PowerWheelAxis,
  PowerWheelGroup,
} from "@/components/charts/powerWheelTypes";
import { normalizeBidi, isRTL } from "@/lib/bidi";

interface TooltipState {
  axis: PowerWheelAxis | null;
  x: number;
  y: number;
  visible: boolean;
}

interface PowerWheelProps {
  data: PowerWheelAxis[];
  maxValue?: number;
  rings?: number;
  size?: number;
  groupColors?: Partial<Record<PowerWheelGroup, string>>;
  showLegend?: boolean;
  showOuterDots?: boolean;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const wrapLabel = (label: string): string[] => {
  const words = label.split(" ");
  if (words.length <= 1) return [label];
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const tentative = current ? `${current} ${word}` : word;
    if (tentative.length > 14 && current) {
      lines.push(current);
      current = word;
    } else {
      current = tentative;
    }
  });
  if (current) lines.push(current);
  if (lines.length > 2) {
    const first = lines.slice(0, lines.length - 1).join(" ");
    const second = lines.slice(-1)[0];
    return [first, second];
  }
  return lines;
};

export const PowerWheel = ({
  data,
  maxValue = 100,
  rings = 5,
  size = 520,
  groupColors,
  showLegend = true,
  showOuterDots = true,
  className,
}: PowerWheelProps) => {
  const mergedColors = { ...DEFAULT_POWER_WHEEL_COLORS, ...(groupColors ?? {}) };
  const [tooltip, setTooltip] = useState<TooltipState>({ axis: null, x: 0, y: 0, visible: false });
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const labelRadius = radius + 34;
  const dotRadius = radius + 10;

  const axes = useMemo(() => {
    const total = data.length;
    return data.map((axis, index) => {
      const angle = (2 * Math.PI * index) / total - Math.PI / 2;
      const valueRadius = (clamp(axis.value, 0, maxValue) / maxValue) * radius;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const labelX = cx + labelRadius * Math.cos(angle);
      const labelY = cy + labelRadius * Math.sin(angle);
      const dotX = cx + dotRadius * Math.cos(angle);
      const dotY = cy + dotRadius * Math.sin(angle);
      return {
        axis,
        index,
        angle,
        valueRadius,
        pointX: cx + valueRadius * Math.cos(angle),
        pointY: cy + valueRadius * Math.sin(angle),
        lineX: x,
        lineY: y,
        labelX,
        labelY,
        dotX,
        dotY,
        textAnchor: Math.cos(angle) >= 0 ? "start" : "end",
      };
    });
  }, [data, maxValue, radius, labelRadius, dotRadius, cx, cy]);

  const polygons = useMemo(() => {
    const map = new Map<PowerWheelGroup, { color: string; points: Array<{ x: number; y: number }> }>();
    axes.forEach((entry) => {
      const group = entry.axis.group;
      if (!map.has(group)) {
        map.set(group, { color: mergedColors[group], points: [] });
      }
      map.get(group)!.points.push({ x: entry.pointX, y: entry.pointY });
    });
    return Array.from(map.entries()).map(([group, config]) => {
      if (config.points.length < 3) return null;
      const path = config.points.map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
      return {
        group,
        color: config.color,
        path: `${path} Z`,
      };
    }).filter(Boolean) as Array<{ group: PowerWheelGroup; color: string; path: string }>;
  }, [axes, mergedColors]);

  const ringsArray = useMemo(() => {
    return Array.from({ length: rings }, (_, index) => radius * ((index + 1) / rings));
  }, [rings, radius]);

  const handleTooltip = (entry: typeof axes[number], visible: boolean) => {
    if (!visible) {
      setTooltip((prev) => ({ ...prev, visible: false }));
      return;
    }
    const axis = entry.axis;
    setTooltip({
      axis,
      x: entry.dotX,
      y: entry.dotY,
      visible: true,
    });
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative mx-auto max-w-full">
        <svg
          role="img"
          aria-label="Power wheel chart"
          viewBox={`0 0 ${size} ${size}`}
          className="h-auto w-full"
        >
          <g opacity={0.5}>
            {ringsArray.map((ringRadius, idx) => (
              <circle
                key={`ring-${idx}`}
                cx={cx}
                cy={cy}
                r={ringRadius}
                fill="none"
                stroke="rgba(148, 163, 184, 0.4)"
                strokeWidth={0.75}
              />
            ))}
            {axes.map((entry) => (
              <line
                key={`spoke-${entry.index}`}
                x1={cx}
                y1={cy}
                x2={entry.lineX}
                y2={entry.lineY}
                stroke="rgba(148, 163, 184, 0.35)"
                strokeWidth={0.75}
              />
            ))}
          </g>

          <g>
            {polygons.map((poly) => (
              <path
                key={poly.group}
                d={poly.path}
                fill={poly.color}
                fillOpacity={0.25}
                stroke={poly.color}
                strokeWidth={1.5}
              />
            ))}
          </g>

          <g>
            {axes.map((entry) => {
              const labels = wrapLabel(entry.axis.label);
              const rtl = isRTL(entry.axis.label);
              const textAnchor = rtl ? (Math.cos(entry.angle) >= 0 ? "end" : "start") : entry.textAnchor;
              return (
                <g key={`label-${entry.axis.key}`}>
                  <text
                    x={entry.labelX}
                    y={entry.labelY}
                    textAnchor={textAnchor as "start" | "end"}
                    dominantBaseline="middle"
                    fill="#e2e8f0"
                    fontSize={12}
                    direction="rtl"
                    unicodeBidi="plaintext"
                    style={{
                      fontWeight: 500,
                      fontFamily: "Vazirmatn, 'IRANSans', Tahoma, sans-serif",
                      fontFeatureSettings: '"kern" 1',
                    }}
                  >
                    {labels.map((line, idx) => (
                      <tspan key={idx} x={entry.labelX} dy={idx === 0 ? 0 : 14}>
                        {normalizeBidi(line)}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>

          {showOuterDots ? (
            <g>
              {axes.map((entry) => (
                <g
                  key={`dot-${entry.axis.key}`}
                  tabIndex={0}
                  onMouseEnter={() => handleTooltip(entry, true)}
                  onMouseLeave={() => handleTooltip(entry, false)}
                  onFocus={() => handleTooltip(entry, true)}
                  onBlur={() => handleTooltip(entry, false)}
                  role="presentation"
                >
                  <circle
                    cx={entry.dotX}
                    cy={entry.dotY}
                    r={5}
                    fill={mergedColors[entry.axis.group]}
                    stroke="#0f172a"
                    strokeWidth={1.2}
                  />
                </g>
              ))}
            </g>
          ) : null}
        </svg>

        {tooltip.visible && tooltip.axis ? (
          <div
            className="pointer-events-none absolute rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg rtl"
            style={{
              left: `calc(${(tooltip.x / size) * 100}% - 60px)`,
              top: `calc(${(tooltip.y / size) * 100}% - 56px)`,
            }}
            dir="rtl"
          >
            <p className="font-semibold">{normalizeBidi(tooltip.axis.label)}</p>
            <p className="text-slate-300">{normalizeBidi(tooltip.axis.group)}</p>
            <p className="text-slate-400">
              {normalizeBidi(tooltip.axis.value.toFixed(1))} / {normalizeBidi(maxValue)}
            </p>
          </div>
        ) : null}
      </div>

      {showLegend ? (
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          {(Object.keys(DEFAULT_POWER_WHEEL_COLORS) as PowerWheelGroup[]).map((group) => (
            <div key={group} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-white/80">
              <span
                className="h-3 w-3 rounded"
                style={{ backgroundColor: mergedColors[group] }}
              />
              <span>{group}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
