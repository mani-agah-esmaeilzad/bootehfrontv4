// src/pages/MysteryAssessmentDetail.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, ArrowLeft, Loader2, Send, Sparkles } from "lucide-react";
import {
  getMysteryTest,
  resolveApiAssetUrl,
  startMysteryTest,
  sendMysteryMessage,
} from "@/services/apiService";
import type {
  MysteryChatHistoryItem,
  MysteryStartResponse,
  MysteryTestDetail,
} from "@/types/mystery";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const MysteryNarrationBubble = ({ message }: { message: string }) => {
  return (
    <div className="relative w-full select-none">
      <img
        src="/linkedin.jpeg"
        alt=""
        className="pointer-events-none h-auto w-full drop-shadow-[0_28px_52px_rgba(15,23,42,0.35)]"
        draggable={false}
      />
      <div className="absolute inset-x-[12%] top-[18%] bottom-[22%] flex items-center justify-center px-2 md:inset-x-[13%] md:top-[16%] md:bottom-[20%]">
        <p className="whitespace-pre-wrap text-right text-[0.9rem] font-medium leading-7 text-slate-800 drop-shadow-[0_1px_3px_rgba(255,255,255,0.6)] md:text-[1rem] md:leading-8">
          {message}
        </p>
      </div>
    </div>
  );
};

type SlideMessage = MysteryChatHistoryItem & {
  id: string;
};

const MysteryAssessmentDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [test, setTest] = useState<MysteryTestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<number | null>(null);

  const [sessionInfo, setSessionInfo] = useState<MysteryStartResponse | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [conversations, setConversations] = useState<Record<number, SlideMessage[]>>({});
  const [introMessages, setIntroMessages] = useState<SlideMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingAssistant, setPendingAssistant] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchTest = async () => {
      setIsLoading(true);
      try {
        const response = await getMysteryTest(slug);
        if (response.success) {
          setTest(response.data);
        } else {
          throw new Error(response.message || "آزمون رازمایی یافت نشد");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(error.message || "خطا در دریافت اطلاعات رازمایی");
        } else {
          toast.error("خطا در دریافت اطلاعات رازمایی");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchTest();
  }, [slug]);

  const images = useMemo(() => test?.images ?? [], [test]);
  const slides = useMemo(() => {
    if (images.length > 0) {
      return images.map((image) => ({
        ...image,
        image_url: resolveApiAssetUrl(image.image_url),
      }));
    }
    return [
      {
        id: -1,
        title: "هنوز تصویری برای این راز ثبت نشده است",
        description: "برای ادامه ابتدا تصاویر را تکمیل کنید.",
        image_url: "",
        display_order: 0,
      },
    ];
  }, [images]);

  const actionableSlides = useMemo(
    () => slides.filter((slide) => slide.id !== -1),
    [slides]
  );

  useEffect(() => {
    const slideMap = new Map(slides.map((slide) => [slide.id, slide]));
    setConversations((prev) => {
      const next: Record<number, SlideMessage[]> = {};
      slideMap.forEach((_value, key) => {
        next[key] = prev[key] ? [...prev[key]] : [];
      });
      return next;
    });
  }, [slides]);

  const ensureAuth = (redirectTo: string) => {
    const isLoggedIn =
      !!localStorage.getItem("isLoggedIn") || !!localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      toast.info("برای ادامه تحلیل ابتدا وارد حساب کاربری خود شوید.");
      navigate("/login", { state: { redirectTo } });
      return false;
    }
    return true;
  };

  const storeSessionMetadata = (session: MysteryStartResponse) => {
    if (!slug) return;
    sessionStorage.setItem(
      `mystery_session_${slug}`,
      JSON.stringify({
        sessionId: session.sessionId,
        guideName: session.guideName,
        testName: session.testName,
        testId: test?.id ?? null,
      })
    );
  };

  const startSession = async (): Promise<MysteryStartResponse | null> => {
    if (!test || !slug) return null;
    if (sessionInfo) return sessionInfo;
    if (!ensureAuth(`/mystery/${test.slug}`)) {
      return null;
    }
    setIsStartingSession(true);
    try {
      const response = await startMysteryTest(test.slug);
      if (!response.success) {
        throw new Error(response.message || "امکان شروع تحلیل وجود ندارد.");
      }
      const data: MysteryStartResponse = response.data;
      setSessionInfo(data);
      storeSessionMetadata(data);
      const initialMessages = (data.history ?? []).map((item, index) => ({
        id: `intro-${index}`,
        role: item.role,
        content: item.content,
      }));
      setIntroMessages(initialMessages);
      toast.success("تحلیل تعاملی آغاز شد.");
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("خطا در شروع تحلیل");
      }
      return null;
    } finally {
      setIsStartingSession(false);
    }
  };

  const appendMessage = (slideId: number, message: SlideMessage) => {
    setConversations((prev) => ({
      ...prev,
      [slideId]: [...(prev[slideId] ?? []), message],
    }));
  };

  useEffect(() => {
    if (!sessionInfo) return;
    const { sessionId } = sessionInfo;
    sessionStorage.setItem(
      `mystery_conversation_${sessionId}`,
      JSON.stringify(conversations)
    );
  }, [sessionInfo, conversations]);

  const handleSend = async () => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide || activeSlide.id === -1) {
      toast.info("برای ارسال پاسخ، ابتدا تصویری معتبر را انتخاب کنید.");
      return;
    }
    if (!inputValue.trim() || isSending) return;

    const session = sessionInfo ?? (await startSession());
    if (!session) return;

    const text = inputValue.trim();
    setInputValue("");

    const userMessage: SlideMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: text,
    };

    appendMessage(activeSlide.id, userMessage);
    setIsSending(true);
    setPendingAssistant(true);

    try {
      const prefixedMessage = `در مورد تصویر "${activeSlide.title || `شماره ${activeIndex + 1}`}" این را می‌گویم: ${text}`;
      const response = await sendMysteryMessage(session.sessionId, prefixedMessage);
      if (!response.success) {
        throw new Error(response.message || "پاسخی از رازمَستر دریافت نشد.");
      }
      const replyText: string = response.data.reply;
      if (replyText?.trim()) {
        const assistantMessage: SlideMessage = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: replyText.trim(),
        };
        appendMessage(activeSlide.id, assistantMessage);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "خطا در ارسال پیام");
      } else {
        toast.error("خطا در ارسال پیام");
      }
      // Remove last user message on failure
      setConversations((prev) => {
        const current = prev[activeSlide.id] ?? [];
        return {
          ...prev,
          [activeSlide.id]: current.filter((msg) => msg.id !== userMessage.id),
        };
      });
    } finally {
      setIsSending(false);
      setPendingAssistant(false);
    }
  };

  const handleProceedToSupplementary = async () => {
    if (!test || !slug) return;
    const session = sessionInfo ?? (await startSession());
    if (!session) return;
    toast.info("ادامه مسیر تحلیل در سوالات تکمیلی");
    navigate(`/mystery/${test.slug}/supplementary`);
  };

  const activeSlide = slides[activeIndex] ?? slides[0];
  const activeSlideId = activeSlide?.id ?? -1;
  const activeConversation = conversations[activeSlideId] ?? [];
  const activeConversationLength = activeConversation.length;

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [activeIndex, introMessages.length, activeConversationLength, pendingAssistant]);

  const handleChangeSlide = (nextIndex: number) => {
    if (nextIndex === activeIndex || nextIndex < 0 || nextIndex >= slides.length) {
      return;
    }
    setDirection(nextIndex > activeIndex ? "next" : "prev");
    setActiveIndex(nextIndex);
    setIsTransitioning(true);
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  const isChatPanelElement = (target: EventTarget | null) =>
    target instanceof HTMLElement && !!target.closest('[data-chat-panel="true"]');

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleWheel = (event: WheelEvent) => {
      if (isTransitioning || isChatPanelElement(event.target)) return;
      if (event.deltaY > 12 && activeIndex < slides.length - 1) {
        event.preventDefault();
        handleChangeSlide(activeIndex + 1);
      } else if (event.deltaY < -12 && activeIndex > 0) {
        event.preventDefault();
        handleChangeSlide(activeIndex - 1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        if (activeIndex < slides.length - 1 && !isTransitioning) {
          handleChangeSlide(activeIndex + 1);
          event.preventDefault();
        }
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        if (activeIndex > 0 && !isTransitioning) {
          handleChangeSlide(activeIndex - 1);
          event.preventDefault();
        }
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isChatPanelElement(event.target)) {
        touchStartRef.current = null;
        return;
      }
      touchStartRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const startY = touchStartRef.current;
      touchStartRef.current = null;
      if (startY === null) return;
      const endY = event.changedTouches[0]?.clientY ?? startY;
      const deltaY = startY - endY;
      if (Math.abs(deltaY) < 40 || isTransitioning) return;
      if (deltaY > 0 && activeIndex < slides.length - 1) {
        handleChangeSlide(activeIndex + 1);
      } else if (deltaY < 0 && activeIndex > 0) {
        handleChangeSlide(activeIndex - 1);
      }
    };

    slider.addEventListener("wheel", handleWheel, { passive: false });
    slider.addEventListener("touchstart", handleTouchStart, { passive: true });
    slider.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      slider.removeEventListener("wheel", handleWheel);
      slider.removeEventListener("touchstart", handleTouchStart);
      slider.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, slides.length, isTransitioning]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500">در حال بارگذاری رازمایی...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-slate-600">رازمایی مورد نظر یافت نشد.</p>
        <Button onClick={() => navigate("/mystery")}>بازگشت به لیست رازمایی</Button>
      </div>
    );
  }

  const bubbleText = activeSlide?.description?.trim() ?? "";
  const fallbackBubbleText = "به جزئیات نگاه کن؛ هر نشانه‌ای می‌تواند کلید حل راز باشد.";
  const displayBubbleText = bubbleText || fallbackBubbleText;
  const answerable = activeSlideId !== -1;
  const canSend = !!inputValue.trim() && !isSending && answerable;
  const totalSlides = slides.length;

  const slideVariants = {
    enter: ({ dir, offset }: { dir: "next" | "prev"; offset: { x: number; y: number } }) => ({
      opacity: 0,
      scale: 0.9,
      x: dir === "next" ? offset.x : -offset.x,
      y: dir === "next" ? offset.y : -offset.y,
    }),
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
    },
    exit: ({ dir, offset }: { dir: "next" | "prev"; offset: { x: number; y: number } }) => ({
      opacity: 0,
      scale: 0.92,
      x: dir === "next" ? -offset.x * 0.8 : offset.x * 0.8,
      y: dir === "next" ? -offset.y * 0.8 : offset.y * 0.8,
    }),
  };

  const textVariants = {
    hidden: ({ dir, offset }: { dir: "next" | "prev"; offset: { x: number; y: number } }) => ({
      opacity: 0,
      x: dir === "next" ? offset.x * 0.35 : -offset.x * 0.35,
      y: dir === "next" ? offset.y * 0.35 : -offset.y * 0.35,
    }),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
    },
  };

  const entryOffsets = [
    { x: 160, y: -180 },
    { x: -170, y: 200 },
    { x: 190, y: 160 },
    { x: -180, y: -160 },
  ];
  const activeOffset = entryOffsets[activeIndex % entryOffsets.length];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 md:px-8">
          <div className="space-y-2 text-right">
            <p className="text-xs font-semibold text-purple-300">رازمایی</p>
            <h1 className="text-3xl font-bold md:text-4xl">{test.name}</h1>
            <p className="text-xs text-white/60">رازمَستر: {test.guide_name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="bg-purple-500 text-white hover:bg-purple-600"
              onClick={handleProceedToSupplementary}
              disabled={!answerable || actionableSlides.length === 0}
            >
              ادامه به سوالات تکمیلی
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
              onClick={startSession}
              disabled={isStartingSession}
            >
              {isStartingSession && <Loader2 className="h-4 w-4 animate-spin" />}
              شروع تحلیل تعاملی
            </Button>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-white/70 hover:text-white"
              onClick={() => navigate("/mystery")}
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
          </div>
        </div>
      </header>

      <main className="space-y-16 pb-24">
        <section className="mx-auto w-full max-w-6xl px-4 pt-10 text-right md:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">پیش از شروع...</h2>
            <p className="mt-4 text-sm leading-7 text-white/80 md:text-base md:leading-8">
              {test.short_description}
            </p>
            <div className="mt-6 rounded-2xl border border-purple-200/30 bg-purple-500/10 p-6 text-sm leading-7 text-purple-100">
              <p className="font-semibold text-purple-200">پیام رازمَستر:</p>
              <p className="mt-3 whitespace-pre-line">{test.intro_message}</p>
            </div>
          </div>
        </section>

        <section
          ref={sliderRef}
          className="mx-auto w-full max-w-6xl px-4 md:px-8"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="relative h-[60vh] overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/40 shadow-[0_28px_52px_rgba(15,23,42,0.45)] lg:h-[72vh]">
              <AnimatePresence mode="wait" custom={{ dir: direction, offset: activeOffset }}>
                <motion.div
                  key={activeSlide?.id ?? `slide-${activeIndex}`}
                  className="absolute inset-0"
                  custom={{ dir: direction, offset: activeOffset }}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 80, damping: 20, duration: 0.8 }}
                  onAnimationComplete={() => setIsTransitioning(false)}
                >
                  <div className="absolute inset-0">
                    {activeSlide?.image_url ? (
                      <img
                        src={activeSlide.image_url}
                        alt={activeSlide.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/55 to-slate-950/85" />
                  </div>
                  <motion.div
                    className="absolute inset-x-0 top-0 flex flex-col gap-6 px-8 py-10 text-right md:px-12"
                    variants={textVariants}
                    custom={{ dir: direction, offset: activeOffset }}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.7, delay: 0.1 }}
                  >
                    <span className="self-start rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs text-white/70">
                      تصویر {activeIndex + 1} از {totalSlides}
                    </span>
                    <h2 className="text-3xl font-bold text-white md:text-4xl">
                      {activeSlide?.title?.trim() || `تصویر ${activeIndex + 1}`}
                    </h2>
                  </motion.div>
                  {displayBubbleText && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-6 sm:justify-end md:bottom-10 md:px-12">
                      <div className="w-full max-w-[420px]">
                        <MysteryNarrationBubble message={displayBubbleText} />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-6 flex justify-center px-6 md:bottom-8 md:px-12">
                <div className="flex items-center gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      className={`h-1.5 w-8 rounded-full transition-all ${
                        index === activeIndex
                          ? "bg-white"
                          : index < activeIndex
                          ? "bg-emerald-400/80"
                          : "bg-white/25"
                      }`}
                      onClick={() => handleChangeSlide(index)}
                      aria-label={`مشاهده تصویر ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <aside
              data-chat-panel="true"
              className="flex h-[60vh] flex-col rounded-[28px] border border-white/10 bg-white/10 p-6 text-right text-white shadow-[0_18px_36px_rgba(15,23,42,0.35)] backdrop-blur lg:h-[72vh]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-white/60">تحلیل تصویر</p>
                  <h3 className="text-lg font-semibold text-white">
                    {activeSlide?.title?.trim() || `تصویر ${activeIndex + 1}`}
                  </h3>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] text-white/70">
                  {activeConversation.length} گفت‌وگو
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-[0.75rem] text-white/75">
                <Sparkles className="h-4 w-4 text-purple-200" />
                <span>
                  برداشت خودت را بنویس؛ رازمَستر بلافاصله سوال تکمیلی مرتبط می‌پرسد.
                </span>
              </div>

              <div
                ref={chatScrollRef}
                className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/5 p-4"
              >
                {introMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex justify-start"
                  >
                    <div className="max-w-[90%] rounded-3xl bg-white/90 px-4 py-3 text-sm leading-6 text-slate-800 shadow">
                      {message.content}
                    </div>
                  </div>
                ))}

                {activeConversation.length === 0 && !sessionInfo && (
                  <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-xs leading-6 text-white/70">
                    برای هر تصویر توضیحی بنویس. اگر وارد حساب نشده باشی، ابتدا روی «شروع تحلیل
                    تعاملی» بزن. پس از ارسال پاسخ، رازمَستر در لحظه سوال تکمیلی مرتبط می‌پرسد.
                  </div>
                )}

                {activeConversation.map((message) => {
                  const isAssistant = message.role === "assistant";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-6 shadow ${
                          isAssistant
                            ? "bg-white/90 text-slate-900"
                            : "bg-purple-500 text-white"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })}

                {pendingAssistant && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-3xl bg-white/80 px-4 py-2 text-[0.75rem] font-medium text-slate-700 shadow">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      رازمَستر در حال فکر کردن است...
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <Textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    answerable
                      ? "برداشت، مشاهدات یا فرضیه‌ات درباره این تصویر را بنویس..."
                      : "در حال حاضر تصویری برای تحلیل وجود ندارد."
                  }
                  disabled={!answerable || isSending}
                  rows={4}
                  className="min-h-[120px] resize-none rounded-3xl border border-white/15 bg-white/10 text-sm text-white placeholder:text-white/50 focus-visible:ring-purple-400/60 disabled:opacity-70"
                />
                <div className="flex items-center justify-between gap-3">
                  <Button
                    onClick={handleSend}
                    disabled={!canSend}
                    className="flex items-center gap-2 rounded-2xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-60"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    ارسال پاسخ
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs text-white/70 hover:text-white"
                    onClick={handleProceedToSupplementary}
                    disabled={!sessionInfo}
                  >
                    سوالات تکمیلی
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MysteryAssessmentDetail;
