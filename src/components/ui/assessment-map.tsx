import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface AssessmentMapStep {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "locked";
  category?: string;
  accentColor?: string;
}

interface AssessmentMapProps {
  steps: AssessmentMapStep[];
  onStepSelect?: (step: AssessmentMapStep, index: number) => void;
  onLayoutChange?: (
    nodes: { step: AssessmentMapStep; index: number; x: number; y: number }[],
    categories: {
      name: string;
      color: string;
      startIndex: number;
      x: number;
      y: number;
    }[]
  ) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const DEFAULT_ACCENT = "#6366F1";

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const normalized = sanitized.length === 3 ? sanitized.split('').map((ch) => ch + ch).join('') : sanitized;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const AssessmentMap = ({ steps, onStepSelect, onLayoutChange }: AssessmentMapProps) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const layout = useMemo(
    () =>
      isMobile
        ? {
            centerX: 50,
            baseRadius: 14,
            radiusGrowth: 4.4,
            angleStart: Math.PI / 2.4,
            angleStep: Math.PI / 1.9,
            verticalSpacing: 122,
            swayX: 5.5,
            swayY: 36,
            baseYOffset: 120,
            leftMin: 14,
            leftMax: 86,
            verticalJitter: 18,
          }
        : {
            centerX: 50,
            baseRadius: 18,
            radiusGrowth: 5.75,
            angleStart: Math.PI / 3,
            angleStep: Math.PI / 1.75,
            verticalSpacing: 150,
            swayX: 9,
            swayY: 52,
            baseYOffset: 140,
            leftMin: 8,
            leftMax: 92,
            verticalJitter: 24,
          },
    [isMobile]
  );

