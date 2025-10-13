// src/pages/Dashboard.tsx

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { AssessmentMap, AssessmentMapStep } from "@/components/ui/assessment-map";
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  LoaderCircle,
  Lock,
  Rocket,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";

// این اینترفیس برای هماهنگی بیشتر با کانتکست به‌روز شد
interface Assessment {
  id: number;
  stringId: string;
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  category?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "شایستگی های رفتاری (بین فردی)": "#7C3AED",
  "شایستگی های شناختی": "#0EA5E9",
  "شایستگی های فردی": "#EC4899",
  "شایستگی های رهبری و مدیریت": "#F97316",
  "نیمرخ روانشناختی": "#10B981",
};

const DEFAULT_CATEGORY_COLOR = "#6366F1";

const SPIRAL_POSITIONS = [
  { top: "12%", left: "64%" },
  { top: "30%", left: "78%" },
  { top: "52%", left: "68%" },
  { top: "70%", left: "46%" },
  { top: "48%", left: "28%" },
];

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized.length === 3 ? sanitized.repeat(2) : sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const truncate = (value: string, maxLength = 18) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;

const getStageStyles = (status: string, color: string): CSSProperties => {
  if (status === "completed") {
    return {
      backgroundColor: color,
      color: "#ffffff",
      boxShadow: `0 10px 24px ${hexToRgba(color, 0.28)}`,
    };
  }

  if (status === "current") {
    return {
      backgroundColor: hexToRgba(color, 0.2),
      color,
      border: `1px solid ${hexToRgba(color, 0.45)}`,
    };
  }

  return {
    backgroundColor: "rgba(148,163,184,0.18)",
    color: "#64748B",
  };
};

