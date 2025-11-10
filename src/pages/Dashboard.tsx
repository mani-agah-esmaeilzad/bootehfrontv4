// src/pages/Dashboard.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
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
import apiFetch, { getPersonalityResults } from "@/services/apiService";
import { toast } from "sonner";

// این اینترفیس برای هماهنگی بیشتر با کانتکست به‌روز شد
interface Assessment {
  id: number | null;
  stringId: string;
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  category?: string;
  display_order?: number;
  type?: string;
  questionnaireId?: number | null;
  accentColor?: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "شایستگی های رفتاری (بین فردی)": "#7C3AED",
  "شایستگی های شناختی": "#0EA5E9",
  "شایستگی های فردی": "#EC4899",
  "شایستگی های رهبری و مدیریت": "#F97316",
  "شایستگی‌های روانشناختی": "#10B981",
  "سایر دسته‌بندی‌ها": "#6366F1",
};

const DEFAULT_CATEGORY_COLOR = "#6366F1";

const CATEGORY_SEQUENCE = [
  "شایستگی های رفتاری (بین فردی)",
  "شایستگی های شناختی",
  "شایستگی های فردی",
  "شایستگی های رهبری و مدیریت",
  "شایستگی‌های روانشناختی",
  "سایر دسته‌بندی‌ها",
] as const;

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "نیمرخ روانشناختی": "شایستگی‌های روانشناختی",
};

const normalizeCategoryName = (category?: string | null) => {
  if (!category) return "سایر دسته‌بندی‌ها";
  const trimmed = category.trim();
  return LEGACY_CATEGORY_MAP[trimmed] ?? trimmed;
};

const getCategoryColor = (category?: string | null) =>
  CATEGORY_COLORS[normalizeCategoryName(category)] ?? DEFAULT_CATEGORY_COLOR;

const getCategoryOrder = (category?: string | null) => {
  const normalized = normalizeCategoryName(category);
  const index = CATEGORY_SEQUENCE.indexOf(normalized as (typeof CATEGORY_SEQUENCE)[number]);
  return index === -1 ? CATEGORY_SEQUENCE.length : index;
};

