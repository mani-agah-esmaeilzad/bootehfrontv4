// src/pages/PersonalityChat.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, LoaderCircle, Send } from "lucide-react";
import {
  startPersonalityTest,
  sendPersonalityMessage,
  finishPersonalityTest,
} from "@/services/apiService";
import { toast } from "sonner";

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

const PersonalityChat = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [sessionInfo, setSessionInfo] = useState<StartResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
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

  const renderAnalysis = () => {
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
                <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(analysis[key], null, 2)}</pre>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/personality/results")}>مشاهده همه گزارش‌ها</Button>
            <Button onClick={goBack}>بازگشت</Button>
          </div>
        </CardContent>
      </Card>
    );
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
            <h1 className="text-xl font-semibold text-slate-900">{sessionInfo.testName}</h1>
            <p className="text-xs text-slate-500">گفتگو با {sessionInfo.personaName}</p>
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
