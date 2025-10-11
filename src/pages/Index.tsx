import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  LineChart,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const heroStats = [
  { label: "سازمان‌های همکار", value: "۴۲+" },
  { label: "جلسات تحلیل‌شده", value: "۱۲٬۸۰۰" },
  { label: "رضایت مدیران", value: "۹۶٪" },
];

const capabilityCards = [
  {
    icon: Sparkles,
    title: "تجربه داستانی",
    description:
      "هر جلسه با یک روایت نرم آغاز می‌شود و نقش‌ها به‌صورت مرحله‌ای روی مسیر خمیده روشن می‌شوند.",
  },
  {
    icon: PanelsTopLeft,
    title: "هم‌آهنگی لحظه‌ای",
    description:
      "مبصر، مدیر و کاربر در یک داشبورد مینیمال قرار می‌گیرند تا در لحظه تصمیم‌های خود را هماهنگ کنند.",
  },
  {
    icon: BarChart3,
    title: "تحلیل شفاف",
    description:
      "نمودارهای ساده اما عمیق، نبض احساس، پیشرفت مهارت و نقاط حساس گفتگو را به تصویر می‌کشند.",
  },
];

const pathMilestones = [
  { title: "تعریف هدف", caption: "انتخاب نقش‌ها و تنظیم انتظار" },
  { title: "جریان گفتگو", caption: "پیگیری نقاط اوج روی مسیر خمیده" },
  { title: "تحلیل پایانی", caption: "جمع‌بندی داده و پیشنهاد بعدی" },
];

const chartGallery = [
  {
    title: "نبض گفتگو",
    description: "روند انرژی سه نقش در طول جلسه با خطوط نرم و محو دنبال می‌شود.",
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
    title: "تحلیل احساس",
    description: "پراکندگی احساسات مخاطبان با نقطه‌های شاخص روی نمودار موجی نمایش داده می‌شود.",
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
    title: "پیش‌بینی مهارت",
    description: "ستون‌های مینیمال روند رشد مهارت را برای نقش‌های مختلف نمایش می‌دهند.",
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
    title: "چشم‌انداز آینده",
    description: "پیشنهاد خودکار گام‌های بعدی بر اساس الگوهای موفقیت سازمان‌های مشابه.",
    metric: "۲۱",
    label: "توصیه فعال",
  },
];

