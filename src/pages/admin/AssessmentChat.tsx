// src/pages/AssessmentChat.tsx

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { Logo } from "@/components/ui/logo";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowUp, Mic, ArrowLeft, LoaderCircle, Clock } from "lucide-react";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";

interface AssessmentSettings {
  has_timer: boolean;
  timer_duration: number;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  senderName: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onstart: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const AssessmentChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: assessmentIdFromUrl } = useParams<{ id: string }>();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AssessmentSettings | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.lang = 'fa-IR';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error(`خطای تشخیص گفتار: ${event.error}`);
      }
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev ? prev.trim() + ' ' + transcript : transcript);
    };
    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const { state } = location;
    if (state?.initialMessage && state?.sessionId && state?.settings) {
      setSessionId(state.sessionId);
      setSettings(state.settings);
      if (state.settings.has_timer) {
        setTimeLeft(state.settings.timer_duration * 60);
      }
      const welcomeMessage: Message = {
        id: "welcome",
        text: state.initialMessage,
        isUser: false,
        timestamp: new Date(),
        senderName: "مشاور" // نام فرستنده پیام اول را می‌توان از بک‌اند نیز دریافت کرد
      };
      setMessages([welcomeMessage]);
    } else {
      toast.error("اطلاعات شروع ارزیابی ناقص است. لطفاً از داشبورد دوباره شروع کنید.");
      navigate('/dashboard');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!settings?.has_timer) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAssessmentComplete('زمان شما برای چت به پایان رسید.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId || !assessmentIdFromUrl) return;
    if (isListening) recognitionRef.current?.stop();

    const userMessage: Message = { id: Date.now().toString(), text: inputValue, isUser: true, timestamp: new Date(), senderName: "شما" };
    const currentInput = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiFetch(`assessment/chat/${assessmentIdFromUrl}`, {
        method: 'POST',
        body: JSON.stringify({ message: currentInput, session_id: sessionId }),
      });

      if (response.success && response.data) {
        // ✅ دریافت آرایه‌ای از پاسخ‌ها
        const aiResponses: { senderName: string, text: string }[] = response.data.responses;

        const newAiMessages: Message[] = aiResponses.map((res, index) => ({
          id: `${Date.now()}-${index}`,
          text: res.text,
          isUser: false,
          timestamp: new Date(),
          senderName: res.senderName, // استفاده از نام فرستنده دریافتی از API
        }));
        
        // افزودن تمام پیام‌های جدید به state
        setMessages(prev => [...prev, ...newAiMessages]);

        if (response.data.isComplete) {
          handleAssessmentComplete("مکالمه به پایان رسید.");
        }
      } else {
        throw new Error(response.message || 'خطا در ارتباط با سرور');
      }
    } catch (err: any) {
      toast.error(err.message);
      setInputValue(currentInput);
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssessmentComplete = (reason: string) => {
    if (!assessmentIdFromUrl) {
      toast.error("شناسه ارزیابی نامعتبر است. لطفاً دوباره شروع کنید.");
      navigate("/dashboard");
      return;
    }
    toast.info(`${reason} در حال نمایش سوالات تکمیلی...`);
    navigate(assessmentIdFromUrl ? `/supplementary/${assessmentIdFromUrl}` : "/dashboard");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast.warning("قابلیت تشخیص گفتار در دسترس نیست.");
      return;
    }
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  return (
    <div className="min-h-screen bg-hrbooteh-background flex flex-col">
      <header className="bg-hrbooteh-surface shadow-hrbooteh-sm border-b border-hrbooteh-surface-elevated p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="hrbooteh-ghost" size="icon-sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-hrbooteh-text-primary">ارزیابی آنلاین</h1>
              <p className="text-sm text-hrbooteh-text-secondary">در حال گفتگو...</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {settings?.has_timer && (
              <div className="flex items-center gap-2 text-hrbooteh-text-primary">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm font-medium">{formatTime(timeLeft)}</span>
              </div>
            )}
            <Logo variant="small" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 pb-24">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message.text} isUser={message.isUser} senderName={message.senderName} timestamp={message.timestamp} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-hrbooteh-chat-ai border border-hrbooteh-chat-ai-border rounded-xl px-4 py-3 max-w-[80%]">
                <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-hrbooteh-surface border-t border-hrbooteh-surface-elevated p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <Button variant="hrbooteh-ghost" size="icon" className="shrink-0" onClick={handleMicClick} disabled={isLoading}>
              <Mic className={`w-5 h-5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-hrbooteh-text-secondary'}`} />
            </Button>
            <div className="flex-1">
              <Textarea
                placeholder={isListening ? "در حال شنیدن..." : "پیام خود را اینجا بنویسید..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[48px] max-h-32 resize-none bg-hrbooteh-surface border-hrbooteh-surface-elevated focus:border-hrbooteh-primary"
                disabled={isLoading}
              />
            </div>
            <Button variant="hrbooteh" size="icon" onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="shrink-0">
              {isLoading ? <LoaderCircle className="animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AssessmentChat;
