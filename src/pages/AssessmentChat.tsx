// src/pages/AssessmentChat.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import { cn } from "@/lib/utils";

import avatarUser from "@/assets/avatar1.jpg"; // کاربر
import avatarProctor from "@/assets/avatar2.jpg"; // مبصر
import avatarNarrator from "@/assets/avatar3.jpg"; // راوی

interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "ai";
  personaName?: string;
}

interface AssessmentState {
  sessionId: string;
  initialMessage: string;
  settings: any;
  personaName: string;
}

const avatars = [
  { src: avatarUser, name: "شما", role: "user" },
  { src: avatarProctor, name: "مبصر", role: "proctor" },
  { src: avatarNarrator, name: "راوی", role: "narrator" },
];

const AssessmentChat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeTyping, setActiveTyping] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    try {
      const storedState = sessionStorage.getItem(`assessmentState_${id}`);
      if (storedState) {
        const state: AssessmentState = JSON.parse(storedState);
        setAssessmentState(state);

        const initialAiMessage: ChatMessage = {
          id: Date.now(),
          text: state.initialMessage,
          sender: "ai",
          personaName: state.personaName,
        };
        setMessages([initialAiMessage]);
      } else throw new Error("Session state not found.");
    } catch (error) {
      toast.error("جلسه ارزیابی یافت نشد.");
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech Recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "fa-IR";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInputValue((prev) => prev + transcript);
          }
        }
      };

      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
    } else {
      toast.error("مرورگر شما از Speech Recognition پشتیبانی نمی‌کند.");
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !assessmentState) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      personaName: "شما",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setActiveTyping("مشاور");

    try {
      const response = await apiFetch(`assessment/chat/${id}`, {
        method: "POST",
        body: JSON.stringify({ message: userMessage.text, session_id: assessmentState.sessionId }),
      });

      if (response?.success && typeof response.data?.reply === "string") {
        const aiReply = response.data.reply;
        const endSignal = "[END_ASSESSMENT]";

        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: aiReply.replace(endSignal, "").trim(),
          sender: "ai",
          personaName: response.data.personaName,
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (aiReply.includes(endSignal)) {
          toast.info("ارزیابی به پایان رسید. در حال انتقال...");
          setTimeout(() => navigate(`/supplementary/${id}`), 2500);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "خطا در ارتباط با سرور");
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setActiveTyping(null);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (!isRecording) {
      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isUserTurn = lastMessage ? lastMessage.sender === "ai" : Boolean(assessmentState);

  const personaMeta = {
    user: {
      name: "شما",
      avatar: avatarUser,
      badge: "شرکت‌کننده",
      accent: "from-sky-400 to-sky-500",
      bubble: "bg-sky-50/90 text-sky-800 border-sky-100",
      glow: "shadow-[0_10px_30px_-12px_rgba(56,189,248,0.65)]",
      layout: "center",
    },
    narrator: {
      name: "راوی",
      avatar: avatarNarrator,
      badge: "نقال سناریو",
      accent: "from-emerald-400 to-teal-500",
      bubble: "bg-emerald-50/90 text-emerald-800 border-emerald-100",
      glow: "shadow-[0_10px_30px_-12px_rgba(16,185,129,0.65)]",
      layout: "left",
    },
    proctor: {
      name: "مبصر",
      avatar: avatarProctor,
      badge: "ناظر آزمون",
      accent: "from-amber-400 to-orange-500",
      bubble: "bg-amber-50/90 text-amber-900 border-amber-100",
      glow: "shadow-[0_10px_30px_-12px_rgba(245,158,11,0.65)]",
      layout: "right",
    },
    ai: {
      name: "مشاور",
      avatar: avatarNarrator,
      badge: "دستیار",
      accent: "from-indigo-400 to-purple-500",
      bubble: "bg-indigo-50/90 text-indigo-800 border-indigo-100",
      glow: "shadow-[0_10px_30px_-12px_rgba(129,140,248,0.65)]",
      layout: "left",
    },
  } as const;

  const resolvePersonaKey = (message: ChatMessage) => {
    if (message.sender === "user") return "user" as const;
    if (message.personaName?.includes("مبصر")) return "proctor" as const;
    if (message.personaName?.includes("راوی")) return "narrator" as const;
    return "ai" as const;
  };

  const resolvePersonaMeta = (message: ChatMessage) => personaMeta[resolvePersonaKey(message)];

  const getLayoutClasses = (layout: (typeof personaMeta)[keyof typeof personaMeta]["layout"]) => {
    switch (layout) {
      case "left":
        return "col-start-1 justify-self-end text-right md:pr-6";
      case "right":
        return "col-start-3 justify-self-start text-right md:pl-6";
      default:
        return "col-span-3 justify-self-center text-right md:col-span-1 md:col-start-2 md:max-w-xl";
    }
  };

  const personaCards = avatars.map((avatar) => {
    const cardMeta =
      avatar.role === "user"
        ? personaMeta.user
        : avatar.role === "proctor"
        ? personaMeta.proctor
        : personaMeta.narrator;

    const normalizedTyping = activeTyping ?? "";
    const isActive =
      (avatar.role === "user" && isUserTurn) ||
      normalizedTyping.includes(cardMeta.name) ||
      (normalizedTyping === "مشاور" && cardMeta.name === "راوی");

    return { ...avatar, meta: cardMeta, isActive };
  });

  return (
    <div className="relative flex min-h-screen w-full justify-center overflow-hidden bg-gradient-to-br from-[#f9fbff] via-[#eef4ff] to-[#f4fbff] px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-32 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-[90%] -translate-x-1/2 rounded-full bg-white/60 blur-2xl" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-8">
        <header className="grid gap-4 md:grid-cols-3">
          {personaCards.map((persona) => (
            <div
              key={persona.name}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-5 text-right shadow-lg transition-transform duration-300",
                persona.isActive ? "scale-[1.02] border-sky-200/80 shadow-xl" : "hover:scale-[1.01]"
              )}
            >
              <div
                className={cn(
                  "absolute -right-16 -top-16 h-32 w-32 rounded-full opacity-70 blur-2xl transition-opacity",
                  `bg-gradient-to-br ${persona.meta.accent}`,
                  persona.isActive ? "opacity-80" : "opacity-40"
                )}
              />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                    {persona.meta.badge}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800">{persona.name}</h2>
                  <p className="text-xs text-slate-500">
                    {persona.role === "user"
                      ? "پاسخ‌گوی اصلی جلسه"
                      : persona.role === "proctor"
                      ? "نقش داور و ناظر گفتگو"
                      : "مدیریت جریان روایت"}
                  </p>
                </div>
                <div
                  className={cn(
                    "relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-md",
                    persona.meta.glow
                  )}
                >
                  <Avatar className="h-12 w-12 border border-white/70">
                    <AvatarImage src={persona.src} alt={persona.name} />
                    <AvatarFallback>{persona.name[0]}</AvatarFallback>
                  </Avatar>
                  {persona.isActive && (
                    <span className="absolute -bottom-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-sky-600 shadow">
                      فعال
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </header>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/80 p-6 shadow-xl">
          <div className="pointer-events-none absolute inset-x-12 top-0 h-32 rounded-b-[60%] bg-gradient-to-b from-white/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-8 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-200 via-sky-300 to-emerald-200" />
          <div className="relative flex max-h-[60vh] flex-col gap-10 overflow-y-auto px-2 py-6">
            {messages.map((msg, index) => {
              const meta = resolvePersonaMeta(msg);
              const layoutClasses = getLayoutClasses(meta.layout);
              const stepAccent = ["border-sky-200 text-sky-500", "border-emerald-200 text-emerald-500", "border-amber-200 text-amber-500"];
              const stepClass = stepAccent[index % stepAccent.length];

              return (
                <div key={msg.id} className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 text-sm">
                  <div className="col-start-2 row-span-1 flex items-center justify-center">
                    <div className="relative flex h-12 w-12 items-center justify-center">
                      <span className="absolute inset-0 rounded-full border-4 border-white/70 bg-white/80" />
                      <span className={cn("relative flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold shadow", stepClass)}>
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className={cn("flex flex-col gap-3", layoutClasses)}>
                    <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
                      <span>{meta.name}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <span>نوبت #{index + 1}</span>
                    </div>
                    <div
                      className={cn(
                        "relative rounded-3xl border px-5 py-4 text-[13px] leading-relaxed shadow-md",
                        meta.bubble
                      )}
                    >
                      <span className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-white/70 bg-white shadow md:flex" />
                      <div className="flex items-start gap-3">
                        <Avatar className="mt-1 h-9 w-9 border border-white/80 shadow-sm">
                          <AvatarImage src={meta.avatar} alt={meta.name} />
                          <AvatarFallback>{meta.name[0]}</AvatarFallback>
                        </Avatar>
                        <p className="flex-1 whitespace-pre-line text-right text-slate-700">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {activeTyping && (
              <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 text-sm">
                <div className="col-start-2 flex items-center justify-center">
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inset-0 animate-pulse rounded-full border-4 border-white/70 bg-white/70" />
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 text-xs font-semibold text-white shadow">
                      در حال
                    </span>
                  </div>
                </div>
                <div className="col-span-3 flex flex-col items-center gap-3 text-right md:col-start-2 md:max-w-xl">
                  <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
                    <span>{activeTyping}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span>در حال پاسخ</span>
                  </div>
                  <div className="flex w-full flex-col items-center rounded-3xl border border-slate-200/70 bg-white/80 px-5 py-4 text-[13px] text-slate-500 shadow-md">
                    <div className="flex gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </section>

        <footer className="sticky bottom-0 z-10">
          <div className="rounded-full border border-white/70 bg-white/90 p-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleRecording}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-all duration-300 hover:scale-105 hover:bg-slate-200",
                  isRecording && "border-sky-300 bg-sky-50 text-sky-600 shadow-[0_10px_25px_-15px_rgba(56,189,248,1)]"
                )}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="اینجا بنویسید و مسیر گفتگو را ادامه دهید..."
                className="h-12 flex-1 rounded-full border-none bg-transparent text-right text-sm text-slate-600 focus-visible:ring-0"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-sky-500 hover:to-teal-500"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AssessmentChat;
