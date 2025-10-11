import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface AssessmentMapStep {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "locked";
}

interface AssessmentMapProps {
  steps: AssessmentMapStep[];
  onStepSelect?: (step: AssessmentMapStep, index: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const AssessmentMap = ({ steps, onStepSelect }: AssessmentMapProps) => {
  const nodePositions = useMemo(() => {
    const angleStep = 1.35; // Radians between nodes to mimic a spiral turn
    const baseRadius = 18;
    const radiusGrowth = 6;
    const verticalSpacing = 150;

    return steps.map((step, index) => {
      const angle = index * angleStep;
      const dynamicRadius = baseRadius + index * radiusGrowth;
      const x = clamp(50 + Math.cos(angle) * dynamicRadius, 8, 92);
      const y = 120 + index * verticalSpacing + Math.sin(angle) * 22;

      return {
        step,
        index,
        x,
        y,
      };
    });
  }, [steps]);

  if (!steps.length) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        هنوز ارزیابی‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  const mapHeight =
    nodePositions.length > 0
      ? nodePositions[nodePositions.length - 1].y + 180
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
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={nodePositions
              .map((point, i, arr) => {
                if (i === 0) {
                  return `M ${point.x} ${point.y}`;
                }
                const prev = arr[i - 1];
                const midX = (prev.x + point.x) / 2;
                return `C ${midX} ${prev.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="url(#mapPathGradient)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
            filter="url(#softGlow)"
          />
        </svg>
      </div>

      {nodePositions.map(({ step, index, x, y }) => {
        const isLocked = step.status === "locked";
        const isCurrent = step.status === "current";
        const isCompleted = step.status === "completed";

        return (
          <div
            key={step.id}
            className={cn(
              "absolute flex flex-col items-center gap-3 transition-all duration-300",
              !isLocked && "hover:-translate-y-1"
            )}
            style={{
              left: `${x}%`,
              top: `${y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 h-28 w-28 rounded-full bg-gradient-to-br from-purple-500/10 via-white to-purple-500/20 blur-2xl transition-opacity",
                isCurrent ? "opacity-100" : "opacity-0"
              )}
            />
            <button
              type="button"
              onClick={() => !isLocked && onStepSelect?.(step, index)}
              className={cn(
                "relative flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full border-2 bg-white/95 text-center text-slate-600 shadow-[0_18px_45px_rgba(124,58,237,0.12)] backdrop-blur focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isCompleted && "border-purple-200 bg-purple-50 text-purple-600",
                isCurrent &&
                  "border-purple-500 bg-white text-purple-600 shadow-[0_22px_60px_rgba(124,58,237,0.28)]",
                isLocked && "cursor-not-allowed border-slate-200/70 bg-white/70 text-slate-400 shadow-none"
              )}
              disabled={isLocked}
            >
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                isCurrent
                  ? "border-purple-500 bg-purple-500/10 text-purple-600"
                  : isCompleted
                  ? "border-purple-200 bg-purple-100/60 text-purple-600"
                  : "border-slate-200 bg-white/80 text-slate-500"
              )}>
                {index + 1}
              </span>
              <span className="px-4 text-sm font-semibold leading-relaxed">{step.title}</span>
            </button>
            {step.description && (
              <div className="max-w-[12rem] text-center text-xs leading-relaxed text-slate-400">
                {step.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AssessmentMap;