const Dashboard = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingAssessmentId, setStartingAssessmentId] = useState<number | null>(null);

  const navigate = useNavigate();

  // گرفتن لیست ارزیابی‌ها
  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiFetch("assessment/status");
      if (response.success) {
        setAssessments(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "خطا در دریافت لیست ارزیابی‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // شروع ارزیابی
  const handleStartAssessment = async (assessmentId: number) => {
    if (startingAssessmentId) return;
    setStartingAssessmentId(assessmentId);

    try {
      const response = await apiFetch(`assessment/start/${assessmentId}`, { method: "POST" });
      if (!response.success || !response.data) throw new Error("خطا در شروع ارزیابی");

      const { sessionId, initialMessage, settings, personaName } = response.data;

      sessionStorage.setItem(
        `assessmentState_${assessmentId}`,
        JSON.stringify({ sessionId, initialMessage, settings, personaName })
      );

      toast.success("ارزیابی با موفقیت شروع شد!");
      navigate(`/assessment/chat/${assessmentId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setStartingAssessmentId(null);
    }
  };

  const statusPriority: Record<Assessment["status"], number> = {
    locked: 1,
    completed: 2,
    current: 3,
  };

  const dedupedAssessments = useMemo(() => {
    const map = new Map<string, Assessment>();
    assessments.forEach((assessment) => {
      const key = assessment.stringId || String(assessment.id);
      const existing = map.get(key);
      if (!existing || statusPriority[assessment.status] >= statusPriority[existing.status]) {
        map.set(key, assessment);
      }
    });

    const grouped = new Map<string, Assessment[]>();
    Array.from(map.values()).forEach((assessment) => {
      const category = assessment.category || "سایر دسته‌بندی‌ها";
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(assessment);
    });

    const entries = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b, "fa"));

    const ordered: Assessment[] = [];
    entries.forEach(([, cats]) => {
      const sortedCats = cats.sort((lhs, rhs) => {
        const statusWeight = (statusPriority[rhs.status] ?? 0) - (statusPriority[lhs.status] ?? 0);
        if (statusWeight !== 0) return statusWeight;
        return (lhs.display_order ?? 0) - (rhs.display_order ?? 0);
      });
      ordered.push(...sortedCats);
    });

    return ordered;
  }, [assessments]);

  const mapSteps: AssessmentMapStep[] = useMemo(
    () =>
      dedupedAssessments.map((a) => {
        const accentColor = CATEGORY_COLORS[a.category ?? ""] ?? DEFAULT_CATEGORY_COLOR;
        return {
          id: a.stringId || String(a.id),
          title: a.title,
          description: a.description,
          status: a.status,
          category: a.category,
          accentColor,
        };
      }),
    [dedupedAssessments]
  );

  const currentAssessment = dedupedAssessments.find((a) => a.status === "current");
  const totalCount = dedupedAssessments.length;
  const completedCount = dedupedAssessments.filter((a) => a.status === "completed").length;
  const lockedCount = dedupedAssessments.filter((a) => a.status === "locked").length;
  const availableCount = dedupedAssessments.filter((a) => a.status !== "locked").length;
  const remainingCount = Math.max(totalCount - completedCount, 0);
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatNumber = (value: number) => value.toLocaleString("fa-IR");

  const stations = useMemo(() => {
    const grouped = new Map<string, Assessment[]>();
    dedupedAssessments.forEach((assessment) => {
      const category = assessment.category || "سایر دسته‌بندی‌ها";
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(assessment);
    });

    const entries = Array.from(grouped.entries());

    return entries.map(([category, steps], index) => {
      const color = CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR;
      const position = SPIRAL_POSITIONS[index % SPIRAL_POSITIONS.length];
      const statusOrder: Record<Assessment["status"], number> = {
        completed: 0,
        current: 1,
        locked: 2,
      };

      const orderedSteps = steps
        .slice()
        .sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3))
        .slice(0, 6);

      return {
        name: category,
        color,
        position,
        stages: orderedSteps.map((step) => ({
          label: step.title,
          status: step.status,
        })),
      };
    });
  }, [dedupedAssessments]);

  // رندر محتوا
  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex items-center justify-center py-24">
          <LoaderCircle className="h-12 w-12 animate-spin text-purple-500" />
        </div>
      );

    if (error)
      return (
        <Card className="rounded-3xl border border-purple-200/80 bg-white/95 p-10 text-center shadow-[0_16px_60px_rgba(124,58,237,0.12)]">
          <AlertTriangle className="mx-auto h-12 w-12 text-purple-500" />
          <p className="mt-5 text-lg font-semibold text-slate-900">خطا در دریافت اطلاعات</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{error}</p>
          <Button
            className="mt-6 rounded-full bg-gradient-to-l from-purple-600 to-purple-500 px-6 py-2 text-white shadow-[0_12px_30px_rgba(124,58,237,0.35)] hover:from-purple-700 hover:to-purple-600"
            onClick={fetchAssessments}
          >
            تلاش مجدد
          </Button>
        </Card>
      );

    const finishedAll =
      !currentAssessment &&
      dedupedAssessments.length > 0 &&
      dedupedAssessments.every((a) => a.status === "completed");

    if (finishedAll) {
      return (
        <Card className="rounded-[32px] border border-purple-200/80 bg-white/95 p-12 text-center shadow-[0_24px_80px_rgba(124,58,237,0.16)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">مسیر ارزیابی شما کامل شد!</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            تمام مرحله‌ها با موفقیت طی شده‌اند. برای مشاهده گزارش جامع می‌توانید به نتایج نهایی سر بزنید و پیشنهادهای بعدی را دریافت کنید.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              className="rounded-full border border-purple-200 bg-white px-6 py-2 text-sm font-semibold text-purple-600 transition hover:bg-purple-50"
              onClick={() => navigate('/results')}
            >
              مشاهده گزارش کامل
            </Button>
            <Button
              className="rounded-full bg-gradient-to-l from-purple-600 to-purple-500 px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.28)] hover:from-purple-700 hover:to-purple-600"
              onClick={fetchAssessments}
            >
              شروع دوباره مسیر
            </Button>
          </div>
        </Card>
      );
    }

    const stats = [
      {
        label: "مرحله‌های تکمیل‌شده",
        value: `${formatNumber(completedCount)}${totalCount ? ` از ${formatNumber(totalCount)}` : ""}`,
        icon: Trophy,
        accent: "bg-purple-100/80 text-purple-600",
      },
      {
        label: "مرحله‌های در دسترس",
        value: formatNumber(availableCount),
        icon: Rocket,
        accent: "bg-purple-100/60 text-purple-600",
      },
      {
        label: "مرحله‌های قفل",
        value: formatNumber(lockedCount),
        icon: Lock,
        accent: "bg-slate-100 text-slate-500",
      },
      {
        label: "درصد پیشرفت",
        value: `${formatNumber(progressPercent)}٪`,
        icon: Sparkles,
        accent: "bg-purple-100/80 text-purple-600",
      },
    ];

    return (
      <div className="space-y-12">
        <section className="relative overflow-hidden rounded-[32px] border border-purple-200/60 bg-white/90 p-10 shadow-[0_20px_70px_rgba(124,58,237,0.12)]">
          <div className="pointer-events-none absolute inset-0">
            <svg className="absolute -left-20 top-12 h-64 w-64 text-purple-200" viewBox="0 0 200 200" fill="none">
              <path
                d="M10 180 Q80 40 190 120"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                strokeOpacity="0.3"
              />
            </svg>
            <div className="absolute -top-32 right-12 h-56 w-56 rounded-full bg-gradient-to-br from-purple-500/10 via-white to-purple-500/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/80 px-4 py-1 text-xs font-semibold text-purple-600">
                <Sparkles className="h-4 w-4" />
                مسیر ارزیابی فعال
              </span>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold leading-tight text-slate-900">
                  {currentAssessment
                    ? `مرحله «${currentAssessment.title}» آماده آغاز است`
                    : "برای مرحله بعدی آماده شوید"}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-slate-500">
                  نقشه خمیدهٔ ارزیابی به شما کمک می‌کند هر نقش را در جای خود ببینید. هر بار که مرحله‌ای را تکمیل کنید، مسیر روشن‌تر می‌شود و پیشنهادهای تازه‌ای ظاهر خواهند شد.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-100/80 bg-white/80 px-3 py-1">
                  <Trophy className="h-4 w-4 text-purple-500" />
                  {formatNumber(completedCount)} مرحله تمام شده
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-100/80 bg-white/80 px-3 py-1">
                  <Clock3 className="h-4 w-4 text-purple-500" />
                  {formatNumber(remainingCount)} مرحله باقی مانده
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center gap-5 rounded-[28px] border border-purple-200/80 bg-white/80 px-8 py-8 text-center shadow-[0_12px_45px_rgba(124,58,237,0.1)]">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-[0_18px_50px_rgba(124,58,237,0.35)]">
                <span className="text-3xl font-bold">{formatNumber(progressPercent)}%</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">پیشرفت کل مسیر</p>
                <p className="text-xs text-slate-500">{formatNumber(completedCount)} از {formatNumber(totalCount)} مرحله باز شده‌اند.</p>
              </div>
              <Button
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-purple-600 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.28)] hover:from-purple-700 hover:to-purple-600 disabled:cursor-not-allowed disabled:from-purple-300 disabled:to-purple-300"
                onClick={() => currentAssessment && handleStartAssessment(currentAssessment.id)}
                disabled={!currentAssessment || !!startingAssessmentId}
              >
                {startingAssessmentId === currentAssessment?.id ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                {currentAssessment ? "ورود به مرحلهٔ بعد" : "منتظر آزاد شدن مرحله جدید"}
              </Button>
              {completedCount > 0 && (
                <Button
                  variant="ghost"
                  className="text-xs font-semibold text-purple-600 hover:bg-purple-50"
                  onClick={() => navigate('/results')}
                >
                  مشاهده گزارش‌های قبلی
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-[24px] border border-purple-100/60 bg-white/90 p-6 shadow-[0_14px_45px_rgba(124,58,237,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(124,58,237,0.12)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-[32px] border border-purple-200/80 bg-gradient-to-b from-white/95 via-purple-50/60 to-white/95 p-10 shadow-[0_20px_70px_rgba(124,58,237,0.12)]">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-bold text-slate-900">نقشهٔ خمیدهٔ ارزیابی</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              حباب‌ها مسیر شما را در یک نگاه نشان می‌دهند. روی هر مرحله کلیک کنید تا وارد گفتگو شوید یا پیشرفت گذشته را مرور کنید.
            </p>
          </div>
          <div className="mt-10">
            <div className="relative hidden md:block">
              <AssessmentMap
                steps={mapSteps}
                onStepSelect={(step) => {
                  const selectedAssessment = dedupedAssessments.find(
                    (assessment) => (assessment.stringId || String(assessment.id)) === step.id
                  );

                  if (!selectedAssessment) return;

                  if (selectedAssessment.status === "current") {
                    handleStartAssessment(selectedAssessment.id);
                  } else if (selectedAssessment.status === "completed") {
                    toast.info("این مرحله پیش‌تر تکمیل شده است. نتایج در بخش گزارش‌ها در دسترس است.");
                  } else {
                    toast.info("برای دسترسی به این مرحله ابتدا مرحله‌های قبلی را تکمیل کنید.");
                  }
                }}
              />
{stations.map((station) => (
                <div
                  key={station.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2 space-y-2 text-right"
                  style={{ top: station.position.top, left: station.position.left }}
                >
                  <div
                    className="rounded-full px-3 py-1 text-[12px] font-semibold text-white shadow-lg"
                    style={{ backgroundColor: station.color }}
                  >
                    {station.name}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {station.stages.map((stage, idx) => (
                      <span
                        key={`${stage.label}-${idx}`}
                        className="rounded-full px-2 py-1 text-[11px] font-medium shadow-sm"
                        style={getStageStyles(stage.status, station.color)}
                      >
                        {truncate(stage.label, 16)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="md:hidden">
              <AssessmentMap
                steps={mapSteps}
                onStepSelect={(step) => {
                  const selectedAssessment = dedupedAssessments.find(
                    (assessment) => (assessment.stringId || String(assessment.id)) === step.id
                  );

                  if (!selectedAssessment) return;

                  if (selectedAssessment.status === "current") {
                    handleStartAssessment(selectedAssessment.id);
                  } else if (selectedAssessment.status === "completed") {
                    toast.info("این مرحله پیش‌تر تکمیل شده است. نتایج در بخش گزارش‌ها در دسترس است.");
                  } else {
                    toast.info("برای دسترسی به این مرحله ابتدا مرحله‌های قبلی را تکمیل کنید.");
                  }
                }}
              />
              <div className="mt-6 grid gap-3">
                {stations.map((station) => (
                  <div key={station.name} className="flex items-center justify-between rounded-2xl border border-purple-100 bg-white/95 p-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{station.name}</p>
                      <div className="mt-2 flex flex-wrap justify-end gap-1.5 text-xs">
                        {station.stages.map((stage, idx) => (
                          <span
                            key={`${stage.label}-${idx}`}
                            className="rounded-full px-2 py-0.5 text-[11px]"
                            style={getStageStyles(stage.status, station.color)}
                          >
                            {truncate(stage.label, 14)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: station.color }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/40 to-white text-slate-900">
      <header className="border-b border-purple-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Logo variant="large" />
          <Button
            size="icon"
            className="rounded-full border border-purple-100 bg-white/70 text-slate-600 shadow-[0_10px_30px_rgba(124,58,237,0.12)] transition hover:bg-purple-50"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-10 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-purple-100/80 bg-white/80 px-4 py-1 text-xs font-semibold text-purple-600">
            <Sparkles className="h-4 w-4" />
            مسیرهای فعال شما
          </div>
          <h1 className="text-4xl font-bold leading-tight text-slate-900">داشبورد ارزیابی</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
            همهٔ ارزیابی‌های شما در اینجا جمع شده‌اند؛ از این نما می‌توانید مسیر خمیده را دنبال کنید، مرحلهٔ بعد را شروع کنید و گزارش‌های گذشته را در یک نگاه مرور نمایید.
          </p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
