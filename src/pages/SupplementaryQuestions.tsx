// src/pages/SupplementaryQuestions.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, ArrowRight, Mic } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import ResultsModal from "@/components/modals/ResultsModal";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type SupplementaryAnswers = Record<"q1" | "q2", string>;

interface SupplementaryQuestionsData {
  supplementary_question_1: string;
  supplementary_question_2: string;
}

interface StoredAssessmentState {
  sessionId: string;
  initialMessage?: string;
  settings?: any;
  personaName?: string;
  userGender?: string | null;
  nextStage?: {
    type: string;
    slug?: string | null;
  } | null;
  currentPhase?: number;
  totalPhases?: number;
}

const SupplementaryPromptImage = ({ text }: { text: string }) => (
  <div className="relative w-full select-none">
    <img
      src="/linkedin.jpeg"
      alt=""
      className="pointer-events-none h-auto w-full drop-shadow-[0_28px_52px_rgba(15,23,42,0.35)]"
      draggable={false}
    />
    <div className="absolute inset-x-[12%] top-[18%] bottom-[20%] flex items-center justify-center px-3 text-right md:inset-x-[13%] md:top-[16%] md:bottom-[18%]">
      <p className="whitespace-pre-wrap text-[0.95rem] font-semibold leading-8 text-slate-800 drop-shadow-[0_1px_3px_rgba(255,255,255,0.7)] md:text-[1.05rem] md:leading-9">
        {text}
      </p>
    </div>
  </div>
);

