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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
    narrator: { angle: -25, radius: 46 },
    proctor: { angle: 215, radius: 44 },
    user: { angle: 120, radius: 48 },
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
    const transform = `translate(${Math.cos((config.angle * Math.PI) / 180) * config.radius}%, ${Math.sin(
      (config.angle * Math.PI) / 180
    ) * config.radius}%) translate(-50%, -50%)`;

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
    const base = "order-1 flex flex-col gap-3 text-right";

    switch (layout) {
      case "left":
        return cn(base, "md:col-start-1 md:justify-self-end md:pr-6");
      case "right":
        return cn(base, "md:col-start-3 md:justify-self-start md:pl-6");
      default:
        return cn(base, "md:col-span-3 md:col-start-2 md:max-w-xl md:justify-self-center");
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
    <div className="relative flex min-h-[100dvh] w-full justify-center overflow-hidden bg-gradient-to-br from-[#f8f7ff] via-[#eef2ff] to-[#f5fbff] px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-32 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-32 w-[80%] -translate-x-1/2 rounded-full bg-white/60 blur-2xl" />

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
          <div className="relative flex w-full flex-1 min-h-[420px] items-center justify-center">
            <div className="relative aspect-square w-full max-w-[620px]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/70 via-white/30 to-white/10 shadow-[0_25px_80px_-40px_rgba(79,70,229,0.45)] backdrop-blur-xl" />
              <div className="pointer-events-none absolute inset-[10%] rounded-full border border-dashed border-white/50" />
              <div className="pointer-events-none absolute inset-[5%] rounded-full border border-white/30" />
              <div className="pointer-events-none absolute inset-[20%] rounded-full bg-gradient-to-b from-white/35 via-white/10 to-transparent" />
              <div className="absolute inset-[18%] flex flex-col overflow-hidden rounded-full border border-white/60 bg-white/80 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="pointer-events-none absolute inset-x-12 top-0 h-16 bg-gradient-to-b from-white/80 via-white/40 to-transparent" />
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6 pb-16 text-right sm:px-8 sm:py-8">
                  {messages.map((msg, index) => {
                    const meta = resolvePersonaMeta(msg);
                    const isLatest = messages.length - 1 === index;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "relative ms-auto flex max-w-full flex-col gap-2 rounded-3xl border px-4 py-3 text-sm leading-7 shadow-sm transition-all sm:px-5 sm:py-4",
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
                <div key={persona.key} className="absolute top-1/2 left-1/2">
                  <div
                    style={{ transform: persona.transform }}
                    className={cn(
                      "flex w-[120px] flex-col items-center gap-3 text-center text-xs font-medium transition-all duration-500",
                      persona.isSpeaking ? "text-slate-700" : "text-slate-500"
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-md backdrop-blur",
                        persona.meta.glow,
                        persona.isTyping && "animate-avatar-wiggle",
                        persona.isSpeaking && "ring-2 ring-violet-300 ring-offset-2 ring-offset-white"
                      )}
                    >
                      <Avatar className="h-14 w-14 border border-white/70 shadow-sm">
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
                    <span className="text-sm font-bold text-slate-700">{persona.meta.name}</span>
                    <span className="text-[10px] text-slate-400">{persona.meta.badge}</span>
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
