// src/pages/AssessmentChat.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { SceneCanvas } from "@/components/SceneCanvas";

import avatarUserMale from "@/assets/male1.jpg"; // کاربر (مرد)
import avatarUserFemale from "@/assets/female1.jpg"; // کاربر (زن)
import avatarUserNeutral from "@/assets/male3.jpg"; // کاربر (خنثی)
import avatarProctor from "@/assets/male2.jpg"; // مبصر
import avatarNarrator from "@/assets/female2.jpg"; // راوی

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
  userGender?: string | null;
  nextStage?: {
    type: string;
    slug?: string | null;
  } | null;
  currentPhase?: number;
  totalPhases?: number;
}

const DEFAULT_PERSONA_NAME = "راوی";
const LEGACY_PERSONA_NAME = "مشاور";
const RESPONSE_LOCK_DURATION_SECONDS = 3;

const normalizePersonaName = (value?: string | null) => {
  if (!value) return DEFAULT_PERSONA_NAME;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_PERSONA_NAME;
  return trimmed.includes(LEGACY_PERSONA_NAME) ? DEFAULT_PERSONA_NAME : trimmed;
};

const normalizeGenderValue = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const feminineTokens = ["female", "f", "خانم", "زن", "مونث", "زنانه", "دختر", "lady", "woman", "women"];
const masculineTokens = ["male", "m", "آقا", "مرد", "مذکر", "پسر", "man", "men"];

const resolveUserAvatarByGender = (gender?: string | null) => {
  const normalized = normalizeGenderValue(gender)?.toLowerCase() ?? null;
  if (!normalized) return avatarUserNeutral;
  if (feminineTokens.some((token) => normalized.includes(token))) return avatarUserFemale;
  if (masculineTokens.some((token) => normalized.includes(token))) return avatarUserMale;
  return avatarUserNeutral;
};