const formatStageLabel = (index: number) => `مرحله ${(index + 1).toLocaleString("fa-IR")}`;

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("fa-IR", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

const Dashboard = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingAssessmentKey, setStartingAssessmentKey] = useState<string | null>(null);
  const [personalityResults, setPersonalityResults] = useState<any[]>([]);
  const [isPersonalityLoading, setIsPersonalityLoading] = useState(true);
  const navigate = useNavigate();

  // گرفتن لیست ارزیابی‌ها
  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiFetch("assessment/status");
      if (response.success) {
        const list = Array.isArray(response.data) ? (response.data as Assessment[]) : [];
        const filtered = list.filter((item) => item.type !== "mystery");
        const normalized = filtered.map((item) => ({
          ...item,
          category: normalizeCategoryName(item.category),
        }));
        setAssessments(normalized);
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

  useEffect(() => {
    const fetchPersonality = async () => {
      setIsPersonalityLoading(true);
      try {
        const response = await getPersonalityResults();
        if (!response.success) {
          throw new Error(response.message || "خطا در دریافت کارنامه‌های شخصیت");
        }
        setPersonalityResults(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Personality results fetch error:", err);
        setPersonalityResults([]);
      } finally {
        setIsPersonalityLoading(false);
      }
    };

    fetchPersonality();
  }, []);

  // شروع ارزیابی
  const handleStartAssessment = async (assessment: Assessment) => {
    if (startingAssessmentKey) return;
    if (!assessment) return;

    setStartingAssessmentKey(assessment.stringId);

    const questionnaireId = assessment.questionnaireId ?? assessment.id;
    if (!questionnaireId) {
      toast.error("شناسه پرسشنامه معتبر نیست.");
      setStartingAssessmentKey(null);
      return;
    }

    try {
      const response = await apiFetch(`assessment/start/${questionnaireId}`, { method: "POST" });
      if (!response.success || !response.data) throw new Error("خطا در شروع ارزیابی");

      const { sessionId, initialMessage, settings, personaName, nextStage, currentPhase, totalPhases } = response.data;

      sessionStorage.setItem(
        `assessmentState_${questionnaireId}`,
        JSON.stringify({
          sessionId,
          initialMessage,
          settings,
          personaName,
          nextStage,
          currentPhase: currentPhase ?? 1,
          totalPhases: totalPhases ?? 1,
        })
      );

      toast.success("ارزیابی با موفقیت شروع شد!");
      navigate(`/assessment/chat/${questionnaireId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setStartingAssessmentKey(null);
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
      const normalizedStatus =
        assessment.status === "completed"
          ? "completed"
          : assessment.status === "current"
            ? "current"
            : "locked";
      const normalized = {
        ...assessment,
        status: normalizedStatus,
        category: normalizeCategoryName(assessment.category),
      };
      const existing = map.get(key);
      if (!existing || statusPriority[normalizedStatus] >= statusPriority[existing.status]) {
        map.set(key, normalized);
      }
    });

    const ordered = Array.from(map.values()).sort((a, b) => {
      const categoryOrderDiff = getCategoryOrder(a.category) - getCategoryOrder(b.category);
      if (categoryOrderDiff !== 0) return categoryOrderDiff;

      const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;

      if (a.status !== b.status) {
        return (statusPriority[b.status] ?? 0) - (statusPriority[a.status] ?? 0);
      }

      return (a.id ?? 0) - (b.id ?? 0);
    });

    const categoryGroups = new Map<string, Assessment[]>();
    ordered.forEach((assessment) => {
      const category = normalizeCategoryName(assessment.category);
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(assessment);
    });

    const orderedCategories = Array.from(categoryGroups.keys()).sort(
      (categoryA, categoryB) => getCategoryOrder(categoryA) - getCategoryOrder(categoryB)
    );

    const firstIncompleteCategory = orderedCategories.find((category) => {
      const stages = categoryGroups.get(category) ?? [];
      return stages.some((stage) => stage.status !== "completed");
    });

    const lockedOrder =
      typeof firstIncompleteCategory === "string" ? getCategoryOrder(firstIncompleteCategory) : null;

    const gatedAssessments = ordered.map((assessment) => {
      const categoryOrder = getCategoryOrder(assessment.category);
      if (
        lockedOrder !== null &&
        categoryOrder > lockedOrder &&
        assessment.status !== "completed"
      ) {
        return { ...assessment, status: "locked" };
      }
      return assessment;
    });

    const hasCurrent = gatedAssessments.some((assessment) => assessment.status === "current");
    if (hasCurrent) {
      return gatedAssessments;
    }

    const firstAvailableIndex = gatedAssessments.findIndex((assessment) => assessment.status !== "completed");
    if (firstAvailableIndex === -1) {
      return gatedAssessments;
    }

    const promoted = [...gatedAssessments];
    promoted[firstAvailableIndex] = { ...promoted[firstAvailableIndex], status: "current" };
    return promoted;
  }, [assessments]);

  const stageLabels = useMemo(() => {
    const labels = new Map<string, string>();
    dedupedAssessments.forEach((assessment, index) => {
      const key = assessment.stringId || String(assessment.id);
      labels.set(key, formatStageLabel(index));
    });
    return labels;
  }, [dedupedAssessments]);

  const resolveStageLabel = useCallback(
    (assessment: Assessment, fallbackIndex = 0) => {
      const key = assessment.stringId || String(assessment.id);
      const direct = stageLabels.get(key);
      if (direct) return direct;
      const globalIndex = dedupedAssessments.findIndex(
        (item) => (item.stringId || String(item.id)) === key
      );
      if (globalIndex >= 0) {
        return formatStageLabel(globalIndex);
      }
      return formatStageLabel(fallbackIndex);
    },
    [stageLabels, dedupedAssessments]
  );

  const hasCompletedPersonality = useMemo(
    () => personalityResults.some((item) => item.status === "completed"),
    [personalityResults]
  );

  const latestPersonalityResult = useMemo(() => {
    if (!personalityResults.length) return null;
    const copy = [...personalityResults];
    copy.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    return copy[0];
  }, [personalityResults]);

  const mapSteps: AssessmentMapStep[] = useMemo(() => {
    let lastCategory: string | null = null;
    let stageCounter = 0;

    const steps: AssessmentMapStep[] = [];

    dedupedAssessments.forEach((assessment, index) => {
      const category = normalizeCategoryName(assessment.category);
      const accentColor = getCategoryColor(category);
      const key = assessment.stringId || String(assessment.id);

      if (category && category !== lastCategory) {
        steps.push({
          id: `station-${category}`,
          title: category,
          status: "station",
          category,
          accentColor,
          kind: "station",
        });
        lastCategory = category;
      }

      stageCounter += 1;

      steps.push({
        id: key,
        title: resolveStageLabel(assessment, index),
        status: assessment.status,
        category,
        accentColor,
        kind: "stage",
        sequence: stageCounter,
      });
    });

    const personalityCategory = "سایر دسته‌بندی‌ها";
    const personalityAccent = "#0EA5E9";
    const personalitySequence = stageCounter + 1;
    const personalityLabel = formatStageLabel(stageCounter);
    stageCounter = personalitySequence;

    steps.push({
      id: "personality-stage",
      title: personalityLabel,
      description: "مرحله رایگان: آزمون‌های شخصیت بوته",
      status: hasCompletedPersonality ? "completed" : "current",
      category: personalityCategory,
      accentColor: personalityAccent,
      kind: "stage",
      sequence: personalitySequence,
    });

    return steps;
  }, [dedupedAssessments, resolveStageLabel, hasCompletedPersonality]);

  const currentAssessment = dedupedAssessments.find((a) => a.status === "current");
  const currentStageLabel = useMemo(() => {
    if (!currentAssessment) return null;
    return resolveStageLabel(currentAssessment);
  }, [currentAssessment, resolveStageLabel]);
  const totalCount = dedupedAssessments.length;
  const completedCount = dedupedAssessments.filter((a) => a.status === "completed").length;
  const lockedCount = dedupedAssessments.filter((a) => a.status === "locked").length;
  const availableCount = dedupedAssessments.filter((a) => a.status !== "locked").length;
  const remainingCount = Math.max(totalCount - completedCount, 0);
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatNumber = (value: number) => value.toLocaleString("fa-IR");

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
                  {currentAssessment && currentStageLabel
                    ? `${currentStageLabel} آماده آغاز است`
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
                onClick={() => currentAssessment && handleStartAssessment(currentAssessment)}
                disabled={!currentAssessment || !!startingAssessmentKey}
              >
                {startingAssessmentKey === currentAssessment?.stringId ? (
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
            <AssessmentMap
              steps={mapSteps}
              onStepSelect={(step) => {
                if (step.id === "personality-stage") {
                  navigate("/personality");
                  return;
                }
                const selectedAssessment = dedupedAssessments.find(
                  (assessment) => (assessment.stringId || String(assessment.id)) === step.id
                );

                if (!selectedAssessment) return;

                if (selectedAssessment.status === "current") {
                  handleStartAssessment(selectedAssessment);
                } else if (selectedAssessment.status === "completed") {
                  toast.info("این مرحله پیش‌تر تکمیل شده است. نتایج در بخش گزارش‌ها در دسترس است.");
                } else {
                  toast.info("برای دسترسی به این مرحله ابتدا مرحله‌های قبلی را تکمیل کنید.");
                }
              }}
            />
          </div>
        </section>

        <section className="rounded-[32px] border border-cyan-100/80 bg-white/95 p-8 shadow-[0_20px_70px_rgba(14,165,233,0.12)]">
          <div className="flex flex-col gap-3 text-right">
            <div>
              <p className="text-xs font-semibold text-cyan-600">کارنامه آزمون‌های شخصیت</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">مرحله رایگان بوته همیشه در دسترس شماست</h3>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              گفت‌وگوهای شخصیتی برای همه کاربران رایگان است. می‌توانید هر زمان وارد آزمون شوید و گزارش تحلیل‌شده را در کارنامه اختصاصی مشاهده کنید.
            </p>
          </div>
          <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5 text-sm text-slate-700">
            {isPersonalityLoading ? (
              <div className="flex items-center gap-3 text-cyan-600">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                در حال بررسی آخرین نتایج...
              </div>
            ) : latestPersonalityResult ? (
              <div className="space-y-2">
                <p className="text-base font-bold text-slate-900">{latestPersonalityResult.name}</p>
                <p className="text-xs text-slate-500">
                  آخرین به‌روزرسانی: {formatDateTime(latestPersonalityResult.updated_at || latestPersonalityResult.created_at)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 font-semibold text-cyan-700">
                    وضعیت: {latestPersonalityResult.status === "completed" ? "تکمیل شده" : "در حال انجام"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 font-semibold text-cyan-700">
                    گزارش: {latestPersonalityResult.report_name || "نامشخص"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-600">
                هنوز کارنامه‌ای ثبت نشده است. با شروع آزمون‌های شخصیت رایگان، اولین گزارش شما اینجا نمایش داده می‌شود.
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              className="border-cyan-200 text-cyan-700 hover:border-cyan-300 hover:text-cyan-800"
              onClick={() => navigate("/personality/results")}
            >
              مشاهده کارنامه‌ها
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-[0_10px_25px_rgba(14,165,233,0.35)] hover:from-cyan-600 hover:to-sky-600"
              onClick={() => navigate("/personality")}
            >
              ورود به مرحله رایگان
            </Button>
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
