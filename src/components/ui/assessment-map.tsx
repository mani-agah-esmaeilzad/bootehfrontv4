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
              <stop offset="0%" stopColor="rgba(148,163,184,0.3)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0.1)" />
            </linearGradient>
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
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
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
            <button
              type="button"
              onClick={() => !isLocked && onStepSelect?.(step, index)}
              className={cn(
                "relative flex h-28 w-28 items-center justify-center rounded-full border-2 bg-white text-center text-slate-600 shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isCompleted && "border-emerald-200 bg-emerald-50 text-emerald-700",
                isCurrent &&
                  "border-sky-300 bg-sky-50 text-sky-700 ring-4 ring-sky-100 transition-[transform,box-shadow] duration-500",
                isLocked && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 shadow-none"
              )}
              disabled={isLocked}
            >
              <span className="px-6 text-base font-semibold leading-relaxed">{step.title}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AssessmentMap;
