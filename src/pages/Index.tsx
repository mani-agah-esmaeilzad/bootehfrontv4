import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

type ChartType = "line" | "radial" | "bar" | "area" | "doughnut" | "mixed";

const renderChart = (type: ChartType) => {
  const gradientId = `chart-${type}-gradient`;

  switch (type) {
    case "line":
      return (
        <svg viewBox="0 0 240 140" className="h-40 w-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2"
            points="10,110 230,110"
          />
          <path
            d="M20 100 C60 60, 90 120, 120 80 S200 40, 220 70"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="6"
            strokeLinecap="round"
            className="drop-shadow-md"
          />
          <circle cx="120" cy="80" r="7" fill="#0ea5e9" />
          <circle cx="200" cy="58" r="7" fill="#14b8a6" />
        </svg>
      );
    case "radial":
      return (
        <svg viewBox="0 0 200 200" className="h-40 w-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="14" />
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="16"
            strokeDasharray="503"
            strokeDashoffset="120"
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
          <text x="100" y="108" textAnchor="middle" fontSize="28" fontWeight="600" fill="#0f172a">
            ۸۷%
          </text>
        </svg>
      );
    case "bar":
      return (
        <svg viewBox="0 0 240 140" className="h-40 w-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          {[50, 80, 110, 70, 120, 95].map((height, index) => (
            <rect
              key={index}
              x={30 + index * 32}
              y={130 - height}
              width={22}
              height={height}
              rx={6}
              fill={`url(#${gradientId})`}
              className="opacity-90"
            />
          ))}
          <polyline
            points="30,90 60,60 90,70 122,48 154,80 186,52 218,68"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="4"
            strokeLinecap="round"
            className="drop-shadow"
          />
        </svg>
      );
    case "area":
      return (
        <svg viewBox="0 0 240 140" className="h-40 w-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0.4)" />
              <stop offset="100%" stopColor="rgba(20, 184, 166, 0.05)" />
            </linearGradient>
          </defs>
          <path d="M10 110 C50 40, 100 120, 150 60 S220 80, 230 40 L230 110 Z" fill={`url(#${gradientId})`} />
          <path
            d="M10 110 C50 40, 100 120, 150 60 S220 80, 230 40"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 6"
          />
          <path
            d="M10 110 C50 50, 100 100, 150 55 S220 85, 230 50"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "doughnut":
      return (
        <svg viewBox="0 0 200 200" className="h-40 w-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="60" fill="none" stroke="#e2e8f0" strokeWidth="22" />
          <circle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="22"
            strokeDasharray="377"
            strokeDashoffset="60"
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
          <circle cx="100" cy="100" r="40" fill="#f8fafc" />
          <text x="100" y="106" textAnchor="middle" fontSize="26" fontWeight="600" fill="#0f172a">
            ۴۲ مورد
          </text>
        </svg>
      );
    case "mixed":
      return (
        <svg viewBox="0 0 240 140" className="h-40 w-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          {[70, 55, 95, 60, 100, 82].map((height, index) => (
            <rect
              key={index}
              x={25 + index * 34}
              y={120 - height}
              width={18}
              height={height}
              rx={5}
              fill="#e2e8f0"
            />
          ))}
          <polyline
            points="25,90 59,62 93,96 127,70 161,52 195,86 229,58"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="161" cy="52" r="6" fill="#0f172a" />
          <circle cx="195" cy="86" r="6" fill="#14b8a6" />
        </svg>
      );
    default:
      return null;
  }
};

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "ارزیابی شخصی‌سازی‌شده",
      description: "الگوریتم هوش مصنوعی مهارت‌های نرم شما را در چند دقیقه تحلیل می‌کند.",
    },
    {
      icon: ShieldCheck,
      title: "اطمینان و امنیت",
      description: "داده‌ها روی زیرساخت امن ذخیره شده و دسترسی‌ها به‌صورت شفاف مدیریت می‌شوند.",
    },
    {
      icon: LineChart,
      title: "بینش‌های زنده",
      description: "داشبورد پویا تغییرات هر تیم را به‌صورت لحظه‌ای نمایش می‌دهد.",
    },
  ];

  const chartCards = [
    {
      id: "line",
      title: "رشد مهارت‌های ارتباطی",
      description: "میانگین پیشرفت ماهانه تیم شما در مهارت‌های ارتباطی.",
      value: "۸۵٪",
      change: "+۱۲٪ نسبت به ماه قبل",
      chart: "line" as ChartType,
    },
    {
      id: "radial",
      title: "تعادل نقش‌های تیمی",
      description: "نسبت پوشش مهارت‌های کلیدی برای ایفای نقش‌های بین‌فردی.",
      value: "۸۷٪",
      change: "در وضعیت ایده‌آل",
      chart: "radial" as ChartType,
    },
    {
      id: "bar",
      title: "شاخص آمادگی استخدام",
      description: "مقایسه مهارت‌های نرم داوطلبان در مراحل مختلف مصاحبه.",
      value: "۶۴ امتیاز",
      change: "+۵ پله در سه هفته",
      chart: "bar" as ChartType,
    },
    {
      id: "area",
      title: "درگیری در تمرین",
      description: "شدت مشارکت اعضا در سناریوهای تعاملی و تمرین‌های گروهی.",
      value: "۹۲ دقیقه",
      change: "میانگین در هر جلسه",
      chart: "area" as ChartType,
    },
    {
      id: "doughnut",
      title: "مسیرهای رشد فعال",
      description: "تعداد مسیرهای یادگیری که اکنون در حال اجرا هستند.",
      value: "۴۲ مسیر",
      change: "۷ مسیر جدید این هفته",
      chart: "doughnut" as ChartType,
    },
    {
      id: "mixed",
      title: "شاخص رضایت مربی",
      description: "تجربه مربیان در جلسات بازخورد و میزان همراهی شرکت‌کنندگان.",
      value: "۹.۳ از ۱۰",
      change: "رشد پایدار",
      chart: "mixed" as ChartType,
    },
  ];

  const personas = [
    {
      title: "مدیر منابع انسانی",
      description: "به‌سرعت نقاط قوت فرهنگی و نیازهای توسعه‌ای سازمان را تشخیص دهید.",
    },
    {
      title: "رهبر تیم محصول",
      description: "هم‌تیمی‌های متعادل بسازید و همکاری را با داده‌های شفاف تقویت کنید.",
    },
    {
      title: "منتور آموزشی",
      description: "پیشرفت شاگردان را به‌صورت بصری و قابل اشتراک گزارش کنید.",
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between gap-6 px-4 py-4">
          <div className="flex items-center gap-6">
            <Logo variant="large" />
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500">
              <a className="transition hover:text-slate-900" href="#features">
                معرفی محصول
              </a>
              <a className="transition hover:text-slate-900" href="#charts">
                داشبورد
              </a>
              <a className="transition hover:text-slate-900" href="#personas">
                مخاطبان
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Button variant="hrbooteh-ghost" onClick={() => navigate("/login")}>ورود</Button>
            <Button variant="hrbooteh" onClick={() => navigate("/register")}>
              ثبت‌نام
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="space-y-24 pb-24">
        <section className="container mx-auto grid gap-16 px-4 pt-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-600">
              ساده، فارسی و مینیمال
            </span>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              پلتفرم سنجش مهارت‌های نرم بوته
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              گفتگوهای تعاملی سه‌نفره، تحلیل هوشمند و گزارش‌های کاملاً فارسی. همه‌چیز با تمرکز بر تم سفید، مشکی و فیروزه‌ای تا تجربه‌ای شفاف و کارآمد بسازید.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="hrbooteh"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigate("/register")}
              >
                شروع ارزیابی رایگان
              </Button>
              <Button
                variant="hrbooteh-outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigate("/login")}
              >
                تماشای دموی کوتاه
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["۹۵٪ رضایت شرکت‌کننده", "۴ هفته پیاده‌سازی", "پشتیبانی تمام‌وقت"].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-teal-100 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">شاخص سلامت تیم</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">۹۲</p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">+۸٪</span>
            </div>
            <div className="mt-6 rounded-2xl border border-white/60 bg-white p-4 shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>همدلی</span>
                <span>اعتماد</span>
                <span>هدایت</span>
              </div>
              <svg viewBox="0 0 320 160" className="mt-4 h-40 w-full">
                <defs>
                  <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <path d="M20 130 L60 80 L100 115 L140 60 L180 95 L220 50 L260 85 L300 40" fill="none" stroke="url(#hero-gradient)" strokeWidth="10" strokeLinecap="round" />
                <circle cx="220" cy="50" r="7" fill="#0f172a" />
                <circle cx="300" cy="40" r="7" fill="#14b8a6" />
              </svg>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "پاسخ‌گویی", value: "۸۸٪" },
                  { label: "تعامل زنده", value: "۹۴٪" },
                  { label: "پایداری تیم", value: "۹۰٪" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-base font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-md">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">چرا تیم‌ها بوته را انتخاب می‌کنند؟</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  هر بخش از تجربه کاربری به فارسی طراحی شده و مسیر گفتگوها، نمودارها و گزارش‌ها برای نمایش دقیق وضعیت تیم با رنگ‌های سفید، مشکی و فیروزه‌ای هماهنگ شده است.
                </p>
              </div>
              <Button variant="hrbooteh-outline" onClick={() => navigate("/register")}>رزرو جلسه معرفی</Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-teal-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="charts" className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">داشبوردهای بصری و فارسی</h2>
              <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
                مجموعه‌ای از نمودارهای تعاملی که روند پیشرفت، آمادگی تیم و سلامت ارتباطی را با رنگ‌های یکدست و چشم‌نواز نمایش می‌دهند.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                <BarChart3 className="h-4 w-4 text-teal-500" />
                تحلیل سازمانی
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                <LineChart className="h-4 w-4 text-teal-500" />
                گزارش لحظه‌ای
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                <Target className="h-4 w-4 text-teal-500" />
                هدف‌گذاری دقیق
              </span>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {chartCards.map(({ id, title, description, value, change, chart }) => (
              <div key={id} className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{value}</span>
                </div>
                <div className="text-xs font-medium text-teal-600">{change}</div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  {renderChart(chart)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="personas" className="container mx-auto px-4">
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-cyan-50 p-10 shadow-md">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">برای چه کسانی ساخته شده است؟</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  تجربه کاربری راست‌چین و فارسی، در هر دستگاهی هماهنگ باقی می‌ماند و به تیم‌های حرفه‌ای کمک می‌کند تصمیم‌های سریع و دقیق بگیرند.
                </p>
              </div>
              <Button variant="hrbooteh" onClick={() => navigate("/register")}>
                شروع همکاری
              </Button>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {personas.map(({ title, description }) => (
                <div key={title} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                    <UsersRound className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-10 text-white shadow-md">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">همین امروز به تیم‌های پیشرو بپیوندید</h2>
                <p className="max-w-xl text-base leading-7 text-slate-200">
                  بوتـه مسیر رشد مهارت‌های نرم را با زبان فارسی و طراحی مینیمال ساده می‌کند. از اولین ارزیابی تا گزارش جامع، همه‌چیز در یک تجربه‌ی روان و ریسپانسیو در اختیار شماست.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="hrbooteh" size="lg" className="w-full sm:w-auto" onClick={() => navigate("/register")}>ایجاد حساب سازمانی</Button>
                <Button variant="hrbooteh-outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10" onClick={() => navigate("/login")}>ورود اعضای تیم</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="container mx-auto flex flex-col gap-6 px-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-slate-700">
            <Logo />
            <span>© {new Date().getFullYear()} بوته. همه حقوق محفوظ است.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a className="hover:text-slate-900" href="#features">
              ویژگی‌ها
            </a>
            <a className="hover:text-slate-900" href="#charts">
              نمودارها
            </a>
            <a className="hover:text-slate-900" href="#personas">
              مشتریان ما
            </a>
            <a className="hover:text-slate-900" href="mailto:hello@hrbooteh.com">
              hello@hrbooteh.com
            </a>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-hrbooteh-text-primary">About</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>About</li>
              <li>Blog</li>
              <li>For Team Leads</li>
              <li>For Teachers</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-hrbooteh-text-primary">Use Cases</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>Recruiting</li>
              <li>Performance</li>
              <li>Culture</li>
              <li>Growth</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-hrbooteh-text-primary">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>hello@hrbooteh.com</li>
              <li>+351 445 485</li>
              <li>Porto, Portugal</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-hrbooteh-surface-elevated pt-6 text-center text-sm">
          © {new Date().getFullYear()} HRbooteh. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
