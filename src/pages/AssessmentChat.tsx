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
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const userTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("مرورگر شما از Speech Recognition پشتیبانی نمی‌کند.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fa-IR";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (!transcript) continue;
        if (event.results[i].isFinal) {
          setInputValue((prev) => prev + transcript);
        }
      }
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop?.();
        } catch (error) {
          console.error("Speech recognition stop error", error);
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resolveViewport = () => {
      const width = window.innerWidth;
      if (width < 640) return "mobile" as const;
      if (width < 1024) return "tablet" as const;
      return "desktop" as const;
    };

    const updateViewport = () => {
      setViewport((current) => {
        const next = resolveViewport();
        return current === next ? current : next;
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
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
    setIsUserTyping(false);
    if (userTypingTimeoutRef.current) {
      clearTimeout(userTypingTimeoutRef.current);
      userTypingTimeoutRef.current = null;
    }

    try {
      const response = await apiFetch(`assessment/chat/${id}`, {
        method: "POST",
        body: JSON.stringify({ message: userMessage.text, session_id: assessmentState.sessionId }),
      });

      if (!response?.success) {
        throw new Error(response?.message || "پاسخ نامعتبر از سرور دریافت شد");
      }

      const rawResponses = response.data?.responses;
      const normalizedResponses: Array<{ senderName?: string; text?: string }> = [];

      if (Array.isArray(rawResponses)) {
        normalizedResponses.push(...rawResponses);
      } else if (rawResponses && typeof rawResponses === "object") {
        normalizedResponses.push(rawResponses as { senderName?: string; text?: string });
      } else if (typeof rawResponses === "string") {
        normalizedResponses.push({ text: rawResponses });
      }

      const fallbackText =
        typeof response.data?.message === "string"
          ? response.data.message
          : typeof response.data?.text === "string"
          ? response.data.text
          : null;

      const sanitized = normalizedResponses
        .filter((item) => typeof item?.text === "string" && item.text.trim().length > 0)
        .map((item, index) => ({
          id: Date.now() + index,
          text: item.text.trim(),
          sender: "ai" as const,
          personaName: item.senderName ?? assessmentState.personaName ?? "مشاور",
        }));

      const directPersonaName =
        typeof rawResponses === "object" && rawResponses !== null && "senderName" in rawResponses
          ? ((rawResponses as { senderName?: string }).senderName ?? assessmentState.personaName ?? "مشاور")
          : assessmentState.personaName ?? "مشاور";

      const directText =
        typeof rawResponses === "string"
          ? rawResponses
          : typeof rawResponses === "object" && rawResponses !== null && "text" in rawResponses
          ? ((rawResponses as { text?: string }).text ?? fallbackText)
          : fallbackText;

      if (sanitized.length === 0 && typeof directText === "string" && directText.trim().length > 0) {
        sanitized.push({
          id: Date.now(),
          text: directText.trim(),
          sender: "ai" as const,
          personaName: directPersonaName,
        });
      }

      if (sanitized.length > 0) {
        setMessages((prev) => [...prev, ...sanitized]);
      }

      if (response.data?.isComplete) {
        toast.info("ارزیابی به پایان رسید. در حال انتقال...");
        setTimeout(() => navigate(`/supplementary/${id}`), 2500);
      }
    } catch (error: any) {
      toast.error(error?.message || "خطا در ارتباط با سرور");
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setActiveTyping(null);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (userTypingTimeoutRef.current) clearTimeout(userTypingTimeoutRef.current);

    if (!value.trim()) {
      setIsUserTyping(false);
      userTypingTimeoutRef.current = null;
      return;
    }

    setIsUserTyping(true);
    userTypingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      userTypingTimeoutRef.current = null;
    }, 1200);
  };

  const handleInputBlur = () => {
    setIsUserTyping(false);
    if (userTypingTimeoutRef.current) {
      clearTimeout(userTypingTimeoutRef.current);
      userTypingTimeoutRef.current = null;
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

  const resolveTypingPersonaKey = (label: string | null) => {
    if (!label) return null;
    if (label.includes("مبصر")) return "proctor" as const;
    if (label.includes("راوی") || label.includes("مشاور")) return "narrator" as const;
    if (label.includes("شما")) return "user" as const;
    return null;
  };

  const orbitMap = {
    narrator: { angle: -18, radius: { mobile: 50, tablet: 58, desktop: 66 } },
    proctor: { angle: 210, radius: { mobile: 52, tablet: 60, desktop: 68 } },
    user: { angle: 120, radius: { mobile: 54, tablet: 62, desktop: 70 } },
  } as const;

  const lastPersonaKey = lastMessage ? resolvePersonaKey(lastMessage) : null;
  const typingPersonaKey = resolveTypingPersonaKey(activeTyping);
  const typingMeta = typingPersonaKey ? personaMeta[typingPersonaKey] : null;

  const orbitMembers = (Object.keys(orbitMap) as Array<keyof typeof orbitMap>).map((key) => {
    const meta = personaMeta[key];
    const avatar = avatars.find((item) => item.role === (key === "user" ? "user" : key));
    const config = orbitMap[key];
    const isSpeaking = lastPersonaKey === key;
    const isTyping = (typingPersonaKey ?? (isUserTyping ? "user" : null)) === key;
    const radiusSet = config.radius;
    const radiusValue = radiusSet[viewport] ?? radiusSet.desktop;
    const transform = `translate(${Math.cos((config.angle * Math.PI) / 180) * radiusValue}%, ${Math.sin(
      (config.angle * Math.PI) / 180
    ) * radiusValue}%) translate(-50%, -50%)`;

    return {
      key,
      meta,
      avatar,
      config,
      isSpeaking,
      isTyping,
      transform,
    };
  });

  return (
    <div className="relative flex min-h-[100dvh] w-full justify-center overflow-hidden bg-gradient-to-br from-[#f8f7ff] via-[#eef2ff] to-[#f5fbff] px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-40 top-16 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-36 h-96 w-96 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-12 h-36 w-[82%] -translate-x-1/2 rounded-full bg-white/60 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_58%)]" />

      <div className="relative z-10 flex w-full max-w-6xl flex-1 min-h-0 flex-col items-center gap-8 sm:gap-10">
        <header className="flex flex-col items-center gap-3 text-center sm:gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-1 text-xs font-semibold text-slate-500 shadow">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
            اتاق ارزیابی سه‌نفره
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">حلقه گفتگو با الهام از مسیرهای خمیده</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            پیام‌های شما در مرکز حلقه قرار می‌گیرند و نقش هر شخصیت با مدار اختصاصی مشخص است؛ وقتی هرکدام صحبت یا تایپ
            می‌کند، آواتار او با موج ملایم می‌لرزد.
          </p>
        </header>

        <section className="relative flex w-full flex-1 min-h-0 flex-col items-center">
          <div className="relative flex w-full flex-1 min-h-[440px] items-center justify-center">
            <div className="relative aspect-square w-full max-w-[640px] sm:max-w-[560px] md:max-w-[600px]">
              <div className="absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/65 via-white/15 to-transparent shadow-[0_25px_80px_-40px_rgba(79,70,229,0.45)] backdrop-blur-xl" />
              <div className="pointer-events-none absolute inset-[6%] rounded-[48px] border border-dashed border-white/60" />
              <div className="pointer-events-none absolute inset-[12%] rounded-[48px] border border-white/40" />
              <div className="pointer-events-none absolute inset-[18%] rounded-[48px] bg-gradient-to-b from-white/40 via-transparent to-transparent" />
              <svg
                className="pointer-events-none absolute inset-0"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M10 70 C30 40, 70 60, 90 30"
                  fill="none"
                  stroke="url(#orbitGradient)"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  opacity="0.5"
                />
                <defs>
                  <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(129,140,248,0.65)" />
                    <stop offset="100%" stopColor="rgba(56,189,248,0.45)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute left-1/2 top-1/2 z-40 flex h-[68%] w-[72%] min-h-[320px] max-h-[520px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[44px] border border-white/70 bg-white/90 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-16 bg-gradient-to-b from-white/85 via-white/50 to-transparent" />
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6 pb-16 text-right sm:px-8 sm:py-8">
                  {messages.map((msg, index) => {
                    const meta = resolvePersonaMeta(msg);
                    const isLatest = messages.length - 1 === index;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "relative ms-auto flex max-w-full flex-col gap-2 rounded-[28px] border px-4 py-3 text-sm leading-7 shadow-sm transition-all sm:px-5 sm:py-4",
                          meta.bubble,
                          isLatest && "scale-[1.01] border-white/80 shadow-lg"
                        )}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 sm:text-xs">
                          <div className="flex items-center gap-2">
                            <span>#{index + 1}</span>
                            <span className="inline-block h-1 w-1 rounded-full bg-slate-300" />
                            <span>{meta.badge}</span>
                          </div>
                          <div className="flex items-center gap-2 font-semibold text-slate-500">
                            <span>{meta.name}</span>
                            <Avatar className="h-8 w-8 border border-white/70 shadow-sm">
                              <AvatarImage src={meta.avatar} alt={meta.name} />
                              <AvatarFallback>{meta.name[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        <p className="whitespace-pre-line text-[13px] leading-relaxed text-slate-700 sm:text-sm">{msg.text}</p>
                      </div>
                    );
                  })}
                  {activeTyping && typingMeta && (
                    <div className="mx-auto flex items-center gap-3 rounded-full border border-dashed border-slate-200/70 bg-white/70 px-4 py-2 text-xs text-slate-500 shadow-sm">
                      <Avatar className="h-7 w-7 border border-white/70 shadow-sm">
                        <AvatarImage src={typingMeta.avatar} alt={typingMeta.name} />
                        <AvatarFallback>{typingMeta.name[0]}</AvatarFallback>
                      </Avatar>
                      <span>{activeTyping} در حال پاسخ…</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {orbitMembers.map((persona) => {
              const avatarSrc = persona.avatar?.src ?? persona.meta.avatar;
              const avatarName = persona.avatar?.name ?? persona.meta.name;
              return (
                <div key={persona.key} className="absolute top-1/2 left-1/2 z-30">
                  <div
                    style={{ transform: persona.transform }}
                    className={cn(
                      "flex w-[100px] flex-col items-center gap-2.5 text-center text-[11px] font-medium transition-all duration-500 sm:w-[120px] sm:text-xs",
                      persona.isSpeaking ? "text-slate-700" : "text-slate-500"
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-md backdrop-blur sm:h-16 sm:w-16",
                        persona.meta.glow,
                        persona.isTyping && "animate-avatar-wiggle",
                        persona.isSpeaking && "ring-2 ring-violet-300 ring-offset-2 ring-offset-white"
                      )}
                    >
                      <Avatar className="h-12 w-12 border border-white/70 shadow-sm sm:h-14 sm:w-14">
                        <AvatarImage src={avatarSrc} alt={avatarName} />
                        <AvatarFallback>{avatarName[0]}</AvatarFallback>
                      </Avatar>
                      {persona.isTyping && (
                        <span className="absolute -bottom-2 rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                          در حال تایپ
                        </span>
                      )}
                      {!persona.isTyping && persona.isSpeaking && (
                        <span className="absolute -bottom-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-violet-500 shadow">
                          در نوبت
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-700 sm:text-base">{persona.meta.name}</span>
                    <span className="text-[10px] text-slate-400 sm:text-xs">{persona.meta.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="sticky bottom-0 z-10 mt-auto w-full max-w-3xl sm:bottom-3 md:bottom-6">
          <div className="rounded-3xl border border-white/70 bg-white/95 p-2.5 shadow-2xl backdrop-blur sm:rounded-full sm:p-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Button
                onClick={toggleRecording}
                size="icon"
                className={cn(
                  "h-11 w-11 rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-all duration-300 hover:scale-105 hover:bg-slate-200 sm:h-12 sm:w-12",
                  isRecording && "border-sky-300 bg-sky-50 text-sky-600 shadow-[0_10px_25px_-15px_rgba(56,189,248,1)]"
                )}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="اینجا بنویسید تا حلقه گفتگو ادامه یابد..."
                className="h-11 flex-1 rounded-full border-none bg-transparent text-right text-sm text-slate-600 focus-visible:ring-0 sm:h-12"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-violet-500 hover:to-sky-400 sm:h-12 sm:w-12"
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