const CARD_PRESETS: Array<{
  key: "q1" | "q2";
  label: string;
}> = [
  {
    key: "q1",
    label: "سوال تکمیلی اول",
  },
  {
    key: "q2",
    label: "سوال تکمیلی دوم",
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [finalAssessmentId, setFinalAssessmentId] = useState<number | null>(null);
  const [activeRecordingKey, setActiveRecordingKey] = useState<"q1" | "q2" | null>(null);
  const [phaseInfo, setPhaseInfo] = useState<{ current: number; total: number }>({ current: 1, total: 1 });
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const baseStateRef = useRef<StoredAssessmentState | null>(null);

  const activeRecordingKeyRef = useRef<"q1" | "q2" | null>(null);
  const micWarningShownRef = useRef(false);

  const {
    isSupported: isSpeechSupported,
    isRecording,
    start: startSpeechRecording,
    stop: stopSpeechRecording,
    restart: restartSpeechRecording,
  } = useSpeechRecognition({
    onFinalResult: (transcript) => {
      const targetKey = activeRecordingKeyRef.current;
      if (!targetKey) return;
      const trimmed = transcript.trim();
      if (!trimmed) return;
      setAnswers((prev) => {
        const current = prev[targetKey] ?? "";
        const needsSpace = current.length > 0 && !current.endsWith(" ");
        return {
          ...prev,
          [targetKey]: `${current}${needsSpace ? " " : ""}${trimmed}`,
        };
      });
    },
  });

  const setRecordingTarget = (target: "q1" | "q2" | null) => {
    activeRecordingKeyRef.current = target;
    setActiveRecordingKey(target);
  };

  const warnMicUnavailableOnce = () => {
    if (micWarningShownRef.current) return;
    toast.error("مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.");
    micWarningShownRef.current = true;
  };

  const handleToggleVoice = (target: "q1" | "q2") => {
    if (!isSpeechSupported) {
      warnMicUnavailableOnce();
      return;
    }

    if (activeRecordingKeyRef.current === target && isRecording) {
      stopSpeechRecording();
      setRecordingTarget(null);
      return;
    }

    setRecordingTarget(target);

    if (isRecording) {
      restartSpeechRecording();
    } else {
      startSpeechRecording();
    }
  };

  useEffect(() => {
    activeRecordingKeyRef.current = activeRecordingKey;
  }, [activeRecordingKey]);

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

    const storedState: StoredAssessmentState = JSON.parse(storedStateRaw);
    baseStateRef.current = storedState;
    setSessionId(storedState.sessionId);
    setPhaseInfo({
      current: storedState.currentPhase ?? 1,
      total: storedState.totalPhases ?? 1,
    });

    const fetchQuestions = async () => {
      try {
        const response = await apiFetch(`assessment/supplementary/${questionnaireId}`, {
          method: "POST",
          body: JSON.stringify({ session_id: storedState.sessionId }),
        });

        if (response.success && response.data) {
          setQuestions(response.data);
          setActiveCardIndex(0);
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

  const persistAssessmentState = (updates: Partial<StoredAssessmentState>) => {
    if (!questionnaireId) return;
    const nextState: StoredAssessmentState = {
      ...(baseStateRef.current || ({} as StoredAssessmentState)),
      ...updates,
    };
    baseStateRef.current = nextState;
    sessionStorage.setItem(`assessmentState_${questionnaireId}`, JSON.stringify(nextState));
    setPhaseInfo({
      current: nextState.currentPhase ?? 1,
      total: nextState.totalPhases ?? 1,
    });
  };

  const handleSubmit = async () => {
    if (!questionnaireId || !sessionId || isSubmitting) return;
    if (!answers.q1.trim() || !answers.q2.trim()) {
      toast.info("پاسخ هر دو سوال تکمیلی را بنویس سپس ادامه بده.");
      return;
    }

    setIsSubmitting(true);
    try {
      stopSpeechRecording();
      setRecordingTarget(null);
      const response = await apiFetch(`assessment/finish/${questionnaireId}`, {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          supplementary_answers: answers,
        }),
      });

      if (response.success && response.data) {
        if (response.data.nextPhase) {
          const nextPhase = response.data.nextPhase;
          persistAssessmentState({
            sessionId: nextPhase.sessionId,
            personaName: nextPhase.personaName ?? baseStateRef.current?.personaName,
            initialMessage: nextPhase.initialMessage ?? baseStateRef.current?.initialMessage,
            currentPhase: nextPhase.index ?? (baseStateRef.current?.currentPhase ?? 1) + 1,
            totalPhases: nextPhase.total ?? baseStateRef.current?.totalPhases ?? nextPhase.index ?? 1,
          });
          setSessionId(nextPhase.sessionId);
          setAnswers({ q1: "", q2: "" });
          toast.success(`مرحله ${nextPhase.index} آماده شد. در حال بازگشت به گفت‌وگو...`);
          navigate(`/assessment/chat/${questionnaireId}`, { replace: true });
          return;
        }

        if (response.data.assessmentId) {
          setFinalAssessmentId(response.data.assessmentId);
          toast.success("پاسخ‌ها ثبت شد. تحلیل نهایی در حال آماده‌سازی است...");
          setIsModalOpen(true);
          return;
        }
      } else {
        throw new Error(response.message || "خطا در نهایی‌سازی ارزیابی");
      }

      throw new Error("پاسخ نامعتبر از سرور دریافت شد.");
    } catch (error: any) {
      toast.error(`خطا در ارسال پاسخ‌ها: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    stopSpeechRecording();
    setRecordingTarget(null);
    sessionStorage.removeItem(`assessmentState_${questionnaireId}`);
    baseStateRef.current = null;
    navigate("/dashboard");
  };

  const cards = useMemo(
    () =>
      CARD_PRESETS.map((preset) => {
        const question =
          preset.key === "q1"
            ? questions?.supplementary_question_1?.trim()
            : questions?.supplementary_question_2?.trim();
        if (!question) {
          return null;
        }
        return {
          ...preset,
          question,
          value: answers[preset.key],
        };
      }).filter(
        (card): card is { key: "q1" | "q2"; label: string; question: string; value: string } =>
          Boolean(card)
      ),
    [questions, answers]
  );

  useEffect(() => {
    if (cards.length === 0) {
      setActiveCardIndex(0);
      return;
    }
    if (activeCardIndex >= cards.length) {
      setActiveCardIndex(cards.length - 1);
    }
  }, [cards.length, activeCardIndex]);

  const activeCard = cards[activeCardIndex] ?? null;
  const isFirstCard = activeCardIndex === 0;
  const isLastCard = activeCardIndex === cards.length - 1 && cards.length > 0;
  const canSubmit = cards.length > 0 && cards.every((card) => answers[card.key].trim().length > 0);

  const goToCard = (index: number) => {
    if (index < 0 || index >= cards.length) return;
    if (isRecording) {
      stopSpeechRecording();
    }
    setRecordingTarget(null);
    setActiveCardIndex(index);
  };

  const handleNextCard = () => {
    if (!activeCard) return;
    if (!answers[activeCard.key].trim()) {
      toast.info("پیش از رفتن به سوال بعدی، پاسخ همین سوال را کامل کن.");
      return;
    }
    goToCard(activeCardIndex + 1);
  };

  const handlePrevCard = () => {
    if (isFirstCard) return;
    goToCard(activeCardIndex - 1);
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

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 md:px-8">
        <header className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-right">
              <p className="text-xs font-semibold text-purple-200/70">سوالات تکمیلی</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                دو تصویر آخر برای تکمیل تحلیل
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-white/70 md:text-base">
                متن هر سوال روی تصویر نمایش داده شده است. پس از مرور دقیق، پاسخ شخصی خودت را
                در کادر پایین بنویس تا مستقیماً به جمع‌بندی گزارش اضافه شود.
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
          {phaseInfo.total > 1 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 shadow-inner shadow-white/10 backdrop-blur">
              <span className="font-semibold text-white">
                مرحله {phaseInfo.current} از {phaseInfo.total}
              </span>
              <span className="mr-3 text-white/60">
                در حال پاسخ به سوالات تکمیلی این مرحله
              </span>
            </div>
          )}
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm leading-7 text-white/70 backdrop-blur">
            هر پاسخ را با مثال یا موقعیت واقعی پشتیبانی کن. جزئیات رفتاری، تصمیم‌گیری و نتیجه‌ای
            که انتظار داشتی را توضیح بده تا هوش مصنوعی بتواند تحلیل کامل‌تری ارائه دهد.
          </div>
        </header>

        <main className="space-y-10">
          {activeCard ? (
            <>
              <div className="space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 self-end rounded-full bg-white/15 px-4 py-2 text-[0.7rem] font-semibold tracking-wide text-white/85">
                    {activeCard.label}
                  </span>
                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white">
                    <SupplementaryPromptImage text={activeCard.question} />
                  </div>
                </div>
                <div className="relative">
                  <Textarea
                    dir="rtl"
                    rows={5}
                    spellCheck={false}
                    value={activeCard.value}
                    onChange={(event) =>
                      setAnswers((prev) => ({ ...prev, [activeCard.key]: event.target.value }))
                    }
                    className="min-h-[140px] resize-none rounded-3xl border border-white/20 bg-white/15 pr-6 text-sm text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/70"
                    placeholder="پاسخ خود را اینجا بنویس..."
                  />
                  <Button
                    type="button"
                    size="icon"
                    aria-label="ضبط صدا"
                    onClick={() => handleToggleVoice(activeCard.key)}
                    className={cn(
                      "absolute bottom-4 left-4 h-11 w-11 rounded-full border border-white/25 bg-white/15 text-white transition hover:bg-white/25",
                      activeRecordingKey === activeCard.key && isRecording
                        ? "border-purple-300 bg-purple-500/70 text-white shadow-[0_10px_30px_-12px_rgba(168,85,247,0.8)]"
                        : "shadow-sm",
                      !isSpeechSupported && "cursor-not-allowed opacity-60 hover:bg-white/15"
                    )}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                {activeRecordingKey === activeCard.key && isRecording && (
                  <p className="text-[0.7rem] font-medium text-purple-200/90">
                    در حال ضبط صدا هستیم؛ پس از پایان جمله کمی مکث کن تا متن اضافه شود.
                  </p>
                )}
              </div>

              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/80 backdrop-blur">
                <div className="flex flex-col gap-2 text-white/70 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    سوال {activeCardIndex + 1} از {cards.length}
                  </span>
                  <span>
                    {isLastCard
                      ? "پس از تکمیل این پاسخ، دکمه ثبت را بزن."
                      : "پاسخ را بنویس و سپس به سوال بعدی برو."}
                  </span>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevCard}
                      disabled={isFirstCard}
                      className="rounded-2xl border-white/25 bg-transparent text-white hover:bg-white/10 disabled:border-white/15 disabled:bg-transparent disabled:text-white/35 disabled:opacity-100 disabled:cursor-not-allowed"
                    >
                      سوال قبلی
                    </Button>
                  </div>
                  <Button
                    onClick={isLastCard ? handleSubmit : handleNextCard}
                    disabled={
                      isLastCard
                        ? isSubmitting || !canSubmit
                        : !answers[activeCard.key].trim()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-3xl bg-purple-500 px-8 py-4 text-base font-semibold text-white transition hover:bg-purple-600 disabled:opacity-70 md:w-auto"
                  >
                    {isLastCard && isSubmitting && (
                      <LoaderCircle className="h-5 w-5 animate-spin text-white" />
                    )}
                    {isLastCard
                      ? isSubmitting
                        ? "در حال ارسال پاسخ‌ها..."
                        : "ثبت پاسخ‌ها و مشاهده تحلیل نهایی"
                      : "عکس بعدی"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-white/70">
              سوالی برای نمایش موجود نیست. لطفاً به داشبورد برگرد و دوباره تلاش کن.
            </div>
          )}
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
