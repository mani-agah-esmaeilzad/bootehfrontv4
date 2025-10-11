import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const heroHighlights = [
  { label: "سازمان‌های فعال", value: "۴۲" },
  { label: "گفتگوهای تحلیل‌شده", value: "۱۲،۸۰۰" },
  { label: "رضایت رهبران", value: "۹۶٪" },
];

const featureCards = [
  {
    icon: Sparkles,
    title: "روایت تعاملی",
    description:
      "داستان جلسه با یک راوی حرفه‌ای آغاز می‌شود و هر مرحله روی مسیر منحنی مشخص می‌گردد.",
  },
  {
    icon: UsersRound,
    title: "همراهی تیمی",
    description:
      "مبصر، مدیر و کاربر در یک محیط یکپارچه هم‌افزایی می‌کنند و دیدگاه‌های خود را به اشتراک می‌گذارند.",
  },
  {
    icon: ShieldCheck,
    title: "اعتماد و امنیت",
    description:
      "داده‌ها با لایه‌های حفاظتی مطمئن نگهداری می‌شوند و گزارش‌ها با دسترسی کنترل‌شده ارائه می‌گردند.",
  },
];

const journeySteps = [
  {
    title: "شروع هوشمند",
    description: "با انتخاب نقش و هدف، مسیر گفتگو شخصی‌سازی می‌شود و راهنمایی آنی دریافت می‌کنید.",
  },
  {
    title: "مسیریابی لحظه‌ای",
    description: "خطوط منحنی وضعیت هر نقش را نشان می‌دهند و نمودارها روند پیشرفت را به تصویر می‌کشند.",
  },
  {
    title: "تحلیل نهایی",
    description: "خروجی‌های بصری شفاف، تصمیم‌گیری را برای مدیران و مربیان ساده و دقیق می‌کند.",
  },
];

