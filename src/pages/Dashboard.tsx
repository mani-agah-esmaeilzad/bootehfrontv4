// src/pages/Dashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { ProgressTimeline, TimelineStep } from "@/components/ui/progress-timeline";
import { ArrowLeft, User, LoaderCircle, AlertTriangle } from "lucide-react";
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

  // Steps برای Timeline
  const timelineSteps: TimelineStep[] = assessments.map((a) => ({
    id: a.stringId || String(a.id),
    title: a.title,
    description: a.description,
    status: a.status, // از status به‌روز شده استفاده می‌کند
  }));

  // *** تغییر اصلی اینجا اعمال شد ***
  // به جای "pending" به دنبال "current" می‌گردد
  const currentAssessment = assessments.find((a) => a.status === "current");

  // رندر محتوا
  const renderContent = () => {
    if (isLoading)
      return (
        <LoaderCircle className="animate-spin mx-auto h-12 w-12 text-hrbooteh-primary" />
      );

    if (error)
      return (
        <div className="text-center p-10 bg-destructive/10 rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-destructive font-semibold">خطا در دریافت اطلاعات</p>
          <p className="text-hrbooteh-text-secondary mt-2">{error}</p>
          <Button
            variant="destructive"
            className="mt-4"
            onClick={fetchAssessments}
          >
            تلاش مجدد
          </Button>
        </div>
      );

    // اگر همه ارزیابی‌ها تمام شده باشند، پیامی نمایش داده می‌شود
    if (!currentAssessment && assessments.length > 0 && assessments.every(a => a.status === 'completed')) {
      return (
        <Card className="p-8 shadow-hrbooteh-lg border-0 bg-hrbooteh-surface mb-8 text-center">
          <h2 className="text-xl font-semibold text-hrbooteh-text-primary mb-4">
            مسیر ارزیابی شما با موفقیت به پایان رسید!
          </h2>
          <p className="text-hrbooteh-text-secondary">
            شما تمام مراحل را تکمیل کرده‌اید. برای مشاهده نتایج می‌توانید به بخش گزارش‌ها مراجعه کنید.
          </p>
          <Button className="mt-6" onClick={() => navigate('/results')}>
            مشاهده نتایج کلی
          </Button>
        </Card>
      )
    }

    return (
      <>
        <Card className="p-8 shadow-hrbooteh-lg border-0 bg-hrbooteh-surface mb-8">
          <h2 className="text-xl font-semibold text-hrbooteh-text-primary mb-6 text-center">
            وضعیت پیشرفت شما
          </h2>
          <ProgressTimeline steps={timelineSteps} />
        </Card>

        {currentAssessment && (
          <div className="text-center">
            <Button
              variant="hrbooteh-gradient"
              size="xl"
              onClick={() => handleStartAssessment(currentAssessment.id)}
              disabled={!!startingAssessmentId}
              className="min-w-[300px] group"
            >
              {startingAssessmentId === currentAssessment.id ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowLeft className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              )}
              {startingAssessmentId === currentAssessment.id
                ? "در حال شروع..."
                : "شروع ارزیابی بعدی"}
            </Button>
            <p className="text-hrbooteh-text-secondary mt-4">
              آماده برای شروع: {currentAssessment.title}
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-hrbooteh-gradient-subtle">
      <header className="sticky top-0 bg-hrbooteh-surface/85 backdrop-blur-md border-b border-hrbooteh-surface-elevated z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo variant="large" />
          <Button variant="hrbooteh-ghost" size="icon-md">
            <User className="size-6" />
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-hrbooteh-text-primary mb-4">
            مسیر ارزیابی شما
          </h1>
          <p className="text-hrbooteh-text-secondary text-md">
            شما در حال طی کردن یک مسیر جامع ارزیابی مهارت‌های حرفه‌ای هستید
          </p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