const footerLinks = [
  {
    title: "محصول",
    items: ["جریان گفتگو", "گزارش مدیر", "پلتفرم یادگیری"],
  },
  {
    title: "منابع",
    items: ["وبینارها", "مستندات", "مجله بینش"],
  },
  {
    title: "ارتباط",
    items: ["درخواست دمو", "پشتیبانی", "همکاری شرکتی"],
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-purple-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <div className="flex items-center gap-8">
            <Logo variant="large" />
            <nav className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
              <a className="transition hover:text-slate-900" href="#hero">
                خانه
              </a>
              <a className="transition hover:text-slate-900" href="#capabilities">
                امکانات
              </a>
              <a className="transition hover:text-slate-900" href="#path">
                مسیر
              </a>
              <a className="transition hover:text-slate-900" href="#insights">
                بینش‌ها
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-slate-900"
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
          </div>
        </div>
      </header>

      <main className="space-y-28 pb-24">
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
                نسل جدید هم‌افزایی تیمی
              </span>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                سکویی مینیمال برای گفتگوهای سه‌نفره با الهام از Wiseworld
              </h1>
              <p className="text-lg leading-9 text-slate-600">
                بوته با ترکیب خطوط منحنی، نمودارهای آرام و رابطی خنثی، جلسات ارزیابی و کوچینگ را به تجربه‌ای مدرن تبدیل می‌کند.
                هر نقش مسیر خود را روی خط خمیده پیدا می‌کند و داده‌ها به سادگی خوانده می‌شوند.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="default"
                  className="w-full bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800 sm:w-auto"
                  onClick={() => navigate("/register")}
                >
                  رزرو جلسه معرفی
                </Button>
                <Button
                  variant="outline"
                  className="w-full border border-purple-200 px-6 py-3 text-base font-semibold text-slate-900 hover:border-purple-400 hover:text-purple-600 sm:w-auto"
                  onClick={() => navigate("/login")}
                >
                  مشاهده محیط تعاملی
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
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
                    <p className="text-2xl font-semibold text-slate-900">گفتگوی سه‌نفره</p>
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
                    {[{ x: 42, y: 142, label: "راوی" }, { x: 155, y: 94, label: "مبصر" }, { x: 272, y: 58, label: "کاربر" }].map((node) => (
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
                      { title: "چک‌این", subtitle: "پرسش اولیه" },
                      { title: "تحلیل", subtitle: "بازخورد زنده" },
                      { title: "جمع‌بندی", subtitle: "گزارش نهایی" },
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
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-4 text-right">
                <h2 className="text-3xl font-bold text-slate-900">قابلیت‌های کلیدی</h2>
                <p className="text-base leading-7 text-slate-600">
                  مینیمالیسم به ما اجازه می‌دهد روی تجربه تمرکز کنیم. هر کارت برای معرفی یکی از نقاط قوت اصلی پلتفرم طراحی شده است.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  <PanelsTopLeft className="h-4 w-4 text-purple-500" />
                  طراحی هوشمند
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  <UsersRound className="h-4 w-4 text-purple-500" />
                  سه نقش هماهنگ
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                  امنیت داده
                </span>
              </div>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {capabilityCards.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex h-full flex-col gap-4 rounded-3xl border border-purple-100/80 bg-purple-50/60 p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{description}</p>
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
              <h2 className="text-3xl font-bold">مسیر حرکت تیم شما</h2>
              <p className="max-w-2xl text-base leading-7 text-slate-200">
                خطی خمیده که از شروع تا تحلیل نهایی را نشان می‌دهد و نقاط کلیدی را با درخشش‌های ظریف مشخص می‌کند.
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
                  <p className="mt-3 text-sm leading-7 text-slate-200">{step.caption}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="charts" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="rounded-[32px] border border-purple-100 bg-white px-6 py-16 shadow-sm md:px-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-4 text-right">
                <h2 className="text-3xl font-bold text-slate-900">نگاه بصری به داده‌ها</h2>
                <p className="text-base leading-7 text-slate-600">
                  مجموعه‌ای از نمودارهای نرم و ساده که بینش لازم برای تصمیم‌های بعدی را فراهم می‌کنند.
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

        <section
          id="insights"
          className="relative overflow-hidden border-y border-purple-100/70 bg-gradient-to-tr from-purple-50 via-white to-white py-20"
        >
          <div className="absolute inset-0 opacity-40">
            <svg viewBox="0 0 1440 600" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 480C180 420 360 320 540 360C720 400 900 560 1080 520C1260 480 1350 360 1440 320"
                stroke="rgba(124,58,237,0.18)"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </div>
          <div className="relative mx-auto w-full max-w-6xl px-4 md:px-6">
            <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-4 text-right">
                <h2 className="text-3xl font-bold text-slate-900">بینش‌های قابل عمل</h2>
                <p className="text-base leading-7 text-slate-600">
                  کارت‌های داده با نمودارهای کوچک و اعداد کلیدی نشان می‌دهند چگونه تیم شما به سمت هدف حرکت می‌کند.
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                onClick={() => navigate("/login")}
              >
                مرور همه گزارش‌ها
              </Button>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {insightStories.map((story) => (
                <div
                  key={story.title}
                  className="flex h-full flex-col justify-between rounded-3xl border border-purple-100 bg-white/80 p-7 text-right shadow-sm backdrop-blur"
                >
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-600">
                      <LineChart className="h-4 w-4" />
                      {story.label}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900">{story.title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{story.description}</p>
                  </div>
                  <p className="mt-6 text-3xl font-bold text-slate-900">{story.metric}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-purple-100 bg-slate-900 px-6 py-16 text-white md:px-12">
            <div className="absolute -right-24 h-48 w-48 rounded-full bg-purple-500/30 blur-3xl" />
            <div className="relative space-y-6 text-center">
              <h2 className="text-3xl font-bold">آماده ورود به گفتگوی نسل جدید هستید؟</h2>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-200">
                تنها چند گام تا راه‌اندازی سفر گفتگو باقی مانده است. تیم شما از اولین لحظه، دقت و سادگی طراحی را لمس خواهد کرد.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  variant="default"
                  className="w-full bg-purple-500 px-6 py-3 text-base font-semibold text-white hover:bg-purple-600 sm:w-auto"
                  onClick={() => navigate("/register")}
                >
                  شروع رایگان
                </Button>
                <Button
                  variant="ghost"
                  className="w-full bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/20 sm:w-auto"
                  onClick={() => navigate("/login")}
                >
                  ورود به حساب کاربری
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-purple-100/60 bg-white/90 py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-[1.1fr_1fr_1fr_1fr] md:px-6">
          <div className="space-y-5 text-right">
            <Logo variant="large" />
            <p className="text-sm leading-6 text-slate-500">
              سکوی گفتگوی سه‌نفره برای سازمان‌هایی که به دنبال تصمیم‌گیری آگاهانه و سریع هستند.
            </p>
            <div className="flex items-center justify-end gap-3 text-sm">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
                onClick={() => navigate("/login")}
              >
                ورود
              </Button>
              <Button
                variant="default"
                className="bg-purple-600 px-5 text-white hover:bg-purple-700"
                onClick={() => navigate("/register")}
              >
                شروع کنید
              </Button>
            </div>
          </div>
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-3 text-right text-sm">
              <p className="text-sm font-semibold text-slate-900">{column.title}</p>
              <ul className="space-y-2 text-slate-500">
                {column.items.map((item) => (
                  <li key={item} className="transition hover:text-slate-900">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-t border-purple-100/60 px-4 pt-6 text-xs text-slate-400 md:flex-row md:px-6">
          <p>© {new Date().getFullYear()} بوته. تمام حقوق محفوظ است.</p>
          <div className="flex gap-4">
            <span>حریم خصوصی</span>
            <span>شرایط استفاده</span>
            <span>حمایت</span>
          </div>
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-3 text-sm">
              <p className="text-sm font-semibold text-slate-900">{column.title}</p>
              <ul className="space-y-2 text-slate-500">
                {column.items.map((item) => (
                  <li key={item} className="transition hover:text-slate-900">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-t border-purple-100/60 px-4 pt-6 text-xs text-slate-400 md:flex-row md:px-6">
          <p>© {new Date().getFullYear()} بوته. تمام حقوق محفوظ است.</p>
          <div className="flex gap-4">
            <span>حریم خصوصی</span>
            <span>شرایط استفاده</span>
            <span>حمایت</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
