// src/pages/PersonalityChat.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, LoaderCircle, Send } from "lucide-react";
import {
  startPersonalityTest,
  sendPersonalityMessage,
  finishPersonalityTest,
} from "@/services/apiService";
import { toast } from "sonner";
import { AxisDonutChart } from "@/components/ui/AxisDonutChart";
import { SpiderChart } from "@/components/ui/SpiderChart";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  personaName?: string;
}

interface StartResponse {
  sessionId: string;
  personaName: string;
  testName: string;
  initialMessage: string;
  history: ChatMessage[];
}

type MbtiDichotomyKey = "EI" | "SN" | "TF" | "JP";
type MbtiLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

interface MbtiAnalysis {
  type?: string;
  confidence?: number;
  summary?: string;
  strengths?: string[];
  development_tips?: string[];
  dichotomies?: Record<MbtiDichotomyKey, { score?: number; label?: string }>;
}

const MBTI_LETTER_LABELS: Record<MbtiLetter, string> = {
  E: "برونگرایی (E)",
  I: "درونگرایی (I)",
  S: "واقع‌گرایی (S)",
  N: "شهودگرایی (N)",
  T: "تحلیل منطقی (T)",
  F: "تصمیم‌گیری احساسی (F)",
  J: "ساختار و برنامه (J)",
  P: "انعطاف‌پذیری (P)",
};

const MBTI_DIMENSIONS: Array<{
  id: MbtiDichotomyKey;
  title: string;
  letters: [MbtiLetter, MbtiLetter];
}> = [
  { id: "EI", title: "الگوی تعامل اجتماعی", letters: ["E", "I"] },
  { id: "SN", title: "منبع جمع‌آوری اطلاعات", letters: ["S", "N"] },
  { id: "TF", title: "تصمیم‌گیری", letters: ["T", "F"] },
  { id: "JP", title: "سازماندهی و سبک زندگی", letters: ["J", "P"] },
];

const clampScore = (value: number) =>
  Math.max(-100, Math.min(100, Number.isNaN(value) ? 0 : value));
const normalizeToPercent = (value: number) =>
  Math.round(((clampScore(value) + 100) / 200) * 100);

const isMbtiAnalysis = (value: any): value is MbtiAnalysis => {
  if (!value || typeof value !== "object") return false;
  return (
    typeof value.dichotomies === "object" &&
    MBTI_DIMENSIONS.some(({ id }) => value.dichotomies?.[id])
  );
};

