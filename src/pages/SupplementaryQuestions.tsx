// src/pages/SupplementaryQuestions.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { LoaderCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import ResultsModal from "@/components/modals/ResultsModal";

type SupplementaryAnswers = Record<"q1" | "q2", string>;

interface SupplementaryQuestionsData {
  supplementary_question_1: string;
  supplementary_question_2: string;
}

const CARD_PRESETS: Array<{
  key: "q1" | "q2";
  label: string;
  gradient: string;
  glow: string;
}> = [
  {
    key: "q1",
    label: "رازآموزی اول",
    gradient: "from-[#5236ff]/85 via-[#8b5cf6]/75 to-[#22d3ee]/65",
    glow: "shadow-[0_40px_130px_-50px_rgba(139,92,246,0.6)]",
  },
  {
    key: "q2",
    label: "رازآموزی دوم",
    gradient: "from-[#f97316]/75 via-[#ec4899]/70 to-[#6366f1]/65",
    glow: "shadow-[0_40px_130px_-50px_rgba(236,72,153,0.55)]",
  },
];

const SupplementaryQuestions = () => {
  const { id: questionnaireId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<SupplementaryQuestionsData | null>(null);
  const [answers, setAnswers] = useState<SupplementaryAnswers>({ q1: "", q2: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nextStage, setNextStage] = useState<{ type?: string; slug?: string | null } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [finalAssessmentId, setFinalAssessmentId] = useState<number | null>(null);

  useEffect(() => {
    if (!questionnaireId) {
      toast.error("شناسه ارزیابی نامعتبر است.");
      navigate("/dashboard");
      return;
    }

    const storedStateRaw = sessionStorage.getItem(`assessmentState_${questionnaireId}`);
    if (!storedStateRaw) {
      toast.error("جلسه ارزیابی منقضی شده است.");
      navigate("/dashboard");
      return;
    }

    const storedState = JSON.parse(storedStateRaw);
    setSessionId(storedState.sessionId);
    setNextStage(storedState.nextStage ?? null);

    const fetchQuestions = async () => {
      try {
        const response = await apiFetch(`assessment/supplementary/${questionnaireId}`, {
          method: "POST",
          body: JSON.stringify({ session_id: storedState.sessionId }),
        });

        if (response.success && response.data) {
          setQuestions(response.data);
        } else {
          throw new Error(response.message || "سوالات تکمیلی یافت نشدند.");
        }
      } catch (error: any) {
        toast.error(error.message);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [questionnaireId, navigate]);

  const handleSubmit = async () => {
    if (!questionnaireId || !sessionId || isSubmitting) return;
    if (!answers.q1.trim() || !answers.q2.trim()) {
      toast.info("پاسخ هر دو رازآموزی را بنویس سپس ادامه بده.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`assessment/finish/${questionnaireId}`, {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          supplementary_answers: answers,
        }),
      });

      if (response.success && response.data?.assessmentId) {
        setFinalAssessmentId(response.data.assessmentId);
        toast.success("پاسخ‌ها ثبت شد. تحلیل نهایی در حال آماده‌سازی است...");
        setIsModalOpen(true);
      } else {
        throw new Error(response.message || "خطا در نهایی‌سازی ارزیابی");
      }
    } catch (error: any) {
      toast.error(`خطا در ارسال پاسخ‌ها: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    sessionStorage.removeItem(`assessmentState_${questionnaireId}`);
    if (nextStage?.type === "mystery" && nextStage.slug) {
      navigate(`/mystery/${nextStage.slug}`);
    } else {
      navigate("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div
        dir="rtl"
        className="flex h-screen items-center justify-center bg-slate-950 text-white"
      >
        <LoaderCircle className="h-12 w-12 animate-spin text-white/80" />
      </div>
    );
  }

  const cards = CARD_PRESETS.map((preset) => ({
    ...preset,
    question:
      preset.key === "q1"
        ? questions?.supplementary_question_1
        : questions?.supplementary_question_2,
    value: answers[preset.key],
  })).filter((card) => Boolean(card.question));

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 md:px-8">
        <header className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-right">
              <p className="text-xs font-semibold text-purple-200/70">رازآموزی تکمیلی</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">دو کارت آخر برای کشف دقیق‌تر</h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-white/70 md:text-base">
                این دو کارت برای تعمیق تحلیل ارزیابی طراحی شده‌اند. هر کارت را با تمرکز بخوان و
                پاسخ شخصی خودت را بنویس؛ پاسخ‌ها مستقیم به گزارش نهایی اضافه می‌شوند.
              </p>
            </div>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white"
              onClick={() => navigate("/dashboard")}
            >
              بازگشت به داشبورد
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm leading-7 text-white/70 backdrop-blur">
            هر پاسخ را با مثال یا موقعیت واقعی پشتیبانی کن. جزئیات رفتاری، تصمیم‌گیری و نتیجه‌ای
            که انتظار داشتی را توضیح بده تا هوش مصنوعی بتواند تحلیل کامل‌تری ارائه دهد.
          </div>
        </header>

        <main className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-2">
            {cards.map((card) => (
              <AspectRatio
                key={card.key}
                ratio={3 / 4}
                className={`relative overflow-hidden rounded-[32px] border border-white/10 ${card.glow}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_65%)] opacity-80" />
                <div className="absolute inset-0 opacity-70 mix-blend-soft-light" />
                <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-2 self-end rounded-full bg-white/15 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-white/80">
                      {card.label}
                    </span>
                    <p className="text-lg font-semibold leading-8 text-white md:text-xl">
                      {card.question}
                    </p>
                  </div>
                  <Textarea
                    rows={5}
                    spellCheck={false}
                    value={card.value}
                    onChange={(event) =>
                      setAnswers((prev) => ({ ...prev, [card.key]: event.target.value }))
                    }
                    className="min-h-[140px] resize-none rounded-3xl border border-white/20 bg-white/15 text-sm text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/70"
                    placeholder="پاسخ خود را اینجا ثبت کن..."
                  />
                </div>
              </AspectRatio>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-purple-500 py-4 text-base font-semibold text-white transition hover:bg-purple-600 disabled:opacity-70"
          >
            {isSubmitting && <LoaderCircle className="h-5 w-5 animate-spin text-white" />}
            {isSubmitting ? "در حال ارسال پاسخ‌ها..." : "ثبت پاسخ‌ها و مشاهده تحلیل نهایی"}
          </Button>
        </main>
      </div>

      <ResultsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        assessmentId={finalAssessmentId}
      />
    </div>
  );
};

export default SupplementaryQuestions;