  const nodePositions = useMemo(() => {
    return steps.map((step, index) => {
      const angle = layout.angleStart + index * layout.angleStep;
      const radius = layout.baseRadius + index * layout.radiusGrowth;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);

      const x = clamp(
        layout.centerX + cosine * radius + Math.sin(angle * 1.25) * layout.swayX,
        layout.leftMin,
        layout.leftMax
      );

      const y =
        layout.baseYOffset +
        index * layout.verticalSpacing +
        sine * layout.swayY +
        Math.cos(angle * 0.9) * layout.verticalJitter;

      return {
        step,
        index,
        x,
        y,
      };
    });
  }, [steps, layout]);

  const segments = useMemo(() => {
    if (nodePositions.length < 2)
      return [] as { d: string; color: string; status: AssessmentMapStep["status"] }[];

    return nodePositions.slice(1).map((point, idx) => {
      const prev = nodePositions[idx];
      const midX = (prev.x + point.x) / 2;
      const controlOffset = (point.y - prev.y) / 3;
      const d = `M ${prev.x} ${prev.y} C ${midX} ${prev.y + controlOffset}, ${midX} ${point.y - controlOffset}, ${point.x} ${point.y}`;

      return {
        d,
        color: point.step.accentColor ?? DEFAULT_ACCENT,
        status: point.step.status,
      };
    });
  }, [nodePositions]);

  useEffect(() => {
    if (!onLayoutChange) return;

    const nodes = nodePositions.map((node) => ({
      step: node.step,
      index: node.index,
      x: node.x,
      y: node.y,
    }));

    const categoryAnchorsMap = new Map<string, { name: string; color: string; startIndex: number; x: number; y: number }>();

    nodePositions.forEach((node) => {
      const categoryName = node.step.category || "سایر دسته‌بندی‌ها";
      if (categoryAnchorsMap.has(categoryName)) return;

      categoryAnchorsMap.set(categoryName, {
        name: categoryName,
        color: node.step.accentColor ?? DEFAULT_ACCENT,
        startIndex: node.index,
        x: node.x,
        y: node.y,
      });
    });

    onLayoutChange(nodes, Array.from(categoryAnchorsMap.values()));
  }, [nodePositions, onLayoutChange]);

  if (!steps.length) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        هنوز ارزیابی‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  const mapHeight =
    nodePositions.length > 0
      ? nodePositions[nodePositions.length - 1].y + (isMobile ? 140 : 180)
      : isMobile
      ? 280
      : 320;

  return (
    <div
      className="relative mx-auto w-full max-w-4xl overflow-visible"
      style={{ minHeight: mapHeight }}
    >
      <div className="pointer-events-none absolute inset-0">
        <svg viewBox={`0 0 100 ${mapHeight}`} preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="mapPathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(124,58,237,0.35)" />
              <stop offset="100%" stopColor="rgba(124,58,237,0.12)" />
            </linearGradient>
            <linearGradient id="mapProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(139,92,246,0.95)" />
              <stop offset="50%" stopColor="rgba(167,139,250,0.9)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.92)" />
            </linearGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="accentGlow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="22" result="accentBlur" />
              <feMerge>
                <feMergeNode in="accentBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <defs>
            {segments.map((segment, index) => (
              <linearGradient key={`base-${index}`} id={`base-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={hexToRgba(segment.color, 0.16)} />
                <stop offset="100%" stopColor={hexToRgba(segment.color, 0.04)} />
              </linearGradient>
            ))}
          </defs>
          {segments.map((segment, index) => (
            <path
              key={`base-segment-${index}`}
              d={segment.d}
              fill="none"
              stroke={`url(#base-gradient-${index})`}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
              filter="url(#softGlow)"
            />
          ))}
          {segments.map((segment, index) => {
            const strokeWidth = segment.status === "locked" ? 4 : 6;
            const opacity = segment.status === "locked" ? 0.25 : segment.status === "completed" ? 0.9 : 0.75;
            const dash = segment.status === "locked" ? "6 12" : undefined;
            const gradientId = `gradient-segment-${index}`;

            const gradient = (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={hexToRgba(segment.color, 0.9)} />
                <stop offset="100%" stopColor={hexToRgba(segment.color, 0.9)} />
              </linearGradient>
            );

            return (
              <>
                <defs>{gradient}</defs>
                <path
                  key={`segment-${index}`}
                  d={segment.d}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={dash}
                  opacity={opacity}
                  filter={segment.status === "current" ? "url(#accentGlow)" : undefined}
                />
              </>
            );
          })}
          {nodePositions.map((point) => {
            const orbitRadius = isMobile ? 14 : 18;
            const haloRadius = isMobile ? 22 : 27;

            return (
              <g key={`orbit-${point.step.id}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={orbitRadius}
                  fill={hexToRgba(point.step.accentColor ?? DEFAULT_ACCENT, 0.15)}
                  opacity={0.4}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={haloRadius}
                  stroke={hexToRgba(point.step.accentColor ?? DEFAULT_ACCENT, 0.25)}
                  strokeWidth={0.6}
                  strokeDasharray="6 9"
                  fill="none"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {nodePositions.map(({ step, index, x, y }) => {
        const accent = step.accentColor ?? DEFAULT_ACCENT;
        const isLocked = step.status === "locked";
        const isCurrent = step.status === "current";
        const isCompleted = step.status === "completed";

        const buttonStyle: CSSProperties = {
          borderColor: accent,
          background: isLocked
            ? "rgba(255,255,255,0.75)"
            : isCompleted
            ? hexToRgba(accent, 0.15)
            : "rgba(255,255,255,0.95)",
          color: isLocked ? "#94A3B8" : isCurrent || isCompleted ? accent : "#475569",
          boxShadow: isLocked
            ? "none"
            : isCurrent
            ? `0 22px 60px ${hexToRgba(accent, 0.35)}`
            : `0 18px 45px ${hexToRgba(accent, 0.18)}`,
        };

        const indexStyle: CSSProperties = {
          borderColor: isLocked ? "rgba(148,163,184,0.45)" : accent,
          backgroundColor: isLocked
            ? "rgba(148,163,184,0.15)"
            : isCurrent
            ? hexToRgba(accent, 0.25)
            : hexToRgba(accent, 0.12),
          color: isLocked ? "#94A3B8" : accent,
        };

        const titleStyle: CSSProperties = {
          color: isLocked ? "#94A3B8" : "#1E293B",
        };

        return (
          <div
            key={step.id}
            className={cn(
              "absolute flex flex-col items-center gap-2 transition-all duration-300 md:gap-3",
              !isLocked && "hover:-translate-y-1"
            )}
            style={{
              left: `${x}%`,
              top: `${y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 -z-10 h-24 w-24 rounded-full blur-2xl transition-opacity md:h-28 md:w-28"
              style={{
                background: `radial-gradient(circle at center, ${hexToRgba(accent, 0.28)} 0%, transparent 70%)`,
                opacity: isCurrent ? 1 : 0,
              }}
            />
            <button
              type="button"
              onClick={() => !isLocked && onStepSelect?.(step, index)}
              className="relative flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-full border-2 bg-white/95 text-center text-xs font-semibold backdrop-blur focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:h-28 md:w-28 md:text-sm"
              style={buttonStyle}
              disabled={isLocked}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold md:h-8 md:w-8 md:text-xs"
                style={indexStyle}
              >
                {index + 1}
              </span>
              <span className="px-3 text-[13px] font-semibold leading-relaxed md:px-4 md:text-sm" style={titleStyle}>
                {step.title}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AssessmentMap;
