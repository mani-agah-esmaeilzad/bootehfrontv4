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
    const baseRadius = 14;
    const radiusGrowth = 9;
    const verticalSpacing = 160;
    const waveMagnitude = 24;

    return steps.map((step, index) => {
      const turn = index * 0.85;
      const dynamicRadius = baseRadius + index * radiusGrowth;
      const sinusoidal = Math.sin(turn * 1.65) * waveMagnitude;
      const cosineOffset = Math.cos(turn * 0.8) * (waveMagnitude * 0.8);
      const x = clamp(50 + sinusoidal + Math.cos(turn) * dynamicRadius * 0.4, 6, 94);
      const y = 120 + index * verticalSpacing + cosineOffset;

      return {
        step,
        index,
        x,
        y,
      };
    });
  }, [steps]);

  const pathCommands = useMemo(() => {
    if (!nodePositions.length) return "";

    return nodePositions
      .map((point, i, arr) => {
        if (i === 0) {
          return `M ${point.x} ${point.y}`;
        }

        const prev = arr[i - 1];
        const midX = (prev.x + point.x) / 2;
        const controlOffset = (point.y - prev.y) / 3;

        return `C ${midX} ${prev.y + controlOffset}, ${midX} ${point.y - controlOffset}, ${point.x} ${point.y}`;
      })
      .join(" ");
  }, [nodePositions]);

  const accentPathCommands = useMemo(() => {
    if (!nodePositions.length) return [] as string[];

    return [10, -10].map((offset) =>
      nodePositions
        .map((point, i, arr) => {
          const y = point.y + offset;

          if (i === 0) {
            return `M ${point.x} ${y}`;
          }

          const prev = arr[i - 1];
          const prevY = prev.y + offset;
          const midX = (prev.x + point.x) / 2;

          return `Q ${midX} ${(prevY + y) / 2}, ${point.x} ${y}`;
        })
        .join(" ")
    );
  }, [nodePositions]);

  const lastCompletedIndex = useMemo(() => {
    let completedIndex = -1;
    nodePositions.forEach(({ step, index }) => {
      if (step.status === "completed") {
        completedIndex = index;
      }
    });
    return completedIndex;
  }, [nodePositions]);

  const currentIndex = useMemo(
    () => nodePositions.find(({ step }) => step.status === "current")?.index ?? -1,
    [nodePositions]
  );

  const activeIndex = currentIndex !== -1 ? currentIndex : lastCompletedIndex;

  const progressCommands = useMemo(() => {
    if (activeIndex < 0) return "";

    const sliced = nodePositions.slice(0, activeIndex + 1);

    return sliced
      .map((point, i, arr) => {
        if (i === 0) {
          return `M ${point.x} ${point.y}`;
        }

        const prev = arr[i - 1];
        const midX = (prev.x + point.x) / 2;
        const controlOffset = (point.y - prev.y) / 3;

        return `C ${midX} ${prev.y + controlOffset}, ${midX} ${point.y - controlOffset}, ${point.x} ${point.y}`;
      })
      .join(" ");
  }, [activeIndex, nodePositions]);

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
          <path
            d={pathCommands}
            fill="none"
            stroke="url(#mapPathGradient)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.65}
            filter="url(#softGlow)"
          />
          {accentPathCommands.map((accentPath, index) => (
            <path
              key={`accent-${index}`}
              d={accentPath}
              fill="none"
              stroke="rgba(139,92,246,0.2)"
              strokeWidth={2}
              strokeDasharray="12 16"
              strokeLinecap="round"
              opacity={0.5 - index * 0.2}
            />
          ))}
          <path
            d={progressCommands}
            fill="none"
            stroke="url(#mapProgressGradient)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#accentGlow)"
          />
          {nodePositions.map((point) => (
            <g key={`orbit-${point.step.id}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={17}
                fill="url(#mapPathGradient)"
                opacity={0.18}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={27}
                stroke="rgba(148,163,184,0.2)"
                strokeWidth={0.6}
                strokeDasharray="6 9"
                fill="none"
              />
            </g>
          ))}
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