const PersonalityChat = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [sessionInfo, setSessionInfo] = useState<StartResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!slug) return;
      try {
        const response = await startPersonalityTest(slug);
        if (!response.success) {
          throw new Error(response.message || "آزمون در دسترس نیست");
        }
        const data: StartResponse = response.data;
        setSessionInfo(data);
       setMessages(
          (data.history ?? []).map((item, index) => ({
            id: `${index}-${Date.now()}`,
            role: item.role,
            content: item.content,
            personaName: item.role === "assistant" ? data.personaName : "شما",
          }))
        );
        sessionStorage.setItem(
          `personality_session_${slug}`,
          JSON.stringify({ sessionId: data.sessionId, personaName: data.personaName, testName: data.testName })
        );
      } catch (error: any) {
        toast.error(error.message || "امکان شروع آزمون وجود ندارد.");
        navigate(`/personality/${slug}`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [slug, navigate]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!sessionInfo || !inputValue.trim() || isSending || analysis) return;
    const text = inputValue.trim();
    setInputValue("");

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: text,
      personaName: "شما",
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await sendPersonalityMessage(sessionInfo.sessionId, text);
      if (!response.success) {
        throw new Error(response.message || "پاسخ از سرور دریافت نشد");
      }
   const reply: ChatMessage = {
      id: `${Date.now()}-ai`,
      role: "assistant",
      content: response.data.reply,
      personaName: response.data.personaName ?? sessionInfo.personaName,
    };
      setMessages((prev) => [...prev, reply]);
    } catch (error: any) {
      toast.error(error.message || "ارسال پیام با خطا مواجه شد");
    } finally {
      setIsSending(false);
    }
  };

  const handleFinish = async () => {
    if (!sessionInfo || analysis) return;
    setIsFinishing(true);
    try {
      const response = await finishPersonalityTest(sessionInfo.sessionId);
      if (!response.success) {
        throw new Error(response.message || "تحلیل گفتگو با خطا مواجه شد");
      }
      setAnalysis(response.data);
      toast.success("تحلیل آزمون آماده شد.");
    } catch (error: any) {
      toast.error(error.message || "خطا در پایان آزمون");
    } finally {
      setIsFinishing(false);
    }
  };

  const goBack = () => {
    navigate(`/personality/${slug}`);
  };

  const isMbtiReport = slug === "mbti" && isMbtiAnalysis(analysis);
  const mbtiAnalysis: MbtiAnalysis | null = isMbtiReport
    ? (analysis as MbtiAnalysis)
    : null;

  const mbtiAxes = mbtiAnalysis
    ? MBTI_DIMENSIONS.map(({ id, letters, title }) => {
        const axisData = mbtiAnalysis.dichotomies?.[id] || {};
        const rawScore = normalizeToPercent(Number(axisData.score ?? 0));
        const primaryLetter = letters[0];
        const secondaryLetter = letters[1];
        const primaryScore = rawScore;
        const secondaryScore = 100 - primaryScore;
        return {
          dimension: id,
          title,
          primary: {
            letter: primaryLetter,
            label: MBTI_LETTER_LABELS[primaryLetter],
            score: primaryScore,
          },
          secondary: {
            letter: secondaryLetter,
            label: MBTI_LETTER_LABELS[secondaryLetter],
            score: secondaryScore,
          },
          dominantLetter:
            primaryScore >= secondaryScore ? primaryLetter : secondaryLetter,
          delta: Math.abs(primaryScore - secondaryScore),
          interpretation:
            typeof axisData.label === "string" ? axisData.label : null,
        };
      })
    : [];

  const mbtiSpiderData =
    mbtiAxes.length > 0
      ? mbtiAxes.flatMap((axis) => [
          {
            subject: axis.primary.label,
            score: axis.primary.score,
            fullMark: 100,
          },
          {
            subject: axis.secondary.label,
            score: axis.secondary.score,
            fullMark: 100,
          },
        ])
      : [];

  const renderDefaultAnalysis = () => {
    if (!analysis) return null;
    const keys = Object.keys(analysis);
    return (
      <Card className="mt-6 border-purple-200 bg-white shadow-sm">
        <CardContent className="space-y-4 p-6 text-right">
          <h3 className="text-xl font-semibold text-slate-900">گزارش تحلیلی</h3>
          <div className="space-y-3 text-sm leading-7 text-slate-700">
            {keys.map((key) => (
              <div key={key}>
                <p className="font-semibold text-purple-700">{key}</p>
                <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                  {JSON.stringify(analysis[key], null, 2)}
                </pre>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/personality/results")}
            >
              مشاهده همه گزارش‌ها
            </Button>
            <Button onClick={goBack}>بازگشت</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMbtiAnalysis = () => {
    if (!mbtiAnalysis) return null;
    const strengths = Array.isArray(mbtiAnalysis.strengths)
      ? mbtiAnalysis.strengths.filter(Boolean)
      : [];
    const growthAreas = Array.isArray(mbtiAnalysis.development_tips)
      ? mbtiAnalysis.development_tips.filter(Boolean)
      : [];

    return (
      <div className="mt-6 space-y-5 text-right">
        <Card className="border-purple-200 bg-white shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-purple-600">
                  تیپ نهایی شما
                </p>
                <p className="text-4xl font-black text-slate-900">
                  {mbtiAnalysis.type ?? "نامشخص"}
                </p>
              </div>
              {typeof mbtiAnalysis.confidence === "number" && (
                <div className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
                  اعتماد به تحلیل: {Math.round(mbtiAnalysis.confidence)}%
                </div>
              )}
            </div>
            {mbtiAnalysis.summary && (
              <p className="text-sm leading-7 text-slate-700">
                {mbtiAnalysis.summary}
              </p>
            )}
          </CardContent>
        </Card>

        {mbtiSpiderData.length > 0 && (
          <Card className="border-purple-200 bg-white shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold text-slate-900">
                نمودار کلی ترجیحات
              </CardTitle>
              <p className="text-xs text-slate-500">
                این نمودار شدت هر ترجیح در چهار بعد اصلی MBTI را نمایش می‌دهد.
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mx-auto w-full max-w-2xl">
                <SpiderChart data={mbtiSpiderData} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {mbtiAxes.map((axis) => (
            <Card
              key={axis.dimension}
              className="border-purple-200/70 bg-white shadow-sm"
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      بعد {axis.dimension}
                    </p>
                    <p className="text-xs text-slate-500">{axis.title}</p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">
                    تمایل غالب: {axis.dominantLetter}
                  </span>
                </div>
                <AxisDonutChart axis={axis} />
                {axis.interpretation && (
                  <p className="text-xs leading-6 text-slate-600">
                    {axis.interpretation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(strengths.length > 0 || growthAreas.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {strengths.length > 0 && (
              <Card className="border-green-100 bg-white">
                <CardHeader>
                  <CardTitle className="text-base text-green-800">
                    نقاط قوت برجسته
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-6 text-slate-700">
                  <ul className="list-disc space-y-1 pr-4 text-xs text-slate-600">
                    {strengths.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {growthAreas.length > 0 && (
              <Card className="border-amber-100 bg-white">
                <CardHeader>
                  <CardTitle className="text-base text-amber-800">
                    مسیرهای رشد پیشنهادی
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-6 text-slate-700">
                  <ul className="list-disc space-y-1 pr-4 text-xs text-slate-600">
                    {growthAreas.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/personality/results")}>
            مشاهده همه گزارش‌ها
          </Button>
          <Button onClick={goBack}>بازگشت</Button>
        </div>
      </div>
    );
  };

  const renderAnalysis = () => {
    if (!analysis) return null;
    if (isMbtiReport) {
      return renderMbtiAnalysis();
    }
    return renderDefaultAnalysis();
  };

  if (loading || !sessionInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500">در حال آماده‌سازی آزمون...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold text-slate-500">گفتگوی فعال</p>
            <h1 className="text-xl font-semibold text-slate-900">
              {sessionInfo.personaName}
            </h1>
            <p className="text-xs text-slate-500">
              فضای تمرینی اختصاصی کوچ شخصیت بوته
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleFinish}
              disabled={isFinishing || analysis}
              className="flex items-center gap-2"
            >
              {isFinishing && <Loader2 className="h-4 w-4 animate-spin" />}
              پایان و دریافت گزارش
            </Button>
            <Button variant="ghost" onClick={goBack} className="flex items-center gap-2 text-slate-600">
              <ArrowLeft className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl flex-col px-4 py-6 md:px-6">
        <div className="flex-1 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
          <div ref={scrollRef} className="h-full space-y-4 overflow-y-auto p-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                    msg.role === "user"
                      ? "bg-purple-50 text-slate-800"
                      : "bg-purple-600 text-white"
                  }`}
                >
                  {msg.personaName && (
                    <p className="mb-1 text-xs font-semibold opacity-80">{msg.personaName}</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-end">
                <div className="rounded-2xl bg-purple-600/80 px-4 py-2 text-xs text-white">
                  در حال پاسخ‌گویی...
                </div>
              </div>
            )}
          </div>
        </div>

        {!analysis && (
          <div className="mt-4 flex items-center gap-3">
            <Input
              placeholder="پیام خود را بنویسید..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isSending}
            />
            <Button onClick={handleSend} disabled={isSending || inputValue.trim().length === 0}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {renderAnalysis()}
      </main>
    </div>
  );
};

export default PersonalityChat;
