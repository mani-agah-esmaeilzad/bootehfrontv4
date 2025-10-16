// src/pages/MysteryAssessmentDetail.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoaderCircle, ArrowLeft } from "lucide-react";
import { getMysteryTest, resolveApiAssetUrl } from "@/services/apiService";
import type { MysteryTestDetail } from "@/types/mystery";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

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
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<number | null>(null);

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

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleWheel = (event: WheelEvent) => {
      if (isTransitioning) return;
      if (event.deltaY > 12 && activeIndex < slides.length - 1) {
        event.preventDefault();
        handleChangeSlide(activeIndex + 1);
      } else if (event.deltaY < -12 && activeIndex > 0) {
        event.preventDefault();
        handleChangeSlide(activeIndex - 1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
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
      touchStartRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const startY = touchStartRef.current;
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

  const handleStart = () => {
    if (!test) return;
    const redirect = `/mystery/${test.slug}/chat`;
    if (!ensureAuth(redirect)) {
      return;
    }
    navigate(redirect);
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

  const progress = slides.map((_, index) => index <= activeIndex);

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
            <Button className="bg-purple-500 text-white hover:bg-purple-600" onClick={handleStart}>
              شروع گفتگو با رازمَستر
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
              key={slides[activeIndex].id ?? `slide-${activeIndex}`}
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
                {slides[activeIndex].image_url ? (
                  <img
                    src={slides[activeIndex].image_url}
                    alt={slides[activeIndex].title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/60 to-slate-950/85" />
              </div>
              <motion.div
                className="relative z-10 flex h-full flex-col justify-end gap-6 px-6 pb-24 text-right md:px-16"
                variants={textVariants}
                custom={{ dir: direction, offset: activeOffset }}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <span className="self-start rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs text-white/70">
                  تصویر {activeIndex + 1} از {slides.length}
                </span>
                <h2 className="text-3xl font-bold text-white md:text-5xl">{slides[activeIndex].title}</h2>
                <p className="max-w-2xl text-sm leading-8 text-white/80 md:text-base">
                  {slides[activeIndex].description || "به جزئیات نگاه کن؛ هر نشانه‌ای می‌تواند کلید حل راز باشد."}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                {progress.map((isActive, index) => (
                  <span
                    key={index}
                    className={`h-1 w-10 rounded-full transition-colors ${
                      index === activeIndex ? 'bg-white' : isActive ? 'bg-white/50' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-white/60">برای دیدن تصویر بعدی اسکرول یا سوایپ کن</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl rounded-[32px] border border-white/10 bg-white/5 p-10 text-right text-white/80 backdrop-blur md:px-12">
          <h3 className="text-2xl font-semibold text-white">زمان کشف فرارسیده است</h3>
          <p className="mt-4 text-sm leading-7 md:text-base">
            هر پاسخی که در گفتگو با رازمَستر می‌دهی ثبت و تحلیل می‌شود. با دقت روایت کن، سرنخ‌ها را به هم وصل کن و فرضیه‌هایت را به چالش بکش. در پایان، گزارشی اختصاصی از نگاه تحلیلی تو دریافت خواهی کرد.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3 text-xs text-white/60">
            <span className="rounded-full border border-white/20 px-3 py-1">پاسخ‌ها محفوظ می‌ماند</span>
            <span className="rounded-full border border-white/20 px-3 py-1">گزارش اختصاصی تولید می‌شود</span>
          </div>
          <Button className="mt-8 bg-purple-500 text-white hover:bg-purple-600" onClick={handleStart}>
            شروع گفتگو با رازمَستر
          </Button>
        </section>
      </main>
    </div>
  );
};

export default MysteryAssessmentDetail;
