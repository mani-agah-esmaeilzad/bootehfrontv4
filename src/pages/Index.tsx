import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  LineChart,
  LoaderCircle,
  Menu,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { getBlogPosts } from "@/services/apiService";
import type { BlogPostSummary } from "@/types/blog";

const formatPersianDate = (value: string | null | undefined) => {
  if (!value) return "در انتظار انتشار";
  try {
    return new Date(value).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "در انتظار انتشار";
  }
};

const heroStats = [
  { label: "سازمان‌های همکار", value: "۴۲+" },
  { label: "جلسات تحلیل‌شده", value: "۱۲٬۸۰۰" },
  { label: "رضایت مدیران", value: "۹۶٪" },
];

const capabilityCards = [
  {
    icon: BookOpen,
    title: "گزارش های جامع",
    description:
      "گزارش های جامع با قابلیت شخصی سازی متناسب با نیازهای کاربران مختلف به همراه قابلیت فردی, گروهی و سازمانی",
  },
  {
    icon: PanelsTopLeft,
    title: "شخصی و بومی سازی شده",
    description:
      "ارزیابی های مبتنی بر واقعیت متناسب با شغل. جنسیت و سن افراد و نیازهای سازمان",
  },
  {
    icon: BarChart3,
    title: "تطبیق با نقشه شایستگی سازمان",
    description:
      "شایستگی های مورد سنجش بر اساس نقشه شایستگی سازمان طراح و افراد بر اساس ملاک های سازمان مورد آزمون قرار می گیرند.",
  },
];

const pathMilestones = [
  { title: "سنجش بر مبنای عملکرد", caption: "هر کاربر یک سفر منحصر به فرد و سفارشی را تجربه می کند. و بینش بی طرفانه ای را در مورد قابلیت های خود دریافت می کند." },
  { title: "کارنامه عملکرد بدون سوگیری و منحصر به فرد", caption: "ارائه نتایج کامل عملکرد برای هر فرد در شایستگی های مدنظر, با برجسته کردن نقاط قوت و زمینه رشد او" },
  { title: "حذف فشار زمانی و استرس آزمون", caption: "با فراهم سازی دسترسی ۲۴ ساعته, کاربر در زمان های مناسب میتواند شایستگی های مختلف خود را بیازماید" },
];