const chartShowcase = [
  {
    title: "نمودار هم‌افزایی",
    description: "تعامل سه نقش به‌صورت موجی نمایش داده می‌شود تا نقاط اوج مشخص باشد.",
    accent: "from-purple-500/70 via-purple-400/40 to-purple-300/10",
    chart: (
      <svg viewBox="0 0 260 120" className="h-32 w-full text-purple-500">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(124,58,237,0.5)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0.05)" />
          </linearGradient>
        </defs>
        <path
          d="M0,80 C40,20 80,20 120,70 C160,120 200,40 240,60"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M0,110 C40,70 80,100 120,60 C160,20 200,90 240,40"
          stroke="url(#lineGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "تحلیل احساس",
    description: "شدت احساسات مخاطبان در طول جلسه با خطوط نرم و نقطه‌های شاخص ثبت می‌شود.",
    accent: "from-slate-900 via-purple-500/40 to-purple-300/10",
    chart: (
      <svg viewBox="0 0 260 120" className="h-32 w-full text-slate-900">
        <polyline
          points="0,100 40,60 80,70 120,30 160,50 200,20 240,40"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {[0, 40, 80, 120, 160, 200, 240].map((x, index) => (
          <circle
            key={x}
            cx={x}
            cy={[100, 60, 70, 30, 50, 20, 40][index]}
            r={6}
            fill="currentColor"
            className="opacity-60"
          />
        ))}
      </svg>
    ),
  },
  {
    title: "پیش‌بینی عملکرد",
    description: "ستون‌های نرم، شفافیت رشد مهارت را در شاخص‌های کلیدی نشان می‌دهند.",
    accent: "from-purple-600/80 via-slate-900/40 to-purple-200/10",
    chart: (
      <svg viewBox="0 0 260 120" className="h-32 w-full text-purple-600">
        {[30, 70, 110, 150, 190, 230].map((x, index) => (
          <rect
            key={x}
            x={x - 10}
            y={120 - (index + 2) * 16}
            width={20}
            height={(index + 2) * 16}
            rx={6}
            fill="currentColor"
            className="opacity-70"
          />
        ))}
        <path
          d="M30,70 C70,50 110,40 150,30 C190,20 230,10 260,5"
          stroke="rgba(15,23,42,0.6)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const footerLinks = [
  {
    title: "محصول",
    items: ["جریان گفتگو", "تحلیل مدیران", "اتصال تیمی"],
  },
  {
    title: "منابع",
    items: ["وبینارها", "مستندات", "مرکز راهنما"],
  },
  {
    title: "ارتباط",
    items: ["گفتگو با ما", "دریافت دمو", "همکاری سازمانی"],
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-purple-100/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <div className="flex items-center gap-6">
            <Logo variant="large" />
            <nav className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
              <a className="transition hover:text-slate-900" href="#hero">
                خانه
              </a>
              <a className="transition hover:text-slate-900" href="#features">
                امکانات
              </a>
              <a className="transition hover:text-slate-900" href="#journey">
                مسیر
              </a>
              <a className="transition hover:text-slate-900" href="#charts">
                نمودارها
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
              className="bg-purple-600 px-5 text-white hover:bg-purple-700"
              onClick={() => navigate("/register")}
            >
              شروع کنید
              <ArrowLeft className="mr-2 h-4 w-4" />
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
            <svg
              className="h-full w-full opacity-50"
              viewBox="0 0 1440 900"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 720C120 640 260 560 420 580C580 600 660 700 840 720C1020 740 1160 660 1320 600C1400 568 1440 560 1440 560V900H0V720Z"
                fill="url(#heroGradient)"
              />
              <defs>
                <linearGradient id="heroGradient" x1="0" y1="600" x2="1440" y2="900" gradientUnits="userSpaceOnUse">
                  <stop stopColor="rgba(124,58,237,0.15)" />
                  <stop offset="0.5" stopColor="rgba(79,70,229,0.05)" />
                  <stop offset="1" stopColor="rgba(15,23,42,0.05)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="relative mx-auto grid w-full max-w-6xl gap-16 px-4 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-6">
            <div className="space-y-10">
              <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                هم‌افزایی تیم‌ها در یک سکوی مینیمال و الهام‌گرفته از آینده
              </h1>
              <p className="text-lg leading-9 text-slate-600">
                بوته تجربه‌ای روان برای جلسات ارزیابی و توسعه مهارت‌ها خلق می‌کند. خطوط منحنی و نمودارهای نرم، مسیر رشد را به شکلی
                ملموس نشان می‌دهند و هر نقش در مسیر سه‌نفره جایگاهی روشن دارد.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
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
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {heroHighlights.map(({ label, value }) => (
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
              <div className="absolute -left-10 -top-12 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />
              <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-slate-900/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-purple-100/70 bg-white/70 p-8 shadow-xl backdrop-blur-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">جلسه فعال</p>
                    <p className="text-2xl font-semibold text-slate-900">گفتگوی سه‌نفره</p>
                  </div>
                  <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">آنلاین</span>
                </div>
                <div className="relative mt-8">
                  <svg
                    viewBox="0 0 320 200"
                    className="h-56 w-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
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
                    {[{ x: 40, y: 140, label: "راوی" }, { x: 150, y: 90, label: "مبصر" }, { x: 270, y: 55, label: "کاربر" }].map(
                      (node) => (
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
                      ),
                    )}
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

        <section id="features" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="rounded-[32px] border border-purple-100 bg-white px-6 py-16 shadow-sm md:px-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">قابلیت‌های کلیدی</h2>
                <p className="text-base leading-7 text-slate-600">
                  با تمرکز بر مینیمالیسم، هر عنصر در صفحه نقش مشخصی دارد. کارت‌های نرم و فضاهای خالی به پیام‌های اصلی اجازه می‌دهند
                  درخشندگی بیشتری پیدا کنند.
                </p>
              </div>
              <div className="flex gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  <PanelsTopLeft className="h-4 w-4 text-purple-500" />
                  تجربه بصری
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  تحلیل داده
                </span>
              </div>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {featureCards.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex flex-col gap-4 rounded-3xl border border-purple-100/80 bg-purple-50/60 p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="relative overflow-hidden bg-slate-900 py-20">
          <div className="absolute inset-0 opacity-40">
            <svg viewBox="0 0 1440 400" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 200C160 140 320 120 480 160C640 200 800 320 960 320C1120 320 1280 220 1440 200"
                stroke="url(#journeyGradient)"
                strokeWidth="4"
                fill="none"
              />
              <defs>
                <linearGradient id="journeyGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop stopColor="rgba(167,139,250,0.3)" />
                  <stop offset="1" stopColor="rgba(59,130,246,0.2)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 md:px-6">
            <div className="space-y-4 text-right text-white">
              <h2 className="text-3xl font-bold">مسیر حرکت تیم شما</h2>
              <p className="max-w-2xl text-base leading-7 text-slate-200">
                مسیر سه مرحله‌ای با خطوط نرم و نقاط نورانی مشخص شده است تا تیم‌ها به‌راحتی وضعیت خود را دنبال کنند.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {journeySteps.map((step, index) => (
                <div key={step.title} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7">
                  <div className="absolute -left-10 top-10 h-24 w-24 rounded-full bg-purple-500/30 blur-2xl" />
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="charts" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="rounded-[32px] border border-purple-100 bg-white px-6 py-16 shadow-sm md:px-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">نگاه بصری به داده‌ها</h2>
                <p className="text-base leading-7 text-slate-600">
                  داشبورد مرکزی با نمودارهای نرم و مینیمال طراحی شده تا روند عملکرد در یک نگاه درک شود. هر کارت یک بُعد از گفتگوی سه‌نفره
                  را برجسته می‌کند.
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
              {chartShowcase.map((card) => (
                <div
                  key={card.title}
                  className={`flex h-full flex-col gap-4 rounded-3xl border border-purple-100/80 bg-gradient-to-br p-7 ${card.accent}`}
                >
                  <div className="space-y-2">
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

        <section className="mx-auto w-full max-w-5xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-purple-100 bg-slate-900 px-6 py-16 text-white md:px-12">
            <div className="absolute -right-24 h-48 w-48 rounded-full bg-purple-500/30 blur-3xl" />
            <div className="relative space-y-6 text-center">
              <h2 className="text-3xl font-bold">آماده ورود به گفتگوی نسل جدید هستید؟</h2>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-200">
                با چند کلیک، تیم شما به مسیری هدایت می‌شود که هم داده و هم تجربه را در کنار هم قرار می‌دهد. از اولین لحظه ورود، سادگی و
                دقت را حس خواهید کرد.
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
          <div className="space-y-5">
            <Logo variant="large" />
            <p className="text-sm leading-6 text-slate-500">
              سکوی گفتگوی سه‌نفره برای سازمان‌هایی که به دنبال تصمیم‌گیری آگاهانه و سریع هستند.
            </p>
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
                className="bg-purple-600 px-5 text-white hover:bg-purple-700"
                onClick={() => navigate("/register")}
              >
                شروع کنید
              </Button>
            </div>
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