const AssessmentChat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeTyping, setActiveTyping] = useState<string | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [hasConversationStarted, setHasConversationStarted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [responseLockRemaining, setResponseLockRemaining] = useState(0);
  const userAvatarSrc = useMemo(
    () => resolveUserAvatarByGender(assessmentState?.userGender),
    [assessmentState?.userGender]
  );
  const avatars = useMemo(
    () => [
      { src: userAvatarSrc, name: "شما", role: "user" },
      { src: avatarProctor, name: "مبصر", role: "proctor" },
      { src: avatarNarrator, name: "راوی", role: "narrator" },
    ],
    [userAvatarSrc]
  );

  const persistAssessmentState = (updates: Partial<AssessmentState>) => {
    setAssessmentState((prev) => {
      if (!prev) return prev;
      const nextState = { ...prev, ...updates };
      nextState.personaName = normalizePersonaName(nextState.personaName);
      nextState.userGender = normalizeGenderValue(nextState.userGender);
      if (id) {
        sessionStorage.setItem(`assessmentState_${id}`, JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const userTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const responseLockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const micWarningShownRef = useRef(false);
  const isResponseLocked = responseLockRemaining > 0;
  const startResponseLock = useCallback(() => {
    setResponseLockRemaining(RESPONSE_LOCK_DURATION_SECONDS);
  }, []);

  const {
    isSupported: isSpeechSupported,
    isRecording,
    toggle: toggleSpeechRecording,
    stop: stopSpeechRecording,
  } = useSpeechRecognition({
    onFinalResult: (transcript) => {
      if (!transcript) return;
      setInputValue((prev) => prev + transcript);
    },
    onError: () => {
      toast.error("خطا در ضبط صدا. لطفاً دوباره تلاش کنید.");
    },
  });

  useEffect(() => {
    try {
      const storedState = sessionStorage.getItem(`assessmentState_${id}`);
      if (storedState) {
        const state: AssessmentState = JSON.parse(storedState);
        const normalizedState = {
          ...state,
          personaName: normalizePersonaName(state.personaName),
          userGender: normalizeGenderValue(state.userGender),
        };
        setAssessmentState(normalizedState);
        if (id) {
          sessionStorage.setItem(`assessmentState_${id}`, JSON.stringify(normalizedState));
        }
      } else throw new Error("Session state not found.");
    } catch (error) {
      toast.error("جلسه ارزیابی یافت نشد.");
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isHistoryView) return;
    const container = messageScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isHistoryView]);

  useEffect(() => {
    if (responseLockRemaining <= 0) {
      if (responseLockIntervalRef.current) {
        clearInterval(responseLockIntervalRef.current);
        responseLockIntervalRef.current = null;
      }
      return;
    }
    responseLockIntervalRef.current = setInterval(() => {
      setResponseLockRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (responseLockIntervalRef.current) {
        clearInterval(responseLockIntervalRef.current);
        responseLockIntervalRef.current = null;
      }
    };
  }, [responseLockRemaining]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const SPEAKER_PATTERNS = [
    { label: "مبصر", personaName: "مبصر" },
    { label: "راوی", personaName: "راوی" },
    { label: "مشاور", personaName: DEFAULT_PERSONA_NAME },
    { label: "آقای منصوری", personaName: "مبصر" },
  ] as const;

  const parseSpeakerTaggedSegments = (text: string, fallbackPersonaName: string) => {
    const lines = text
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const segments: { personaName: string; text: string }[] = [];
    let currentPersona: string | null = null;
    let buffer: string[] = [];
    const normalizedFallback = normalizePersonaName(fallbackPersonaName);

    const flush = () => {
      if (!buffer.length) return;
      segments.push({
        personaName: normalizePersonaName(currentPersona ?? normalizedFallback),
        text: buffer.join(" "),
      });
      buffer = [];
    };

    for (const line of lines) {
      const speaker = SPEAKER_PATTERNS.find((pattern) =>
        line.startsWith(`${pattern.label}:`) ||
        line.startsWith(`${pattern.label} :`) ||
        line.startsWith(`${pattern.label}：`)
      );

      if (speaker) {
        flush();
        const content = line.replace(/^([^\s:：]+)\s*[:：]\s*/, "").trim();
        currentPersona = normalizePersonaName(speaker.personaName);
        if (content) buffer.push(content);
      } else {
        buffer.push(line);
      }
    }

    flush();
    return segments;
  };

  const extractAiMessages = (response: any): ChatMessage[] => {
    const normalizedResponses: Array<{ senderName?: string; text?: string }> = [];
    const rawResponses = response?.data?.responses;

    if (Array.isArray(rawResponses)) {
      normalizedResponses.push(...rawResponses);
    } else if (rawResponses && typeof rawResponses === "object") {
      normalizedResponses.push(rawResponses as { senderName?: string; text?: string });
    } else if (typeof rawResponses === "string") {
      normalizedResponses.push({ text: rawResponses });
    }

    if (typeof response?.data?.reply === "string" && response.data.reply.trim().length > 0) {
      const trimmedReply = response.data.reply.trim();
      const duplicateReply = normalizedResponses.some(
        (item) => typeof item?.text === "string" && item.text.trim() === trimmedReply
      );
      if (!duplicateReply) {
        normalizedResponses.push({
          text: trimmedReply,
          senderName: normalizePersonaName(response.data?.personaName ?? assessmentState?.personaName),
        });
      }
    }

    const fallbackText =
      typeof response?.data?.reply === "string"
        ? response.data.reply
        : typeof response?.data?.message === "string"
          ? response.data.message
          : typeof response?.data?.text === "string"
            ? response.data.text
            : null;

    const sanitized: ChatMessage[] = [];
    normalizedResponses
      .filter((item) => typeof item?.text === "string" && item.text.trim().length > 0)
      .forEach((item, index) => {
        const fallbackPersonaName = normalizePersonaName(item.senderName ?? assessmentState?.personaName);
        const segments = parseSpeakerTaggedSegments(item.text!.trim(), fallbackPersonaName);

        if (segments.length === 0) {
          sanitized.push({
            id: Date.now() + index,
            text: item.text!.trim(),
            sender: "ai",
            personaName: fallbackPersonaName,
          });
          return;
        }

        segments.forEach((segment, segIndex) => {
          sanitized.push({
            id: Date.now() + index * 10 + segIndex,
            text: segment.text,
            sender: "ai",
            personaName: normalizePersonaName(segment.personaName),
          });
        });
      });

    const directPersonaName = normalizePersonaName(
      typeof response?.data?.personaName === "string" && response.data.personaName.trim().length > 0
        ? response.data.personaName
        : typeof rawResponses === "object" && rawResponses !== null && "senderName" in rawResponses
          ? (rawResponses as { senderName?: string }).senderName ?? assessmentState?.personaName
          : assessmentState?.personaName
    );

    const directText =
      typeof rawResponses === "string"
        ? rawResponses
        : typeof rawResponses === "object" && rawResponses !== null && "text" in rawResponses
          ? ((rawResponses as { text?: string }).text ?? fallbackText)
          : fallbackText;

    if (sanitized.length === 0 && typeof directText === "string" && directText.trim().length > 0) {
      const fallbackSegments = parseSpeakerTaggedSegments(directText.trim(), directPersonaName);
      if (fallbackSegments.length === 0) {
        sanitized.push({
          id: Date.now(),
          text: directText.trim(),
          sender: "ai" as const,
          personaName: directPersonaName,
        });
      } else {
        fallbackSegments.forEach((segment, index) => {
          sanitized.push({
            id: Date.now() + index,
            text: segment.text,
            sender: "ai",
            personaName: normalizePersonaName(segment.personaName),
          });
        });
      }
    }

    return sanitized;
  };

  const scheduleSupplementaryRedirect = () => {
    const target = id ? `/supplementary/${id}` : "/dashboard";
    setTimeout(() => navigate(target), 2200);
  };

  const handleSendMessage = async () => {
    if (!hasConversationStarted || !inputValue.trim() || !assessmentState || isResponseLocked) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      personaName: "شما",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setActiveTyping(DEFAULT_PERSONA_NAME);
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
      console.log("AssessmentChat API response", response);

      if (!response?.success) {
        throw new Error(response?.message || "پاسخ نامعتبر از سرور دریافت شد");
      }

      persistAssessmentState({
        nextStage: response.data?.nextStage ?? assessmentState.nextStage ?? null,
      });

      const aiMessages = extractAiMessages(response);
      if (aiMessages.length > 0) {
        setMessages((prev) => [...prev, ...aiMessages]);
        startResponseLock();
      }

      if (response.data?.isComplete) {
        toast.info("ارزیابی به پایان رسید. در حال نمایش سوالات تکمیلی...");
        scheduleSupplementaryRedirect();
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

  const warnMicUnavailableOnce = () => {
    if (micWarningShownRef.current) return;
    toast.error("مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.");
    micWarningShownRef.current = true;
  };

  const toggleRecording = () => {
    if (!hasConversationStarted || isResponseLocked) return;
    if (!isSpeechSupported) {
      warnMicUnavailableOnce();
      return;
    }
    toggleSpeechRecording();
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  const handleMessagesScroll = () => {
    if (!hasConversationStarted) return;
    const container = messageScrollRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 24;
    setIsHistoryView(!isAtBottom);
  };

  const scrollToLatest = () => {
    if (!hasConversationStarted) return;
    const container = messageScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    setIsHistoryView(false);
  };

  const handleStartConversation = async () => {
    if (isInitializing || hasConversationStarted || !assessmentState) return;

    setIsInitializing(true);
    setIsHistoryView(false);
    setActiveTyping(assessmentState.personaName ?? DEFAULT_PERSONA_NAME);

    try {
      const response = await apiFetch(`assessment/chat/${id}`, {
        method: "POST",
        body: JSON.stringify({
          message: "__AUTO_START__",
          session_id: assessmentState.sessionId,
          autoStart: true,
        }),
      });
      console.log("AssessmentChat initial response", response);

      if (!response?.success) {
        throw new Error(response?.message || "خطا در دریافت پیام آغازین");
      }

      persistAssessmentState({
        nextStage: response.data?.nextStage ?? assessmentState.nextStage ?? null,
      });

      const aiMessages = extractAiMessages(response);
      if (aiMessages.length > 0) {
        setMessages(aiMessages);
        setHasConversationStarted(true);
        startResponseLock();
        requestAnimationFrame(() => {
          const container = messageScrollRef.current;
          if (container) {
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
          }
        });
      } else {
        setHasConversationStarted(false);
        toast.error("پاسخی از سمت هوش مصنوعی دریافت نشد.");
      }

      if (response.data?.isComplete) {
        console.log("Response Data:", response.data);
        toast.info("ارزیابی به پایان رسید. در حال نمایش سوالات تکمیلی...");
        scheduleSupplementaryRedirect();
      }
    } catch (error: any) {
      setHasConversationStarted(false);
      toast.error(error?.message || "خطا در شروع گفتگو");
    } finally {
      stopSpeechRecording();
      setActiveTyping(null);
      setIsInitializing(false);
    }
  };

  // ----- بخش دوم (UI و رندرینگ) -----

  const personaMeta = useMemo(
    () =>
      ({
        user: {
          name: "شما",
          avatar: userAvatarSrc,
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
          name: DEFAULT_PERSONA_NAME,
          avatar: avatarNarrator,
          badge: "دستیار",
          accent: "from-indigo-400 to-purple-500",
          bubble: "bg-indigo-50/90 text-indigo-800 border-indigo-100",
          glow: "shadow-[0_10px_30px_-12px_rgba(129,140,248,0.65)]",
          layout: "left",
        },
      }) as const,
    [userAvatarSrc]
  );

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

  const squareAvatarSlots = {
    narrator: {
      position: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
      align: "items-center text-center",
    },
    proctor: {
      position: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
      align: "items-end text-right",
    },
    user: {
      position: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
      align: "items-start text-left",
    },
  } as const;

  const lastPersonaKey = lastMessage ? resolvePersonaKey(lastMessage) : null;
  const typingPersonaKey = resolveTypingPersonaKey(activeTyping);
  const typingMeta = typingPersonaKey ? personaMeta[typingPersonaKey] : null;

  const squareAvatarMembers = (Object.keys(squareAvatarSlots) as Array<keyof typeof squareAvatarSlots>).map((key) => {
    const meta = personaMeta[key];
    const avatar = avatars.find((item) => item.role === (key === "user" ? "user" : key));
    const isSpeaking = lastPersonaKey === key;
    const isTyping = (typingPersonaKey ?? (isUserTyping ? "user" : null)) === key;

    return {
      key,
      meta,
      avatar,
      isSpeaking,
      isTyping,
      placement: squareAvatarSlots[key],
    };
  });

  return (
    <div className="relative flex min-h-screen w-full justify-center overflow-hidden bg-slate-950 text-slate-900 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <SceneCanvas />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/45 via-white/15 to-white/5 backdrop-blur-[1px]" />

      <div className="relative z-10 flex w-full max-w-6xl flex-1 min-h-0 flex-col items-center gap-8 sm:gap-10">
        <header className="flex flex-col items-center gap-3 text-center sm:gap-4">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">میدان گفتگو با قاب مربعی</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            پیام‌های شما داخل یک قاب مربعی بزرگ و خواناتر ارائه می‌شوند و آواتار هر نقش روی اضلاع این قاب قرار گرفته تا
            حضورش را نشان دهد.
          </p>
        </header>

        <section className="relative flex w-full flex-1 min-h-0 flex-col items-center">
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="absolute inset-y-16 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/70 to-transparent opacity-60" />
            <div className="absolute inset-x-10 top-12 h-28 rounded-3xl bg-white/30 blur-3xl" />
            <div className="absolute bottom-16 left-1/2 flex w-2/3 -translate-x-1/2 items-center justify-between border-t border-white/40 px-4 text-[10px] uppercase tracking-[0.4em] text-white/60">
              <span>ORBIT</span>
              <span>FIELD</span>
              <span>SYNC</span>
            </div>
          </div>

          {assessmentState?.totalPhases && assessmentState.totalPhases > 1 && (
            <div className="mb-4 rounded-full border border-white/60 bg-white/70 px-5 py-1 text-xs font-semibold text-slate-600 shadow">
              مرحله {assessmentState.currentPhase ?? 1} از {assessmentState.totalPhases}
            </div>
          )}
          <div className="relative flex w-full flex-1 min-h-[440px] items-center justify-center">
            <div className="relative aspect-square w-full max-w-[640px] sm:max-w-[560px] md:max-w-[600px]">
              <div className="absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/55 via-white/10 to-transparent shadow-[0_25px_80px_-40px_rgba(79,70,229,0.45)] backdrop-blur-lg" />
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
              <div className="absolute left-1/2 top-1/2 z-40 flex aspect-square w-[92%] min-w-[260px] max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[42px] border border-white/60 bg-white/90 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.5)] backdrop-blur-sm sm:w-[80%]">
                <div className="pointer-events-none absolute inset-[8%] rounded-[32px] border border-dashed border-violet-100/80" />
                <div className="pointer-events-none absolute inset-[16%] rounded-[28px] border border-white/50" />
                <div className="pointer-events-none absolute inset-0 rounded-[42px] bg-gradient-to-b from-white via-white/70 to-white/40 opacity-80" />

                {hasConversationStarted ? (
                  <>
                    <div
                      ref={messageScrollRef}
                      onScroll={handleMessagesScroll}
                      className="relative z-10 flex h-full flex-col overflow-y-auto overscroll-contain px-6 pb-14 pt-10 text-center sm:px-10 sm:pt-14"
                      style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
                    >
                      {!isHistoryView && (
                        <div className="pointer-events-none absolute inset-x-4 top-0 z-30 h-24 bg-gradient-to-b from-white via-white/70 to-transparent sm:inset-x-6" />
                      )}
                      <div className="flex flex-col items-center justify-end gap-6">
                        {messages.map((msg, index) => {
                          const meta = resolvePersonaMeta(msg);
                          const isLatest = messages.length - 1 === index;
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "relative mx-auto flex w-full max-w-[90%] flex-col items-center gap-4 rounded-[32px] border-2 px-7 py-6 text-base leading-8 shadow-md transition-all sm:max-w-[76%] sm:px-9 sm:py-8",
                                meta.bubble,
                                isLatest && "scale-[1.01] border-white/80 shadow-lg"
                              )}
                            >
                              <div
                                className={cn(
                                  "pointer-events-none absolute left-1/2 top-0 h-1 w-20 -translate-x-1/2 rounded-full bg-gradient-to-r",
                                  meta.accent
                                )}
                              />
                              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 sm:text-sm">
                                <span className="inline-flex items-center justify-center rounded-full bg-white/70 px-3 py-1 shadow-sm">
                                  {meta.name}
                                </span>
                              </div>
                              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 sm:text-base sm:leading-8">
                                {msg.text}
                              </p>
                            </div>
                          );
                        })}
                        {activeTyping && typingMeta && (
                          <div className="mx-auto flex items-center justify-center gap-3 rounded-full border border-dashed border-slate-200/70 bg-white/85 px-5 py-2 text-xs text-slate-500 shadow-sm">
                            <span className="inline-flex items-center gap-2 font-semibold text-slate-500">
                              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
                              {activeTyping} در حال پاسخ…
                            </span>
                            <div className="flex items-center gap-1 text-slate-400">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {isHistoryView && (
                      <div className="pointer-events-auto absolute bottom-10 left-1/2 z-40 -translate-x-1/2">
                        <Button
                          size="sm"
                          onClick={scrollToLatest}
                          className="rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-5 text-[13px] font-semibold text-white shadow-lg hover:from-violet-500 hover:to-purple-400"
                        >
                          مشاهده پیام جدید
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center sm:px-10">
                    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-white/70 bg-white/95 p-6 shadow-lg">
                      <span className="text-sm font-semibold text-slate-600">
                        {isInitializing ? "در حال آماده‌سازی پیام آغازین..." : "آماده‌ای شروع کنیم؟"}
                      </span>
                      <p className="text-xs leading-6 text-slate-500 sm:text-sm">
                        وقتی روی دکمه زیر بزنی، راوی پیام ابتدایی را می‌فرستد و گفتگو آغاز می‌شود.
                      </p>
                      <Button
                        onClick={handleStartConversation}
                        disabled={!assessmentState || isInitializing}
                        className="rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg hover:from-violet-500 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isInitializing ? "منتظر بمانید..." : "شروع کنیم"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-[640px] sm:max-w-[560px] md:max-w-[600px]">
                {squareAvatarMembers.map((persona) => {
                  const avatarSrc = persona.avatar?.src ?? persona.meta.avatar;
                  const avatarName = persona.avatar?.name ?? persona.meta.name;
                  return (
                    <div
                      key={persona.key}
                      className={cn("pointer-events-none absolute", persona.placement.position)}
                    >
                      <div
                        className={cn(
                          "flex w-[92px] flex-col gap-2 text-[10px] font-medium transition-all duration-500 sm:w-[118px] sm:text-xs",
                          persona.placement.align,
                          persona.isSpeaking ? "text-slate-700" : "text-slate-500"
                        )}
                      >
                        <div
                          className={cn(
                            "relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/95 shadow-md backdrop-blur sm:h-16 sm:w-16",
                            persona.meta.glow,
                            persona.isTyping && "animate-avatar-wiggle",
                            persona.isSpeaking && "ring-2 ring-violet-300 ring-offset-2 ring-offset-white"
                          )}
                        >
                          <Avatar className="h-12 w-12 border border-white/70 shadow-sm sm:h-14 sm:w-14">
                            <AvatarImage src={avatarSrc} alt={avatarName} />
                            <AvatarFallback>{avatarName[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="min-h-[18px] pt-1">
                          {persona.isTyping && (
                            <span className="rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                              در حال تایپ
                            </span>
                          )}
                          {!persona.isTyping && persona.isSpeaking && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-violet-500 shadow">
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
            </div>
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
                  isRecording && "border-sky-300 bg-sky-50 text-sky-600 shadow-[0_10px_25px_-15px_rgba(56,189,248,1)]",
                  (!hasConversationStarted || isResponseLocked) && "cursor-not-allowed opacity-60"
                )}
                disabled={!hasConversationStarted || isResponseLocked}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <div className="relative flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder={
                    hasConversationStarted
                      ? "اینجا بنویسید تا حلقه گفتگو ادامه یابد..."
                      : "برای شروع گفتگو روی «شروع کنیم» بزنید"
                  }
                  className={cn(
                    "h-11 w-full rounded-full border-none bg-transparent text-right text-sm text-slate-600 focus-visible:ring-0 sm:h-12",
                    (!hasConversationStarted || isResponseLocked) && "cursor-not-allowed opacity-60"
                  )}
                  disabled={!hasConversationStarted || isResponseLocked}
                />
                {isResponseLocked && (
                  <div className="absolute inset-y-0 left-2 flex items-center">
                    <div className="relative h-9 w-9">
                      <svg className="h-9 w-9 -rotate-90 text-slate-200" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="4" fill="none" />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          stroke="url(#responseLockGradient)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 14}
                          strokeDashoffset={
                            ((RESPONSE_LOCK_DURATION_SECONDS - responseLockRemaining) / RESPONSE_LOCK_DURATION_SECONDS) *
                            2 *
                            Math.PI *
                            14
                          }
                        />
                        <defs>
                          <linearGradient id="responseLockGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#38bdf8" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {responseLockRemaining}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSendMessage}
                size="icon"
                className={cn(
                  "h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-violet-500 hover:to-sky-400 sm:h-12 sm:w-12",
                  (!hasConversationStarted || isResponseLocked) && "cursor-not-allowed opacity-60 hover:scale-100"
                )}
                disabled={!hasConversationStarted || isResponseLocked}
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
