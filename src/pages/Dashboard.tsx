// src/pages/Dashboard.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { AssessmentMap, AssessmentMapStep } from "@/components/ui/assessment-map";
import {
  ArrowLeft,
  User,
  LoaderCircle,
  AlertTriangle,
  Sparkles,
  Rocket,
  Trophy,
  Lock,
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
}

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
    return Array.from(map.values());
  }, [assessments]);

  // مراحل برای نقشه مارپیچ
  const mapSteps: AssessmentMapStep[] = dedupedAssessments.map((a) => ({
    id: a.stringId || String(a.id),
    title: a.title,
    description: a.description,
    status: a.status,
  }));

  const currentAssessment = dedupedAssessments.find((a) => a.status === "current");
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
        <LoaderCircle className="animate-spin mx-auto h-12 w-12 text-hrbooteh-primary" />
      );

    if (error)
      return (
        <Card className="border border-red-100 bg-white p-8 text-center text-slate-700 shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-semibold text-slate-900">خطا در دریافت اطلاعات</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Button variant="destructive" className="mt-6" onClick={fetchAssessments}>
            تلاش مجدد
          </Button>
        </Card>
      );

    // اگر همه ارزیابی‌ها تمام شده باشند، پیامی نمایش داده می‌شود
    if (!currentAssessment && dedupedAssessments.length > 0 && dedupedAssessments.every((a) => a.status === "completed")) {
      return (
        <Card className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            مسیر ارزیابی شما با موفقیت به پایان رسید!
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            شما تمام مراحل را تکمیل کرده‌اید. برای مشاهده نتایج می‌توانید به بخش گزارش‌ها مراجعه کنید.
          </p>
          <Button
            variant="secondary"
            className="mt-6 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            onClick={() => navigate('/results')}
          >
            مشاهده نتایج کلی
          </Button>
        </Card>
      );
    }

    const stats = [
      {
        label: "مرحله‌های تکمیل‌شده",
        value: `${formatNumber(completedCount)}${totalCount ? ` از ${formatNumber(totalCount)}` : ""}`,
        icon: Trophy,
      },
      {
        label: "مرحله‌های در دسترس",
        value: formatNumber(availableCount),
        icon: Rocket,
      },
      {
        label: "مرحله‌های قفل",
        value: formatNumber(lockedCount),
        icon: Lock,
      },
      {
        label: "درصد پیشرفت",
        value: `${formatNumber(progressPercent)}٪`,
        icon: Sparkles,
      },
    ];

    return (
      <div className="space-y-12">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-sm">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1 text-sm font-medium text-slate-500">
                <Sparkles className="h-4 w-4 text-amber-500" />
                مسیر ارزیابی شما
              </span>
              <h2 className="mt-6 text-3xl font-bold leading-tight text-slate-900">
                {currentAssessment
                  ? `مرحله «${currentAssessment.title}» منتظر شماست!`
                  : "همه‌چیز برای شروع سفر مهارتی آماده است"}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
                روند ارزیابی شما به شکلی ساده و مرحله‌ای نمایش داده می‌شود. هر بخش را تکمیل کنید تا مرحله بعدی آزاد شود
                و مسیر خود را به آرامی پیش ببرید.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 text-center">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                مراحل باقی‌مانده
              </span>
              <span className="text-4xl font-bold text-slate-900">
                {formatNumber(remainingCount)}
              </span>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => currentAssessment && handleStartAssessment(currentAssessment.id)}
                disabled={!currentAssessment || !!startingAssessmentId}
                className="w-full rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {startingAssessmentId === currentAssessment?.id ? (
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ArrowLeft className="ml-2 h-5 w-5" />
                )}
                {currentAssessment ? "شروع مرحله‌ی بعدی" : "در انتظار آزاد شدن مراحل"}
              </Button>
              {currentAssessment && (
                <p className="text-xs text-slate-500">
                  آماده برای شروع: {currentAssessment.title}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-semibold text-slate-900">{stat.value}</span>
                  </div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </section>

        <Card className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h3 className="mb-4 text-center text-2xl font-bold text-slate-900">
            نقشه‌ی مارپیچ ارزیابی
          </h3>
          <p className="mb-8 text-center text-sm text-slate-500">
            هر حباب نماینده‌ی یک مرحله است. با تکمیل هر مرحله، مرحله‌ی بعدی باز می‌شود و مسیر شما ادامه پیدا می‌کند.
          </p>
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
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Logo variant="large" />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-12 flex flex-col gap-3">
          <h1 className="text-3xl font-bold leading-tight text-slate-900">
            داشبورد ارزیابی
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
            یک نمای ساده و روشن از مراحل ارزیابی شما؛ مسیر را قدم به قدم جلو بروید و هر زمان آماده شدید وارد مرحله
            بعدی شوید.
          </p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
