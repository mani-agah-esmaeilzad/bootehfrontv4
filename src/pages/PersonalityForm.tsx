// src/pages/PersonalityForm.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle, ArrowLeft, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  scale: {
    min: number;
    max: number;
    labels: string[];
  };
  questions: FormQuestion[];
};

const PAGE_SIZE = 8;

const SCALE_OPTIONS = [
  { value: 1, label: "کاملاً مخالفم" },
  { value: 2, label: "مخالفم" },
  { value: 3, label: "خنثی" },
  { value: 4, label: "موافقم" },
  { value: 5, label: "کاملاً موافقم" },
];

const PersonalityForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [sessionInfo, setSessionInfo] = useState<StartFormResponse | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const totalQuestions = questions.length;
  const answeredCount = useMemo(() => Object.keys(responses).length, [responses]);
  const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const totalPages = Math.ceil(totalQuestions / PAGE_SIZE) || 1;

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

  const visibleQuestions = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return questions.slice(start, start + PAGE_SIZE);
  }, [questions, pageIndex]);

  const handleSelect = (questionId: number, value: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (pageIndex < totalPages - 1) setPageIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (pageIndex > 0) setPageIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!sessionInfo) return;
    if (answeredCount !== totalQuestions) {
      toast.info("لطفاً به تمام سؤالات پاسخ دهید.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = questions.map((question) => ({
        questionId: question.id,
        value: responses[question.id],
      }));
      const response = await finishPersonalityForm(sessionInfo.sessionId, payload);
      if (!response.success) {
        throw new Error(response.message || "تحلیل آزمون آماده نشد");
      }
      setAnalysis(response.data);
      toast.success("تحلیل آزمون آماده است.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error(error.message || "خطایی رخ داد");
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
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold text-purple-500">آزمون استاندارد</p>
            <h1 className="text-xl font-bold md:text-2xl">{sessionInfo.testName}</h1>
            <p className="text-xs text-slate-500">۶۴ سؤال لیکرتی – نسخه باز OSI</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(`/personality/${slug}`)} className="flex items-center gap-2 text-slate-600">
              <ArrowLeft className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6">
        <Card className="border-purple-100 bg-white shadow-sm">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-purple-500">پیشرفت آزمون</p>
                <h2 className="text-2xl font-bold text-slate-900">{progress}% تکمیل شده</h2>
                <p className="text-sm text-slate-500">
                  {answeredCount} از {totalQuestions} سؤال.
                </p>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 md:max-w-sm">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-sky-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {!analysis && (
              <>
                <div className="space-y-6">
                  {visibleQuestions.map((question, index) => {
                    const value = responses[question.id];
                    return (
                      <div key={question.id} className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-inner">
                        <p className="text-sm font-semibold text-slate-900">
                          سؤال {pageIndex * PAGE_SIZE + index + 1}: {question.text}
                        </p>
                        <RadioGroup
                          className="mt-4 grid gap-3 text-sm"
                          value={value ? String(value) : undefined}
                          onValueChange={(val) => handleSelect(question.id, Number(val))}
                        >
                          {SCALE_OPTIONS.map((option) => (
                            <Label
                              key={option.value}
                              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2 transition ${value === option.value
                                  ? "border-purple-400 bg-purple-50 text-purple-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                            >
                              <RadioGroupItem value={String(option.value)} />
                              {option.label}
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap justify-between gap-3 pt-4">
                  <Button variant="outline" disabled={pageIndex === 0} onClick={handlePrev}>
                    صفحه قبل
                  </Button>
                  {pageIndex < totalPages - 1 ? (
                    <Button onClick={handleNext}>صفحه بعد</Button>
                  ) : (
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-sky-500 text-white"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "ثبت و دریافت نتیجه"}
                    </Button>
                  )}
                </div>
              </>
            )}

            {analysis && (
              <div className="space-y-6">
                <Card className="border-slate-200 bg-white/95 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>نتیجه نهایی</span>
                      <span className="text-3xl font-black text-purple-600">{analysis.mbti}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-7 text-slate-700">
                    <p>{analysis.summary}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {analysis.axes?.map((axis: any) => (
                        <div key={axis.dimension} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <p className="text-xs font-semibold text-slate-500">بعد {axis.dimension}</p>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span>{axis.primary.label}</span>
                            <span className="font-bold text-slate-900">{axis.primary.score}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-sm">
                            <span>{axis.secondary.label}</span>
                            <span className="font-bold text-slate-900">{axis.secondary.score}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            تمایل غالب: {axis.dominantLetter} (اختلاف {axis.delta})
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {analysis.radar && analysis.radar.length > 0 && (
                  <div className="rounded-[32px] border border-slate-200 bg-[#050814] p-6 text-white shadow-lg">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="h-5 w-5 text-cyan-400" />
                      نمودار عنکبوتی ترجیحات شما
                    </h3>
                    <SpiderChart data={analysis.radar} />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => navigate("/personality/results")}>
                    مشاهده تمام کارنامه‌ها
                  </Button>
                  <Button onClick={() => navigate("/dashboard")}>بازگشت به داشبورد</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PersonalityForm;
