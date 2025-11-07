import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface AssessmentMapStep {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "locked" | "station";
  category?: string;
  accentColor?: string;
  kind?: "stage" | "station";
  sequence?: number;
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
    () => ({
      spacingY: isMobile ? 120 : 170,
      baseYOffset: isMobile ? 110 : 150,
      stageLeftX: isMobile ? 28 : 30,
      stageRightX: isMobile ? 72 : 70,
      stationX: 50,
      stationYOffset: isMobile ? -10 : -20,
    }),
    [isMobile]
  );

  const nodePositions = useMemo(() => {
    let fallbackSequence = 0;

    return steps.map((step, index) => {
      const isStation = step.kind === "station" || step.status === "station";
      let stageSequence = step.sequence;

      if (!isStation) {
        if (typeof stageSequence !== "number") {
          fallbackSequence += 1;
          stageSequence = fallbackSequence;
        } else {
          fallbackSequence = stageSequence;
        }
      }

      const isEvenSequence = !isStation && typeof stageSequence === "number" ? stageSequence % 2 === 0 : false;
      const x = clamp(
        isStation ? layout.stationX : isEvenSequence ? layout.stageRightX : layout.stageLeftX,
        8,
        92
      );
      const y = layout.baseYOffset + index * layout.spacingY + (isStation ? layout.stationYOffset : 0);

      return {
        step,
        index,
        x,
        y,
        isStation,
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
      const normalizedStatus =
        point.step.kind === "station" || point.step.status === "station" ? "completed" : point.step.status;

      return {
        d,
        color: point.step.accentColor ?? DEFAULT_ACCENT,
        status: normalizedStatus,
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

  if (isMobile) {
    return (
      <div className="relative mx-auto w-full max-w-xl px-3">
        <div className="pointer-events-none absolute inset-x-8 top-6 bottom-6">
          <div className="mx-auto h-full w-px bg-gradient-to-b from-purple-200 via-purple-100 to-purple-300" />
        </div>
        <div className="relative space-y-6">
          {steps.map((step, index) => {
            const accent = step.accentColor ?? DEFAULT_ACCENT;
            const isStation = step.kind === "station" || step.status === "station";
            const isLocked = step.status === "locked";
            const isCurrent = step.status === "current";
            const isCompleted = step.status === "completed";
            const sequenceLabel = step.sequence?.toLocaleString("fa-IR");

            const cardClass = cn(
              "rounded-2xl border px-4 py-4 text-right shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition",
              isStation
                ? "border-purple-200/70 bg-white/60"
                : isLocked
                ? "border-slate-200 bg-white/70 text-slate-400"
                : isCurrent
                ? "border-transparent bg-gradient-to-l from-purple-600 to-sky-500 text-white shadow-[0_20px_50px_rgba(79,70,229,0.35)]"
                : "border-slate-100 bg-white/95"
            );

            const dotClass = cn(
              "relative z-10 h-4 w-4 rounded-full border-2 transition",
              isStation
                ? "border-purple-300 bg-white shadow-[0_8px_24px_rgba(168,85,247,0.35)]"
                : isLocked
                ? "border-slate-300 bg-white/80"
                : isCurrent
                ? "border-transparent bg-gradient-to-br from-purple-600 to-sky-500 shadow-[0_12px_32px_rgba(79,70,229,0.45)]"
                : "border-transparent bg-white shadow-[0_12px_32px_rgba(148,163,184,0.35)]"
            );

            const statusPill = !isStation && (
              <span
                className={cn(
                  "mt-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold",
                  isLocked
                    ? "bg-slate-100 text-slate-400"
                    : isCurrent
                    ? "bg-white/25 text-white"
                    : "bg-emerald-50 text-emerald-600"
                )}
              >
                {isCurrent ? "مرحله جاری" : isLocked ? "قفل شده" : "تکمیل شده"}
              </span>
            );

            const handleStageSelect = () => {
              if (!isStation && !isLocked) {
                onStepSelect?.(step, index);
              }
            };

            return (
              <div
                key={step.id}
                className="relative grid grid-cols-[auto,1fr] gap-4"
                style={{ minHeight: isStation ? 88 : 108 }}
              >
                <div className="relative flex flex-col items-center">
                  <span className={dotClass} style={{ borderColor: isStation || isLocked ? undefined : accent }} />
                  {index < steps.length - 1 && (
                    <span className="mt-1 h-full w-px bg-gradient-to-b from-purple-200 via-purple-100 to-purple-200" />
                  )}
                </div>
                <div
                  className={cn(cardClass, !isStation && !isLocked ? "cursor-pointer" : "cursor-default")}
                  style={!isStation && !isLocked && !isCurrent ? { borderColor: accent } : undefined}
                  role={!isStation ? "button" : undefined}
                  tabIndex={!isStation && !isLocked ? 0 : undefined}
                  onClick={handleStageSelect}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && !isStation && !isLocked) {
                      event.preventDefault();
                      handleStageSelect();
                    }
                  }}
                >
                  {isStation ? (
                    <>
                      <p className="text-[11px] font-semibold text-purple-600">ایستگاه شایستگی</p>
                      <h4 className="mt-1 text-base font-bold text-slate-900">{step.title}</h4>
                      <p className="mt-2 text-[12px] leading-6 text-slate-500">
                        از اینجا به بعد مرحله‌های مربوط به این شایستگی فعال می‌شود.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-[11px] font-semibold text-slate-500">مرحله {sequenceLabel ?? "…"}</div>
                      <h4 className={cn("mt-1 text-base font-bold", isCurrent ? "text-white" : "text-slate-900")}>
                        {step.title}
                      </h4>
                      {statusPill}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
          {segments.map((segment, index) => {
            if (segment.isCategoryStart) return null;

            return (
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
            );
          })}
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

            if (segment.isCategoryStart) {
              return <defs key={`gradient-${index}`}>{gradient}</defs>;
            }

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
            if (point.isStation) return null;
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

      {nodePositions.map(({ step, index, x, y, isStation }) => {
        const accent = step.accentColor ?? DEFAULT_ACCENT;

        if (isStation) {
          return (
            <div
              key={step.id}
              className="absolute flex flex-col items-center gap-2 text-center"
              style={{
                left: `${x}%`,
                top: `${y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="rounded-[28px] border-2 border-dashed border-white/60 bg-white/85 px-6 py-3 text-xs font-semibold text-slate-500 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur">
                <div className="text-[11px] text-purple-600">ایستگاه شایستگی</div>
                <div className="mt-1 text-base font-bold text-slate-900">{step.title}</div>
              </div>
            </div>
          );
        }

        const isLocked = step.status === "locked";
        const isCurrent = step.status === "current";
        const isCompleted = step.status === "completed";
        const sequenceLabel = step.sequence?.toLocaleString("fa-IR") ?? (index + 1).toLocaleString("fa-IR");

        const buttonStyle: CSSProperties = {
          borderColor: accent,
          background: isLocked
            ? "rgba(255,255,255,0.75)"
            : isCompleted
            ? hexToRgba(accent, 0.12)
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
          color: isLocked ? "#94A3B8" : isCurrent ? accent : "#1E293B",
        };

        return (
          <div
            key={step.id}
            className={cn(
              "absolute flex max-w-[240px] flex-col items-center gap-2 text-center transition-all duration-300 md:gap-3",
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
                {sequenceLabel}
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
