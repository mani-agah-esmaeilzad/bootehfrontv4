import { Check, Lock, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "locked";
}

interface ProgressTimelineProps {
  steps: TimelineStep[];
  className?: string;
}
export const ProgressTimeline = ({ steps, className }: ProgressTimelineProps) => {
  const navigate = useNavigate();
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex items-start">
          {/* Connecting Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute right-6 top-12 w-0.5 h-8 -z-10",
                step.status === "completed"
                  ? "bg-hrbooteh-success"
                  : "bg-hrbooteh-surface-elevated"
              )}
            />
          )}

          {/* Step Icon */}
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full border-2 ml-auto transition-all duration-300",
            step.status === "completed" && "bg-hrbooteh-success border-hrbooteh-success text-hrbooteh-success-foreground",
            step.status === "current" && "bg-hrbooteh-warning border-hrbooteh-warning text-hrbooteh-warning-foreground animate-pulse-gentle",
            step.status === "locked" && "bg-hrbooteh-surface-elevated border-hrbooteh-text-muted text-hrbooteh-text-muted"
          )}>
            {step.status === "completed" && <Check className="w-5 h-5" />}
            {step.status === "current" && <Play className="w-5 h-5" />}
            {step.status === "locked" && <Lock className="w-5 h-5" />}
          </div>

          {/* Step Content */}
          <div className="flex-1 mr-4 pb-8">
            <h3 className={cn(
              "font-semibold text-lg mb-1",
              step.status === "completed" && "text-hrbooteh-success",
              step.status === "current" && "text-hrbooteh-text-primary",
              step.status === "locked" && "text-hrbooteh-text-muted"
            )}>
              {step.title}
            </h3>
            {step.description && (
              <p className={cn(
                "text-sm",
                step.status === "locked"
                  ? "text-hrbooteh-text-muted"
                  : "text-hrbooteh-text-secondary"
              )}>
                {step.description}
              </p>
            )}
          </div>

          {/* Resulte Button
          <div className="h-10">
           {step.status === "completed" &&(

            <Button
                variant="hrbooteh"
                size="sm"
                className="size-full"
                onClick={() => navigate('/results')}
                >
                مشاهده گزارش نهایی
              </Button>
            )
              }
            </div> */}
        </div>
      ))}
    </div>
  );
};