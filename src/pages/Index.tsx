import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, ShieldCheck, UsersRound } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "تجربه‌ی هوشمند",
      description:
        "گفتگوهای سه‌نفره با روایت‌گر، مبصر و کاربر به‌صورت کاملاً تعاملی و فارسی طراحی شده‌اند.",
    },
    {
      icon: UsersRound,
      title: "مناسب برای تیم‌ها",
      description:
        "از ارزیابی فردی تا گزارش‌های مدیریتی، همه‌چیز در یک فضای مینیمال و خوانا جمع‌آوری شده است.",
    },
    {
      icon: ShieldCheck,
      title: "امن و شفاف",
      description:
        "حریم خصوصی داده‌ها با زیرساخت مطمئن و سطوح دسترسی قابل‌اعتماد حفظ می‌شود.",
    },
  ];

  const journey = [
    {
      title: "ثبت‌نام سریع",
      description: "تنها با چند کلیک وارد فضای اختصاصی خود شوید و نقش‌ موردنظر را انتخاب کنید.",
    },
    {
      title: "گفتگوی شبیه‌سازی‌شده",
      description: "با رابط راست‌چین و فارسی، گفتگوی تعاملی را در فضایی مشابه Wiseworld تجربه کنید.",
    },
    {
      title: "گزارش نهایی",
      description: "خلاصه‌ای دقیق و قابل‌استناد برای تصمیم‌گیری‌های آموزشی یا سازمانی دریافت نمایید.",
    },
  ];

  const highlights = [
    { label: "میانگین رضایت", value: "۹۶٪" },
    { label: "زمان استقرار", value: "۳ روز" },
    { label: "پشتیبانی", value: "۲۴/۷" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-purple-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <div className="flex items-center gap-6">
            <Logo variant="large" />
            <nav className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
              <a className="transition hover:text-slate-900" href="#hero">
                خانه
              </a>
              <a className="transition hover:text-slate-900" href="#features">
                ویژگی‌ها
              </a>
              <a className="transition hover:text-slate-900" href="#journey">
                مسیر استفاده
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

      <main className="space-y-24 pb-24">
        <section
          id="hero"
          className="relative overflow-hidden border-b border-purple-50 bg-gradient-to-l from-purple-50 via-white to-white"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:px-6">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-xs font-semibold text-purple-700">
                مینیمال، فارسی و راست‌چین
              </span>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                سنجش مهارت‌های نرم با سادگی و وقار
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                رابط کاربری الهام‌گرفته از Wiseworld، اما به زبان فارسی و برای فرهنگ تیم‌های ایرانی طراحی شده است.
                رنگ‌های سفید، مشکی و بنفش در کنار هم فضایی حرفه‌ای و متمرکز می‌سازند.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="default"
                  className="w-full bg-purple-600 px-6 py-3 text-base font-semibold text-white hover:bg-purple-700 sm:w-auto"
                  onClick={() => navigate("/register")}
                >
                  رزرو دموی خصوصی
                </Button>
                <Button
                  variant="outline"
                  className="w-full border border-slate-200 px-6 py-3 text-base font-semibold text-slate-900 hover:border-purple-400 hover:text-purple-600 sm:w-auto"
                  onClick={() => navigate("/login")}
                >
                  مشاهده نمونه گفتگو
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {highlights.map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-purple-100 bg-white px-4 py-5 text-center shadow-sm"
                  >
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-purple-200/60 blur-3xl" />
              <div className="absolute -bottom-8 -left-10 h-40 w-40 rounded-full bg-slate-900/10 blur-3xl" />
              <div className="relative rounded-[32px] border border-purple-100 bg-white/70 p-8 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">جلسه فعال</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">گفتگوی سه‌نفره</p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">آنلاین</span>
                </div>
                <div className="mt-6 space-y-4">
                  {["راوی", "مبصر", "کاربر"].map((role, index) => (
                    <div
                      key={role}
                      className="flex items-center justify-between rounded-2xl border border-purple-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{role}</p>
                          <p className="text-xs text-slate-500">آماده برای گفتگو</p>
                        </div>
                      </div>
                      <span className="text-xs text-purple-500">● فعال</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 px-4 py-5 text-center">
                  <p className="text-sm text-slate-600">صحنه‌های گفتگو در قالب کارت‌های مرحله‌ای نمایش داده می‌شوند.</p>
                  <p className="mt-2 text-xs text-purple-500">فضای ساده برای تمرکز روی محتوای آموزشی</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="rounded-[32px] border border-purple-100 bg-white px-6 py-12 shadow-sm md:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900">چرا بوته متفاوت است؟</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                تمرکز روی سادگی بصری باعث شده تا کاربران بدون حواس‌پرتی با محتوا تعامل داشته باشند و تصمیم‌گیران گزارش‌های واضح دریافت کنند.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex flex-col gap-4 rounded-3xl border border-purple-100 bg-purple-50/50 p-6">
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

        <section
          id="journey"
          className="mx-auto w-full max-w-6xl px-4 md:px-6"
        >
          <div className="rounded-[32px] border border-purple-100 bg-gradient-to-l from-white via-purple-50 to-white px-6 py-12 md:px-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">مسیر ساده تا نتیجه</h2>
                <p className="text-base leading-7 text-slate-600">
                  فرآیند استفاده از بوته در سه گام خلاصه می‌شود تا تیم‌ها بدون پیچیدگی وارد عمل شوند.
                </p>
              </div>
              <Button
                variant="default"
                className="w-full bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800 md:w-auto"
                onClick={() => navigate("/register")}
              >
                شروع ارزیابی
              </Button>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {journey.map(({ title, description }, index) => (
                <div key={title} className="flex flex-col gap-3 rounded-3xl border border-purple-100 bg-white p-6 text-right">
                  <span className="text-xs font-semibold text-purple-500">مرحله {index + 1}</span>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 md:px-6">
          <div className="rounded-[28px] border border-purple-100 bg-slate-900 px-6 py-12 text-white md:px-12">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">آماده‌اید تجربه‌ای تازه داشته باشید؟</h2>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-200">
                بوته با زبان فارسی و چینش مینیمال ساخته شده تا تمرکز شما روی مکالمه و تحلیل باقی بماند. تنها کافیست ثبت‌نام کنید تا تیم ما همراهتان باشد.
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
    </div>
  );
};

export default Index;