const chartGallery = [
  {
    title: "مدیران",
    description: "ارزیابی مداوم و دوره ای شایستگی ها در مسیر سفر سازمانی کارکنان",
    accent: "from-purple-500/20 via-white to-white",
    chart: (
      <svg viewBox="0 0 220 120" className="h-32 w-full text-purple-600">
        <defs>
          <linearGradient id="chartGradientPulse" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(124,58,237,0.25)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0.05)" />
          </linearGradient>
        </defs>
        <path
          d="M0 90 Q40 40 80 55 T160 45 T220 35"
          fill="url(#chartGradientPulse)"
          stroke="none"
        />
        <polyline
          points="0,90 30,70 60,50 90,60 120,40 150,50 180,38 210,42"
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "استخدام کنندگان",
    description: "تعریف شایستگی های مورد نیاز هر شغل و اطمینان از تطبیق آن با شایستگی های شاغل",
    accent: "from-slate-900/10 via-white to-purple-200/20",
    chart: (
      <svg viewBox="0 0 220 120" className="h-32 w-full text-slate-900">
        <polyline
          points="0,80 40,45 80,65 120,35 160,50 200,30 220,40"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {[0, 40, 80, 120, 160, 200].map((x, index) => (
          <circle
            key={x}
            cx={x + 10}
            cy={[78, 45, 62, 38, 54, 34][index]}
            r={5}
            fill="currentColor"
            className="opacity-70"
          />
        ))}
      </svg>
    ),
  },
  {
    title: "کارجویان",
    description: "برای کسب شناخت از شایستگی های فعلی و میزان تناسب آنها با چشم انداز شغلی و برنامه ریزی برای تقویت شایستگی های مدنظر",
    accent: "from-purple-600/15 via-white to-slate-900/10",
    chart: (
      <svg viewBox="0 0 220 120" className="h-32 w-full text-purple-600">
        {[20, 60, 100, 140, 180].map((x, index) => (
          <rect
            key={x}
            x={x - 8}
            y={110 - (index + 2) * 14}
            width={16}
            height={(index + 2) * 14}
            rx={6}
            fill="currentColor"
            className="opacity-70"
          />
        ))}
        <path
          d="M20 86 Q60 70 100 60 T180 30"
          stroke="rgba(15,23,42,0.4)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const insightStories = [
  {
    title: "گزارش آمادگی تیم",
    description: "نمایش لحظه‌ای اعتماد و تمرکز هر نقش در پایان جلسه ارزیابی.",
    metric: "۸۸٪",
    label: "شاخص آمادگی",
  },
  {
    title: "نقشه مهارت",
    description: "مقایسه رشد مهارت‌های نرم بین مدیران و اعضای تیم در بازه‌های ماهانه.",
    metric: "۲.۴x",
    label: "شتاب رشد",
  },
  {
    title: "نقشه اقدام بعدی",
    description: "پیشنهاد خودکار گام‌های بعدی بر اساس الگوهای موفقیت سازمان‌های مشابه.",
    metric: "۲۱",
    label: "توصیه فعال",
  },
];

const footerLinks = [
  {
    title: "لینک های مرتبط",
    items: ["بلاگ", "کاربران ما", "اچ آر لرنیوم", "اچ آر 720"],
  },

  {
    title: "ارتباط با ما",
    items: ["نشانی: تهران, چهارراه جهان کودک, بزرگراه حقانی, مرکز رشد دانشگاه علامه طباطبائی", "شماره تماس: ۰۲۱۷۱۰۵۸۷۲۰", "ایمیل: info@hrbooteh.com", "ما را در شکبه های اجتماعی دنبال کنید: "],
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [latestPosts, setLatestPosts] = useState<BlogPostSummary[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      setIsLoadingBlogs(true);
      try {
        const response = await getBlogPosts(3);
        if (response.success) {
          setLatestPosts(response.data);
        } else {
          console.error("Blog fetch error:", response.message);
        }
      } catch (error) {
        console.error("Blog fetch error:", error);
      } finally {
        setIsLoadingBlogs(false);
      }
    };

    fetchLatestPosts();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-purple-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <div className="flex items-center gap-8">
            <Logo variant="large" />
            <nav className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
              <a className="transition hover:text-slate-900" href="#hero">
                درباره ما
              </a>
              <a className="transition hover:text-slate-900" href="#blog">
                بلاگ
              </a>
              <a className="transition hover:text-slate-900" href="#path">
                تماس با ما
              </a>
              <button
                type="button"
                className="transition hover:text-slate-900"
                onClick={() => navigate("/personality")}
              >
                آزمون‌های شخصیتی
              </button>
              <a className="transition hover:text-slate-900" href="#insights">
                بینش‌ها
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Button
              variant="link"
              className="px-0 text-sm font-medium text-slate-600 hover:text-slate-900"
              onClick={() => navigate("/login")}
            >
              ورود
            </Button>
            <Button
              variant="default"
              className="flex items-center gap-2 bg-purple-600 px-5 text-white hover:bg-purple-700"
              onClick={() => navigate("/register")}
            >
              شروع کنید
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </Button>
          </div>
        </div>
      </header>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm md:hidden">
          <div className="flex items-center justify-between border-b border-purple-100 px-4 py-4">
            <Logo variant="large" />
            <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
              <X className="h-5 w-5 text-slate-700" />
            </Button>
          </div>
          <div className="space-y-4 px-6 py-6 text-right text-sm text-slate-600">
            <a className="block rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-900" href="#hero" onClick={closeMobileMenu}>
              درباره ما
            </a>
            <a className="block rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-900" href="#blog" onClick={closeMobileMenu}>
              بلاگ
            </a>
            <a className="block rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-900" href="#path" onClick={closeMobileMenu}>
              تماس با ما
            </a>
            <button
              type="button"
              className="block w-full rounded-2xl bg-purple-50 px-4 py-3 text-right font-semibold text-purple-700"
              onClick={() => {
                navigate("/personality");
                closeMobileMenu();
              }}
            >
              آزمون‌های شخصیتی
            </button>
            <a className="block rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-900" href="#insights" onClick={closeMobileMenu}>
              بینش‌ها
            </a>
            <div className="mt-4 flex flex-col gap-3">
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700"
                onClick={() => {
                  navigate("/login");
                  closeMobileMenu();
                }}
              >
                ورود
              </Button>
              <Button
                className="bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => {
                  navigate("/register");
                  closeMobileMenu();
                }}
              >
                شروع کنید
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="space-y-32 pb-24">
        <section
          id="hero"
          className="relative overflow-hidden border-b border-purple-100/60 bg-gradient-to-bl from-purple-50 via-white to-white"
        >
          <div className="absolute inset-0">
            <svg className="h-full w-full" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 640C120 560 280 520 440 540C600 560 720 640 900 660C1080 680 1260 640 1440 560V800H0V640Z"
                fill="url(#heroBackground)"
              />
              <path
                d="M0 520C160 440 320 420 480 460C640 500 820 620 980 620C1140 620 1290 520 1440 480"
                stroke="rgba(124,58,237,0.18)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="heroBackground" x1="0" y1="400" x2="1440" y2="800" gradientUnits="userSpaceOnUse">
                  <stop stopColor="rgba(124,58,237,0.12)" />
                  <stop offset="1" stopColor="rgba(79,70,229,0.05)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="relative mx-auto grid w-full max-w-6xl gap-16 px-4 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-6">
            <div className="space-y-10 text-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/60 bg-white/60 px-4 py-2 text-xs font-medium text-purple-600 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                نسل جدید ارزیابی شایستگی ها
              </span>
              <h1 className="text-4xl font-bold leading-[1.15!important] text-slate-900 md:text-5xl text-center">
                ارزیابی شایستگی ها
                <br />
                <span className="text-slate-700 text-3xl">
                  سرعت،&nbsp;
                  <span className="text-purple-600">
                    دقت
                  </span>
                  ،  کیفیت
                </span>

              </h1>

              {/* <p className="text-lg leading-9 text-slate-600">
                در گذشته زرگر ها برای ذوب کردن طلا یا نقره از ظرفی گلی استفاده می کردند تا ضمن جدا کردن
                ناخالصی ها به آنها شکل بدهند. انسان نیز وقتی در معرض تجربه جدید قرار می گیرد در حقیقت در بوته آزمایشی نو است تا استعداد بالقوه ی وی ظاهر شود.
              </p> */}
              {/* <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="default"
                  className="w-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 hover:shadow-lg sm:w-auto"
                  onClick={() => navigate("/register")}
                >
                  رزرو جلسه معرفی
                </Button>
                <Button
                  variant="outline"
                  className="w-full border border-purple-200 px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 sm:w-auto"
                  onClick={() => navigate("/login")}
                >
                  مشاهده دمو
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div> */}
              <div className="grid gap-4 sm:grid-cols-3">
                {heroStats.map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-purple-100 bg-white/80 px-6 py-6 text-center shadow-sm backdrop-blur"
                  >
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />
              <div className="absolute -right-10 bottom-4 h-40 w-40 rounded-full bg-slate-900/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-purple-100/70 bg-white/70 p-8 shadow-xl backdrop-blur-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-slate-500">جلسه فعال</p>
                    <p className="text-2xl font-semibold text-slate-900">گفتگو های تعاملی</p>
                  </div>
                  <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">آنلاین</span>
                </div>
                <div className="relative mt-8">
                  <svg viewBox="0 0 320 200" className="h-56 w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="roadGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(124,58,237,0.4)" />
                        <stop offset="80%" stopColor="rgba(15,23,42,0.2)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,160 C60,140 120,60 160,80 C200,100 240,40 320,60"
                      stroke="url(#roadGradient)"
                      strokeWidth="18"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,160 C60,140 120,60 160,80 C200,100 240,40 320,60"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray="12 12"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {[{ x: 42, y: 142, label: "گام ۳" }, { x: 155, y: 94, label: "گام ۲" }, { x: 272, y: 58, label: "گام ۱" }].map((node) => (
                      <g key={node.label}>
                        <circle cx={node.x} cy={node.y} r={18} fill="#7C3AED" className="opacity-90" />
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          fontSize="12"
                          fill="white"
                          fontWeight="600"
                        >
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                  <div className="absolute inset-x-0 -bottom-4 flex justify-around">
                    {[
                      { title: "شخصی سازی شده", subtitle: "" },
                      { title: "بومی سازی شده", subtitle: "" },
                      { title: "گزارش های حرفه ای", subtitle: "" },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="w-28 rounded-2xl border border-purple-100 bg-white px-4 py-3 text-center text-xs shadow-sm"
                      >
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="rounded-[32px] border border-purple-100 bg-white px-6 py-16 shadow-sm md:px-12">
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="max-w-xl space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">قدرت گرفته از</h2>
                <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">

                  <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                    <PanelsTopLeft className="h-4 w-4 text-purple-500" />
                    هوش مصنوعی
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                    <UsersRound className="h-4 w-4 text-purple-500" />
                    گیمیفیکشن
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                    <ShieldCheck className="h-4 w-4 text-purple-500" />
                    سناریو محیط واقتی
                  </span>
                </div>
              </div>

            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {capabilityCards.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-purple-100/80 bg-purple-50/70 p-7 text-center"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm leading-7 text-slate-700">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="path" className="relative overflow-hidden bg-slate-900 py-20">
          <div className="absolute inset-0 opacity-50">
            <svg viewBox="0 0 1440 400" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 200C160 140 320 120 480 160C640 200 800 320 960 320C1120 320 1280 220 1440 200"
                stroke="url(#journeyGradient)"
                strokeWidth="4"
                fill="none"
              />
              <defs>
                <linearGradient id="journeyGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop stopColor="rgba(167,139,250,0.35)" />
                  <stop offset="1" stopColor="rgba(59,130,246,0.2)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 md:px-6">
            <div className="space-y-4 text-right text-white">
              <h2 className="text-3xl font-bold">بوته چگونه کار می کند?</h2>
              <p className="max-w-2xl text-base leading-7 text-white/85">
                بوته همانند روش های تصویربرداری پزشکی می تواند درک مناسبی از وضعیت شایستگی های کاربران ارائه دهد.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {pathMilestones.map((step, index) => (
                <div key={step.title} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7">
                  <div className="absolute -left-10 top-10 h-24 w-24 rounded-full bg-purple-500/30 blur-2xl" />
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/80">{step.caption}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="charts" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="rounded-[32px] border border-purple-100 bg-white px-6 py-16 shadow-sm md:px-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-4 text-right">
                <h2 className="text-3xl font-bold text-slate-900">بوته برای چه کسانی مناسب است؟</h2>
                <p className="text-base leading-7 text-slate-600">
                  بوته برای طیف گسترده ای از مخاطبان طراحی شده است.
                </p>
              </div>
              <Button
                variant="outline"
                className="border border-purple-200 px-6 py-3 text-sm font-semibold text-slate-900 hover:border-purple-400 hover:text-purple-600"
                onClick={() => navigate("/register")}
              >
                مشاهده داشبورد نمونه
              </Button>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {chartGallery.map((card) => (
                <div
                  key={card.title}
                  className={`flex h-full flex-col gap-4 rounded-3xl border border-purple-100/80 bg-gradient-to-br p-7 ${card.accent}`}
                >
                  <div className="space-y-2 text-right">
                    <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{card.description}</p>
                  </div>
                  <div className="rounded-3xl border border-purple-100/70 bg-white/70 p-4 shadow-inner backdrop-blur">
                    {card.chart}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="blog" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="rounded-[32px] border border-purple-100 bg-white px-6 py-16 shadow-sm md:px-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-4 text-right">
                <h2 className="text-3xl font-bold text-slate-900">مقاله‌های تازه بوته</h2>
                <p className="text-base leading-7 text-slate-600">
                  رویکردهای نوآورانه در ارزیابی شایستگی، تجربه‌های واقعی سازمان‌ها و راهکارهای عملی توسعه منابع انسانی را در بلاگ بوته بخوانید.
                </p>
              </div>
              <Button
                variant="outline"
                className="border border-purple-200 px-6 py-3 text-sm font-semibold text-slate-900 hover:border-purple-400 hover:text-purple-600"
                onClick={() => navigate("/blog")}
              >
                مشاهده همه مقالات
              </Button>
            </div>
            <div className="mt-12">
              {isLoadingBlogs ? (
                <div className="flex items-center justify-center py-16">
                  <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
                </div>
              ) : latestPosts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {latestPosts.map((post) => (
                    <article
                      key={post.id}
                      className="flex h-full flex-col overflow-hidden rounded-3xl border border-purple-100 bg-white/90 text-right shadow-sm transition hover:-translate-y-1 hover:border-purple-200"
                    >
                      {post.cover_image_url && (
                        <div className="h-40 w-full overflow-hidden bg-slate-100">
                          <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex h-full flex-col justify-between gap-4 p-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatPersianDate(post.published_at || post.created_at)}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
                          <p className="text-sm leading-7 text-slate-600">{post.excerpt}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{post.author || "تیم بوته"}</span>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => navigate(`/blog/${post.slug}`)}
                          >
                            ادامه مطلب
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-purple-200 bg-white/70 p-10 text-center text-sm text-slate-600">
                  هنوز مقاله‌ای منتشر نشده است. به زودی با تازه‌ترین محتواهای تخصصی در خدمت شما خواهیم بود.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-purple-100 bg-slate-900 px-6 py-16 text-white md:px-12">
            <div className="absolute -right-24 h-48 w-48 rounded-full bg-purple-500/30 blur-3xl" />
            <div className="relative space-y-6 text-center">
              <h2 className="text-3xl font-bold">آماده ورود به بوته آزمون هستید؟</h2>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-200">
                تنها چند قدم تا کشف دقیق شایستگی های کارکنان شما باقی مانده! فقط کافیست با کارشناسان ما تماس بگیرید.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  variant="default"
                  className="w-full bg-purple-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-purple-600 hover:shadow-lg sm:w-auto"
                  onClick={() => navigate("/register")}
                >
                  شروع رایگان مسیر بوته
                </Button>
                <Button
                  variant="ghost"
                  className="w-full bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20 hover:shadow-lg sm:w-auto"
                  onClick={() => navigate("/login")}
                >
                  تماس با کارشناسان
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-purple-100/60 bg-white/90 py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 md:grid-cols-[1.1fr_1fr_1fr_1fr] md:px-8">
          <div className="space-y-5 text-right">
            <Logo variant="large" />
            <p className="text-sm leading-6 text-slate-600">
              سنجش , رشد , تعالی
            </p>
          </div>

          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-3 text-right text-sm">
              <p className="text-sm font-semibold text-slate-900">{column.title}</p>
              <ul className="space-y-2 text-slate-600">
                {column.items.map((item, index) => {
                  // لینک قابل کلیک برای شماره تلفن
                  if (item.includes("شماره تماس")) {
                    const phone = item.match(/\d+/g)?.join("") || "";
                    return (
                      <li key={index}>
                        <a
                          href={`tel:02171058720`}
                          className="transition hover:text-purple-600"
                        >
                          {item}
                        </a>
                      </li>
                    );
                  }

                  // لینک آدرس ایمیل
                  if (item.includes("ایمیل")) {
                    const email = item.split(":")[1].trim();
                    return (
                      <li key={index}>
                        <a
                          href={`mailto:${email}`}
                          className="transition hover:text-purple-600"
                        >
                          {item}
                        </a>
                      </li>
                    );
                  }

                  return <li key={index}>{item}</li>;
                })}
              </ul>

              {/* آیکون‌های شبکه‌های اجتماعی */}
              {column.title === "ارتباط با ما" && (
                <div className="flex justify-end gap-3 pt-3">
                  <a
                    href="https://t.me/hr720ir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-purple-700 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="#74C0FC" d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z" /></svg>
                  </a>

                  <a
                    href="http://linkedin.com/company/hr720"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full  text-purple-700 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="#74C0FC" d="M512 96L127.9 96C110.3 96 96 110.5 96 128.3L96 511.7C96 529.5 110.3 544 127.9 544L512 544C529.6 544 544 529.5 544 511.7L544 128.3C544 110.5 529.6 96 512 96zM231.4 480L165 480L165 266.2L231.5 266.2L231.5 480L231.4 480zM198.2 160C219.5 160 236.7 177.2 236.7 198.5C236.7 219.8 219.5 237 198.2 237C176.9 237 159.7 219.8 159.7 198.5C159.7 177.2 176.9 160 198.2 160zM480.3 480L413.9 480L413.9 376C413.9 351.2 413.4 319.3 379.4 319.3C344.8 319.3 339.5 346.3 339.5 374.2L339.5 480L273.1 480L273.1 266.2L336.8 266.2L336.8 295.4L337.7 295.4C346.6 278.6 368.3 260.9 400.6 260.9C467.8 260.9 480.3 305.2 480.3 362.8L480.3 480z" /></svg>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-t border-purple-100/60 px-4 pt-6 text-xs text-slate-400 md:flex-row md:px-6">
          <p>© {new Date().getFullYear()} بوته. تمام حقوق محفوظ است.</p>
          <div className="flex gap-4">
            <span>حریم خصوصی</span>
            <span>شرایط استفاده</span>
            <span>سوالات متداول</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Index;
