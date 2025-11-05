// src/pages/MysteryChat.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderCircle, Loader2, ArrowLeft, Send } from "lucide-react";
import {
  startMysteryTest,
  sendMysteryMessage,
  finishMysteryTest,
} from "@/services/apiService";
import type { MysteryChatHistoryItem, MysteryStartResponse, MysteryAnalysis } from "@/types/mystery";
import { toast } from "sonner";

interface ChatMessage extends MysteryChatHistoryItem {
  id: string;
  speaker: string;
}

const MysteryChat = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [sessionInfo, setSessionInfo] = useState<MysteryStartResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [analysis, setAnalysis] = useState<MysteryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const persistAnalysis = (analysisData: MysteryAnalysis) => {
    if (!sessionInfo) return;
    try {
      const payload = {
        analysis: analysisData,
        testName: sessionInfo.testName,
        guideName: sessionInfo.guideName,
      };
      sessionStorage.setItem(
        `mystery_result_${sessionInfo.sessionId}`,
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error("Failed to persist mystery analysis:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await startMysteryTest(slug);
        if (!response.success) {
          throw new Error(response.message || "امکان شروع رازمایی وجود ندارد.");
        }
        const data: MysteryStartResponse = response.data;
        setSessionInfo(data);

        const initialMessages = (data.history ?? []).map((item, index) => ({
          id: `${index}-${Date.now()}`,
          role: item.role,
          content: item.content,
          speaker: item.role === "assistant" ? data.guideName : "شما",
        }));
        setMessages(initialMessages);

        sessionStorage.setItem(
          `mystery_session_${slug}`,
          JSON.stringify({ sessionId: data.sessionId, guideName: data.guideName, testName: data.testName })
        );
      } catch (error: any) {
        toast.error(error.message || "امکان شروع رازمایی وجود ندارد.");
        navigate(`/mystery/${slug}`);
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
      speaker: "شما",
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await sendMysteryMessage(sessionInfo.sessionId, text);
      if (!response.success) {
        throw new Error(response.message || "پاسخ از سرور دریافت نشد");
      }
      const replyText: string = response.data.reply;
      const guideName: string = response.data.guideName || sessionInfo.guideName;
      const guideMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: replyText,
        speaker: guideName,
      };
      setMessages((prev) => [...prev, guideMessage]);
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
      const response = await finishMysteryTest(sessionInfo.sessionId);
      if (!response.success) {
        throw new Error(response.message || "تحلیل گفتگو با خطا مواجه شد");
      }
      const analysisData: MysteryAnalysis = response.data;
      setAnalysis(analysisData);
      persistAnalysis(analysisData);
      toast.success("تحلیل رازمایی آماده شد.");
    } catch (error: any) {
      toast.error(error.message || "خطا در پایان رازمایی");
    } finally {
      setIsFinishing(false);
    }
  };

  const goBack = () => {
    navigate(`/mystery/${slug}`);
  };

  const handleCopyAnalysis = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
      toast.success("خلاصه تحلیل در کلیپ‌بورد قرار گرفت.");
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      toast.error("امکان کپی JSON تحلیل وجود ندارد.");
    }
  };

  const renderAnalysis = () => {
    if (!analysis) return null;
    const entries = Object.entries(analysis);
    return (
      <Card className="mt-6 border-purple-200 bg-white shadow-sm">
        <CardContent className="space-y-4 p-6 text-right">
          <h3 className="text-xl font-semibold text-slate-900">گزارش کشف راز</h3>
          <div className="space-y-3 text-sm leading-7 text-slate-700">
            {entries.map(([key, value]) => (
              <div key={key}>
                <p className="font-semibold text-purple-700">{key}</p>
                <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                  {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={handleCopyAnalysis}>کپی JSON تحلیل</Button>
            <Button variant="outline" onClick={() => navigate("/mystery")}>سایر رازمایی‌ها</Button>
            <Button variant="secondary" onClick={() => navigate(`/mystery/${slug}/result`)}>
              مشاهده صفحه نتیجه
            </Button>
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
        <p className="text-sm text-slate-500">در حال آماده‌سازی گفتگو...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{sessionInfo.testName}</h1>
            <p className="text-xs text-slate-500">گفتگو با {sessionInfo.guideName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleFinish}
              disabled={isFinishing || analysis !== null}
              className="flex items-center gap-2"
            >
              {isFinishing && <Loader2 className="h-4 w-4 animate-spin" />}
              پایان و دریافت تحلیل
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
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-7 shadow-sm ${
                    msg.role === "assistant"
                      ? "rounded-bl-md bg-purple-50 text-slate-800"
                      : "rounded-br-md bg-slate-900 text-white"
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold opacity-70">{msg.speaker}</p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!analysis && (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="پاسخ یا کشف جدید خود را بنویس..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !inputValue.trim()}
              className="flex items-center gap-2"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              ارسال
            </Button>
          </div>
        )}

        {renderAnalysis()}
      </main>
    </div>
  );
};

export default MysteryChat;
