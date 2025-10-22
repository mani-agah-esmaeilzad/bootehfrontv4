// src/pages/MysteryAssessmentDetail.tsx

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoaderCircle, ArrowLeft, ImagePlus, Trash2, CheckCircle2 } from "lucide-react";
import { getMysteryTest, resolveApiAssetUrl } from "@/services/apiService";
import type { MysteryTestDetail } from "@/types/mystery";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const MysteryNarrationBubble = ({ message }: { message: string }) => {
  return (
    <div className="relative w-full select-none">
      <img
        src="/linkedin.jpeg"
        alt=""
        className="h-auto w-full pointer-events-none drop-shadow-[0_28px_52px_rgba(15,23,42,0.35)]"
        draggable={false}
      />
      <div className="absolute inset-x-[12%] top-[18%] bottom-[22%] flex items-center justify-center px-2 md:inset-x-[13%] md:top-[16%] md:bottom-[20%]">
        <p className="text-right text-[0.9rem] leading-7 text-slate-800 whitespace-pre-wrap font-medium drop-shadow-[0_1px_3px_rgba(255,255,255,0.6)] md:text-[1rem] md:leading-8">
          {message}
        </p>
      </div>
    </div>
  );
};

type SlideAnswer = {
  text: string;
  file: File | null;
  preview: string | null;
};

const MysteryAssessmentDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [test, setTest] = useState<MysteryTestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error: any) {
        toast.error(error.message || "خطا در دریافت اطلاعات رازمایی");
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
        description: "برای ادامه می‌توانید مستقیم به گفتگو بروید.",
        image_url: "",
        display_order: 0,
      },
    ];
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [answers, setAnswers] = useState<Record<number, SlideAnswer>>({});
  const [completionAnswers, setCompletionAnswers] = useState({
    narrative: "",
    missingDetails: "",
    finalThoughts: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const finalSectionRef = useRef<HTMLDivElement | null>(null);
  const actionableSlides = useMemo(() => slides.filter((slide) => slide.id !== -1), [slides]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const slideIds = new Set(slides.map((slide) => slide.id));
    setAnswers((prev) => {
      const next: Record<number, SlideAnswer> = {};
      slides.forEach((slide) => {
        next[slide.id] = prev[slide.id] ?? { text: "", file: null, preview: null };
      });
      Object.entries(prev).forEach(([key, value]) => {
        const id = Number(key);
        if (!slideIds.has(id) && value?.preview) {
          previewUrlsRef.current.delete(value.preview);
          URL.revokeObjectURL(value.preview);
        }
      });
      return next;
    });
  }, [slides]);

  const handleChangeSlide = (nextIndex: number) => {
    if (nextIndex === activeIndex || nextIndex < 0 || nextIndex >= slides.length) {
      return;
    }
    setDirection(nextIndex > activeIndex ? "next" : "prev");
    setActiveIndex(nextIndex);
    setIsTransitioning(true);
  };

  const handleAnswerChange = (slideId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [slideId]: {
        ...(prev[slideId] ?? { text: "", file: null, preview: null }),
        text: value,
      },
    }));
  };

  const updateSlideAttachment = (slideId: number, file: File | null) => {
    setAnswers((prev) => {
      const previous = prev[slideId] ?? { text: "", file: null, preview: null };
      if (previous.preview) {
        previewUrlsRef.current.delete(previous.preview);
        URL.revokeObjectURL(previous.preview);
      }
      let preview: string | null = null;
      if (file) {
        preview = URL.createObjectURL(file);
        previewUrlsRef.current.add(preview);
      }
      return {
        ...prev,
        [slideId]: {
          ...previous,
          file,
          preview,
        },
      };
    });
  };

  const handleAttachmentInput = (slideId: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    updateSlideAttachment(slideId, file);
    event.target.value = "";
  };

  const handleAttachmentRemove = (slideId: number) => {
    updateSlideAttachment(slideId, null);
  };

  const scrollToReview = () => {
    finalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement && !!target.closest('[data-slide-interactive="true"]');

  const handleCompletionChange = (field: keyof typeof completionAnswers, value: string) => {
    setCompletionAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleWheel = (event: WheelEvent) => {
      if (isTransitioning) return;
      if (isInteractiveTarget(event.target)) return;
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
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
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
      if (isInteractiveTarget(event.target)) {
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

  const ensureAuth = (redirectTo: string) => {
    const isLoggedIn = !!localStorage.getItem("isLoggedIn") || !!localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      toast.info("برای شروع رازمایی ابتدا وارد حساب کاربری خود شوید.");
      navigate("/login", { state: { redirectTo } });
      return false;
    }
    return true;
  };

  const handleSubmitAll = async () => {
    if (!test) return;
    const redirect = `/mystery/${test.slug}`;
    if (!ensureAuth(redirect)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const packagedAnswers = actionableSlides.map((slide) => ({
        imageId: slide.id,
        title: slide.title,
        answer: answers[slide.id]?.text ?? "",
        hasAttachment: !!answers[slide.id]?.file,
      }));
      const payload = {
        testId: test.id,
        testName: test.name,
        answers: packagedAnswers,
        completion: completionAnswers,
      };
      sessionStorage.setItem(`mysteryDraft_${test.slug}`, JSON.stringify(payload));
      await new Promise((resolve) => setTimeout(resolve, 650));
      toast.success("پاسخ‌ها برای تحلیل ثبت شد. نتیجه نهایی به زودی آماده می‌شود.");
    } catch (error: any) {
      console.error("Failed to store mystery draft", error);
      toast.error(error?.message || "خطا در ذخیره‌ی پاسخ‌ها");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const slideVariants = {
    enter: ({ dir, offset }: { dir: 'next' | 'prev'; offset: { x: number; y: number } }) => ({
      opacity: 0,
      scale: 0.9,
      x: dir === 'next' ? offset.x : -offset.x,
      y: dir === 'next' ? offset.y : -offset.y,
    }),
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
    },
    exit: ({ dir, offset }: { dir: 'next' | 'prev'; offset: { x: number; y: number } }) => ({
      opacity: 0,
      scale: 0.92,
      x: dir === 'next' ? -offset.x * 0.8 : offset.x * 0.8,
      y: dir === 'next' ? -offset.y * 0.8 : offset.y * 0.8,
    }),
  };

  const textVariants = {
    hidden: ({ dir, offset }: { dir: 'next' | 'prev'; offset: { x: number; y: number } }) => ({
      opacity: 0,
      x: dir === 'next' ? offset.x * 0.35 : -offset.x * 0.35,
      y: dir === 'next' ? offset.y * 0.35 : -offset.y * 0.35,
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

  const activeSlide = slides[activeIndex] ?? slides[0];
  const bubbleText = activeSlide?.description?.trim() ?? "";
  const fallbackBubbleText = "به جزئیات نگاه کن؛ هر نشانه‌ای می‌تواند کلید حل راز باشد.";
  const displayBubbleText = bubbleText || fallbackBubbleText;
  const answeredCount = useMemo(() => {
    return actionableSlides.reduce((count, slide) => {
      const answer = answers[slide.id];
      if (!answer) return count;
      if (answer.text.trim() || answer.file) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [actionableSlides, answers]);
  const completionAnsweredCount = useMemo(() => {
    return Object.values(completionAnswers).reduce((count, value) => (value.trim() ? count + 1 : count), 0);
  }, [completionAnswers]);
  const totalInteractionCount = actionableSlides.length + Object.keys(completionAnswers).length;
  const totalAnswersProvided = answeredCount + completionAnsweredCount;
  const overallProgressPercent =
    totalInteractionCount === 0 ? 0 : Math.round((totalAnswersProvided / totalInteractionCount) * 100);
  const activeSlideId = activeSlide?.id ?? -1;
  const activeAnswer = answers[activeSlideId] ?? { text: "", file: null, preview: null };
  const questionPrompt =
    activeSlide?.description?.trim() ||
    test?.bubble_prompt?.trim() ||
    "برایت چه نکته‌ای در این تصویر بیش از همه برجسته است؟ شرح بده.";
  const helperNote = activeSlide?.ai_notes?.trim();
  const answerFieldId = `answer-${activeSlideId}`;
  const uploadFieldId = `upload-${activeSlideId}`;
  const slideProgress = useMemo(
    () =>
      slides.map((slide, index) => {
        const answer = answers[slide.id];
        const isAnswered = !!(answer && (answer.text.trim() || answer.file));
        return {
          index,
          isActive: index === activeIndex,
          isAnswered,
        };
      }),
    [slides, answers, activeIndex]
  );
  const hasLocalAttachments = actionableSlides.some((slide) => !!answers[slide.id]?.file);

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
            <Button className="bg-purple-500 text-white hover:bg-purple-600" onClick={scrollToReview}>
              ثبت و مرور پاسخ‌ها
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

      <main className="space-y-20 pb-24">
        <section className="mx-auto w-full max-w-6xl px-4 pt-10 text-right md:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">پیش از شروع...</h2>
            <p className="mt-4 text-sm leading-7 text-white/80 md:text-base md:leading-8">{test.short_description}</p>
            <div className="mt-6 rounded-2xl border border-purple-200/30 bg-purple-500/10 p-6 text-sm leading-7 text-purple-100">
              <p className="font-semibold text-purple-200">پیام رازمَستر:</p>
              <p className="mt-3 whitespace-pre-line">{test.intro_message}</p>
            </div>
          </div>
        </section>

        <section ref={sliderRef} className="relative h-screen w-full overflow-hidden">
          <AnimatePresence mode="wait" custom={{ dir: direction, offset: activeOffset }}>
            <motion.div
              key={activeSlide?.id ?? `slide-${activeIndex}`}
              className="absolute inset-0"
              custom={{ dir: direction, offset: activeOffset }}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 80, damping: 20, duration: 0.8 }}
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
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/60 to-slate-950/85" />
              </div>
              <motion.div
                className="relative z-10 flex h-full flex-col justify-end gap-6 px-6 pb-[260px] text-right md:px-16"
                variants={textVariants}
                custom={{ dir: direction, offset: activeOffset }}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <span className="self-start rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs text-white/70">
                  تصویر {activeIndex + 1} از {slides.length}
                </span>
                <h2 className="text-3xl font-bold text-white md:text-5xl">
                  {activeSlide?.title?.trim() || `تصویر ${activeIndex + 1}`}
                </h2>
                <p className="sr-only">{displayBubbleText}</p>
              </motion.div>
              <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-8 md:px-16">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:flex-row-reverse sm:items-end">
                  <AnimatePresence mode="wait">
                    {displayBubbleText && (
                      <motion.div
                        key={`bubble-${activeSlideId}`}
                        className="pointer-events-none w-full sm:max-w-[360px]"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      >
                        <MysteryNarrationBubble message={displayBubbleText} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`answer-${activeSlideId}`}
                      data-slide-interactive="true"
                      className="pointer-events-auto w-full sm:max-w-[420px]"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 24 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <div className="rounded-3xl border border-white/15 bg-white/90 p-5 text-right text-slate-900 shadow-2xl backdrop-blur">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-purple-600">سوال تصویر {activeIndex + 1}</p>
                            <p className="text-sm leading-6 text-slate-700">{questionPrompt}</p>
                          </div>
                          {helperNote && (
                            <p className="rounded-2xl bg-purple-50/80 px-3 py-2 text-[0.75rem] leading-5 text-purple-700 shadow-inner">
                              {helperNote}
                            </p>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor={answerFieldId} className="text-xs font-semibold text-slate-500">
                              پاسخ خودت را بنویس
                            </Label>
                            <Textarea
                              id={answerFieldId}
                              value={activeAnswer.text}
                              onChange={(event) => handleAnswerChange(activeSlideId, event.target.value)}
                              placeholder="آنچه می‌بینی، احساس می‌کنی یا حدس می‌زنی را با جزئیات بنویس..."
                              rows={4}
                              className="min-h-[140px] resize-none rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-900 focus-visible:ring-purple-500/60"
                            />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <input
                                id={uploadFieldId}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => handleAttachmentInput(activeSlideId, event)}
                              />
                              <Label
                                htmlFor={uploadFieldId}
                                className="flex cursor-pointer items-center gap-2 rounded-full border border-purple-200/70 bg-purple-50/70 px-4 py-2 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
                              >
                                <ImagePlus className="h-4 w-4" />
                                افزودن تصویر تکمیلی
                              </Label>
                            </div>
                            {activeAnswer.file && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 text-xs text-rose-500 hover:text-rose-600"
                                onClick={() => handleAttachmentRemove(activeSlideId)}
                              >
                                <Trash2 className="h-4 w-4" />
                                حذف ضمیمه
                              </Button>
                            )}
                          </div>
                          {activeAnswer.preview && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
                              <img
                                src={activeAnswer.preview}
                                alt="پیش‌نمایش ضمیمه"
                                className="h-40 w-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="mt-6 flex flex-col items-center gap-3 text-xs text-white/70 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-2">
                    {slideProgress.map(({ index, isActive, isAnswered }) => (
                      <span
                        key={index}
                        className={`h-1.5 w-10 rounded-full transition-colors ${
                          isActive ? "bg-white" : isAnswered ? "bg-emerald-400/80" : "bg-white/25"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[0.7rem] leading-5 text-white/60">برای دیدن تصویر بعدی اسکرول یا سوایپ کن</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="mx-auto w-full max-w-5xl rounded-[32px] border border-white/10 bg-white/5 p-10 text-right text-white/80 backdrop-blur md:px-12">
          <h3 className="text-2xl font-semibold text-white">سوالات تکمیلی برای جمع‌بندی</h3>
          <p className="mt-4 text-sm leading-7 md:text-base">
            برای کامل شدن تحلیل، به پرسش‌های زیر پاسخ بده. این توضیحات اضافه به رازمَستر کمک می‌کند تا تصویر کامل‌تری از استدلالت داشته باشد.
          </p>
          <div className="mt-8 grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="completion-narrative" className="text-sm font-semibold text-white/90">
                روایت کلی تو از ماجرا چیست؟
              </Label>
              <Textarea
                id="completion-narrative"
                rows={4}
                value={completionAnswers.narrative}
                onChange={(event) => handleCompletionChange("narrative", event.target.value)}
                placeholder="اگر بخواهی داستان را برای کسی تعریف کنی، از کجا شروع می‌کنی و چه نتیجه‌ای می‌گیری؟"
                className="min-h-[130px] rounded-3xl border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/50 focus-visible:ring-purple-400/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completion-missing" className="text-sm font-semibold text-white/90">
                چه سرنخ یا اطلاعاتی هنوز برایت مبهم است؟
              </Label>
              <Textarea
                id="completion-missing"
                rows={3}
                value={completionAnswers.missingDetails}
                onChange={(event) => handleCompletionChange("missingDetails", event.target.value)}
                placeholder="اگر زمان یا ابزار بیشتری داشتی، دنبال چه چیزی می‌گشتی؟"
                className="min-h-[110px] rounded-3xl border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/50 focus-visible:ring-purple-400/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completion-final" className="text-sm font-semibold text-white/90">
                نکته نهایی یا دلیلی که باید حتماً گفته شود؟
              </Label>
              <Textarea
                id="completion-final"
                rows={3}
                value={completionAnswers.finalThoughts}
                onChange={(event) => handleCompletionChange("finalThoughts", event.target.value)}
                placeholder="هر چیزی که احساس می‌کنی در پاسخ‌هایت جا مانده را همین‌جا اضافه کن."
                className="min-h-[110px] rounded-3xl border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/50 focus-visible:ring-purple-400/70"
              />
            </div>
          </div>
        </section>

        <section
          ref={finalSectionRef}
          className="mx-auto w-full max-w-5xl rounded-[32px] border border-white/10 bg-white/5 p-10 text-right text-white/80 backdrop-blur md:px-12"
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-5 md:max-w-[55%]">
              <h3 className="text-2xl font-semibold text-white">مرور نهایی و آماده‌سازی تحلیل</h3>
              <p className="text-sm leading-7 md:text-base">
                تا این لحظه {answeredCount} پاسخ برای تصاویر و {completionAnsweredCount} یادداشت تکمیلی ثبت شده است.
              </p>
              <div className="rounded-3xl border border-white/15 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>پیشرفت کلی</span>
                  <span>%{overallProgressPercent}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-purple-400 transition-all"
                    style={{ width: `${Math.min(100, overallProgressPercent)}%` }}
                  />
                </div>
                <ul className="mt-4 space-y-2 text-xs text-white/65">
                  {actionableSlides.map((slide) => {
                    const answer = answers[slide.id];
                    const isAnswered = !!(answer && (answer.text.trim() || answer.file));
                    return (
                      <li key={slide.id} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 ${isAnswered ? "text-emerald-400" : "text-white/30"}`}
                        />
                        <span className="leading-6">
                          {slide.title?.trim() || `تصویر ${slide.display_order + 1}`}{" "}
                          {isAnswered ? "— آماده شد." : "— منتظر پاسخ."}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {hasLocalAttachments && (
                <p className="text-[0.7rem] leading-5 text-amber-200/80">
                  ضمیمه‌های تصویری فعلاً فقط روی دستگاهت نگه‌داری می‌شوند؛ در مرحله بعد می‌توانی آن‌ها را ارسال کنی.
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-4 md:max-w-[40%]">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 text-sm leading-7">
                <p className="font-semibold text-white">قبل از ارسال:</p>
                <ul className="mt-3 space-y-2 text-white/70">
                  <li>پاسخ‌های مربوط به هر تصویر را یک بار دیگر مرور کن.</li>
                  <li>اگر جزئیاتی جا مانده، در بخش تکمیلی بنویس.</li>
                  <li>بعد از ذخیره، رازمَستر تحلیل نهایی را بر اساس همین داده‌ها انجام می‌دهد.</li>
                </ul>
              </div>
              <Button
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-purple-500 py-3 text-base font-semibold text-white hover:bg-purple-600 disabled:opacity-70"
              >
                {isSubmitting && <LoaderCircle className="h-5 w-5 animate-spin text-white" />}
                {isSubmitting ? "در حال ذخیره..." : "ثبت برای تحلیل رازمَستر"}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MysteryAssessmentDetail;
