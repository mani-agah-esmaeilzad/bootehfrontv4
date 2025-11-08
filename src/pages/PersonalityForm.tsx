// src/pages/PersonalityForm.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LoaderCircle, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { startPersonalityForm, finishPersonalityForm } from "@/services/apiService";
import { SpiderChart } from "@/components/ui/SpiderChart";

type FormQuestion = {
  id: number;
  text: string;
  dimension: string;
};

type StartFormResponse = {
  sessionId: string;
  testName: string;
  questionCount: number;
  questions: FormQuestion[];
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const PersonalityForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [sessionInfo, setSessionInfo] = useState<StartFormResponse | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const totalQuestions = questions.length;
  const answeredCount = useMemo(() => Object.keys(responses).length, [responses]);
  const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const init = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const response = await startPersonalityForm(slug);
        if (!response.success) {
          throw new Error(response.message || "آزمون در دسترس نیست");
        }
        setSessionInfo(response.data);
        setQuestions(response.data.questions);
      } catch (error: any) {
        toast.error(error.message || "امکان شروع آزمون وجود ندارد.");
        navigate(`/personality/${slug}`);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [slug, navigate]);

  useEffect(() => {
    if (initialized || !questions.length || !sessionInfo) return;
    setMessages([
      {
        id: "intro",
        role: "assistant",
        content: `سلام! من کوچ شخصیت بوته هستم و الان قرار است نسخه کامل آزمون MBTI (${questions.length} سؤال) را با تو به‌صورت مکالمه‌ای طی کنیم. فقط «گزینه الف» یا «گزینه ب» را انتخاب کن تا مسیر روشن شود.`,
      },
      buildQuestionMessage(questions[0], 0, questions.length),
    ]);
    setInitialized(true);
  }, [questions, sessionInfo, initialized]);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  function buildQuestionMessage(question: FormQuestion, index: number, total: number): ChatMessage {
    return {
      id: `question-${question.id}`,
      role: "assistant",
      content: `سؤال ${index + 1} از ${total}:\n${question.text}`,
    };
  }

  const handleChoice = async (choice: "A" | "B") => {
    if (!currentQuestion || isSubmitting || isThinking || analysis) return;
    const numericValue = choice === "A" ? 1 : 2;
    const nextResponses = { ...responses, [currentQuestion.id]: numericValue };

    setResponses(nextResponses);
    setMessages((prev) => [
      ...prev,
      {
        id: `answer-${currentQuestion.id}`,
        role: "user",
        content: choice === "A" ? "گزینه الف" : "گزینه ب",
      },
    ]);

    if (currentIndex + 1 < totalQuestions) {
      const nextIndex = currentIndex + 1;
      setIsThinking(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, buildQuestionMessage(questions[nextIndex], nextIndex, totalQuestions)]);
        setCurrentIndex(nextIndex);
        setIsThinking(false);
      }, 500);
    } else {
      await submitAnswers(nextResponses);
    }
  };

  const submitAnswers = async (answerMap: Record<number, number>) => {
    if (!sessionInfo || isSubmitting) return;
    setIsSubmitting(true);
    setMessages((prev) => [
      ...prev,
      { id: "summary", role: "assistant", content: "در حال جمع‌بندی پاسخ‌ها و آماده‌سازی گزارش اختصاصی هستم..." },
    ]);
    try {
      const payload = questions.map((question) => ({
        questionId: question.id,
        value: answerMap[question.id],
      }));
      const response = await finishPersonalityForm(sessionInfo.sessionId, payload);
      if (!response.success) {
        throw new Error(response.message || "تحلیل آزمون آماده نشد");
      }
      setAnalysis(response.data);
      toast.success("تحلیل آزمون آماده است.");
    } catch (error: any) {
      toast.error(error.message || "خطا در پردازش نتایج");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !sessionInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
        <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500">در حال آماده‌سازی آزمون...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-cyan-300">گفتگوی ساختارمند MBTI</p>
            <h1 className="text-2xl font-bold text-white">{sessionInfo.testName}</h1>
          </div>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-slate-200 hover:text-white"
            onClick={() => navigate(`/personality/${slug}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6 lg:flex-row">
        <section className="flex-1">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.7)] backdrop-blur">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 text-sm text-slate-200 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-200">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">پیشرفت آزمون</p>
                  <p className="text-lg font-semibold text-white">
                    {answeredCount} / {totalQuestions} پاسخ
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-400">سؤالات استاندارد با وزن‌دهی ۰،۱،۲ برای هر ترجیح</p>
              </div>
            </div>

            <div ref={chatRef} className="mt-6 h-[480px] space-y-4 overflow-y-auto pr-2 text-sm leading-7">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                      msg.role === "assistant"
                        ? "bg-white/10 text-slate-100"
                        : "bg-gradient-to-l from-purple-600 to-cyan-500 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/10 px-4 py-2 text-xs text-slate-200">...</div>
                </div>
              )}
            </div>

            {!analysis && (
              <div className="mt-5 grid gap-3 text-sm text-white md:grid-cols-2">
                <Button
                  disabled={!currentQuestion || isSubmitting || isThinking}
                  className="rounded-2xl border border-white/10 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => handleChoice("A")}
                >
                  گزینه الف
                </Button>
                <Button
                  disabled={!currentQuestion || isSubmitting || isThinking}
                  className="rounded-2xl border border-white/10 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => handleChoice("B")}
                >
                  گزینه ب
                </Button>
              </div>
            )}

            {isSubmitting && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال تحلیل پاسخ‌ها...
              </div>
            )}
          </div>
        </section>

        <section className="w-full lg:w-[360px]">
          {analysis ? (
            <div className="space-y-4">
              <Card className="border-white/10 bg-white/10 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>نتیجه نهایی</span>
                    <span className="text-3xl font-black text-cyan-300">{analysis.mbti}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-slate-100">
                  <p>{analysis.summary}</p>
                  <div className="space-y-3">
                    {analysis.axes?.map((axis: any) => (
                      <div key={axis.dimension} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-slate-400">بعد {axis.dimension}</p>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span>{axis.primary.label}</span>
                          <span className="font-semibold">{axis.primary.score}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-sm">
                          <span>{axis.secondary.label}</span>
                          <span className="font-semibold">{axis.secondary.score}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          تمایل غالب: {axis.dominantLetter} | اختلاف {axis.delta}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {analysis.radar && analysis.radar.length > 0 && (
                <div className="rounded-[28px] border border-white/10 bg-[#050814] p-4 text-white">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    <Sparkles className="h-4 w-4" />
                    نمای ترجیحات
                  </h3>
                  <SpiderChart data={analysis.radar} />
                </div>
              )}

              <div className="flex flex-col gap-3 text-sm">
                <Button variant="outline" className="border-white/20 text-white" onClick={() => navigate("/personality/results")}>
                  مشاهده کارنامه‌ها
                </Button>
                <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => navigate("/dashboard")}>
                  بازگشت به داشبورد
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-slate-200 shadow-[0_15px_60px_rgba(5,8,20,0.6)]">
              <p className="font-semibold text-white">راهنمای گفتگو</p>
              <ul className="mt-3 list-disc space-y-2 pr-4 text-xs text-slate-400">
                <li>گزینه الف / ب را دقیقاً مطابق احساس غالب انتخاب کن.</li>
                <li>اگر بین دو گزینه مردد بودی، گزینه‌ای را انتخاب کن که در محیط کار بیشتر رخ می‌دهد.</li>
                <li>تا پایان گفتگو سؤالات به ترتیب استاندارد جهانی پیش می‌روند.</li>
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PersonalityForm;
