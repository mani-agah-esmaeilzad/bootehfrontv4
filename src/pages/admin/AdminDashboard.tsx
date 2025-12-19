// src/pages/admin/AdminDashboard.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart2,
  Building,
  FileText,
  Sparkles,
  Users,
  SlidersHorizontal,
  ShieldCheck,
  Activity,
  Cpu,
  Database,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const quickStats = [
  { label: "کاربران فعال", value: "۲,۴۵۰", delta: "+۱۲٪ نسبت به هفته قبل" },
  { label: "پرسشنامه‌های منتشر شده", value: "۳۲", delta: "۴ پرسشنامه جدید" },
  { label: "گزارش‌های آماده تحویل", value: "۱۸۰", delta: "۱۲ گزارش این هفته" },
  { label: "سازمان‌های متصل", value: "۹", delta: "۱ سازمان تازه" },
];

const shortcuts = [
  {
    title: "مدیریت کاربران",
    description: "فعال/غیرفعال‌سازی حساب‌ها، افزودن دستی و آپلود گروهی",
    icon: Users,
    path: "/admin/users",
    accent: "from-blue-500/80 to-indigo-500/80",
  },
  {
    title: "پرسشنامه‌ها",
    description: "ایجاد سناریوهای جدید، ویرایش و انتشار",
    icon: FileText,
    path: "/admin/questionnaires",
    accent: "from-violet-500/80 to-purple-500/80",
  },
  {
    title: "مسیرهای کاربران",
    description: "تعیین مرحله‌های مجاز برای هر حساب",
    icon: SlidersHorizontal,
    path: "/admin/user-stages",
    accent: "from-purple-500/80 to-indigo-500/80",
  },
  {
    title: "گزارش نهایی",
    description: "پاورویل شایستگی و کارنامه جامع",
    icon: ShieldCheck,
    path: "/admin/final-reports",
    accent: "from-cyan-500/80 to-sky-500/80",
  },
  {
    title: "پنل‌های سازمانی",
    description: "تعریف سازمان جدید و مدیریت مجوزها",
    icon: Building,
    path: "/admin/organizations",
    accent: "from-emerald-500/80 to-teal-500/80",
  },
  {
    title: "نتایج و تحلیل‌ها",
    description: "دسترسی سریع به آخرین خروجی‌های ارزیابی",
    icon: BarChart2,
    path: "/admin/reports",
    accent: "from-amber-500/80 to-orange-500/80",
  },
];

type ServiceStatus = "healthy" | "degraded" | "down" | "maintenance";

const aiServiceStatusConfig: Record<ServiceStatus, { label: string; badge: string }> = {
  healthy: { label: "سالم", badge: "border-emerald-400/60 bg-emerald-50 text-emerald-700" },
  degraded: { label: "کند", badge: "border-amber-400/60 bg-amber-50 text-amber-700" },
  down: { label: "از کار افتاده", badge: "border-rose-400/60 bg-rose-50 text-rose-700" },
  maintenance: { label: "در حال سرویس", badge: "border-slate-400/60 bg-slate-50 text-slate-600" },
};

const aiServiceSeed = [
  {
    id: "tts",
    title: "TTS Realtime",
    type: "تبدیل متن به گفتار",
    status: "healthy" as ServiceStatus,
    latencyMs: 180,
    tokens24h: 12500,
    quota: 50000,
    lastIncident: "۱۸ ساعت قبل",
    icon: Waves,
  },
  {
    id: "embeddings",
    title: "Semantic Embeddings",
    type: "مدل معنایی",
    status: "degraded" as ServiceStatus,
    latencyMs: 420,
    tokens24h: 28400,
    quota: 60000,
    lastIncident: "هشدار دیشب",
    icon: Database,
  },
  {
    id: "reasoner",
    title: "Reasoning LLM",
    type: "تولید و تحلیل پاسخ",
    status: "healthy" as ServiceStatus,
    latencyMs: 310,
    tokens24h: 38750,
    quota: 80000,
    lastIncident: "بدون گزارش",
    icon: Cpu,
  },
  {
    id: "monitor",
    title: "Monitoring Agent",
    type: "تشخیص انحراف پاسخ",
    status: "maintenance" as ServiceStatus,
    latencyMs: 0,
    tokens24h: 5200,
    quota: 20000,
    lastIncident: "سرویس دوره‌ای",
    icon: Activity,
  },
];

const formatNumber = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

const AdminDashboard = () => {
  const navigate = useNavigate();

  const heroHighlights = useMemo(
    () => [
      { label: "ارزیابی در حال اجرا", value: "۱۲" },
      { label: "تیم تحلیل فعال", value: "۳ نفر" },
      { label: "میانگین زمان پاسخ", value: "۲ دقیقه" },
    ],
    []
  );

  const aiServices = useMemo(() => aiServiceSeed, []);

  const healthSummary = useMemo(() => {
    const totalTokens = aiServices.reduce((sum, svc) => sum + svc.tokens24h, 0);
    const unhealthy = aiServices.filter((svc) => svc.status !== "healthy").length;
    const degradedNames = aiServices.filter((svc) => svc.status === "degraded").map((svc) => svc.title);
    return {
      totalTokens: formatNumber(totalTokens),
      unhealthyCount: unhealthy,
      degradedNames,
    };
  }, [aiServices]);

  return (
    <div className="admin-page">
      <section className="admin-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-cyan-500/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 text-slate-900">
            <p className="text-sm font-semibold text-indigo-500">پرتال کنترل</p>
            <h1 className="text-3xl font-black leading-snug text-slate-900">
              خوش آمدید! همه چیز برای مدیریت ارزیابی‌ها آماده است.
            </h1>
            <p className="text-sm text-slate-600">
              از اینجا می‌توانید کاربران، سازمان‌ها، پرسشنامه‌ها و خروجی‌ها را با ظرافت کامل مدیریت کنید.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5 text-base font-semibold shadow-lg shadow-indigo-500/30 hover:opacity-90"
                onClick={() => navigate("/admin/questionnaires/new")}
              >
                <Sparkles className="ml-2 h-5 w-5" />
                ساخت پرسشنامه جدید
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-slate-200 bg-white/70 px-6 py-5 text-base font-semibold text-slate-600 shadow-sm hover:bg-white"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="ml-2 h-5 w-5" />
                مشاهده وب‌سایت
              </Button>
            </div>
          </div>
          <div className="grid w-full gap-4 rounded-3xl border border-white/40 bg-white/70 p-4 shadow-lg shadow-indigo-500/10 sm:grid-cols-3 lg:w-auto lg:min-w-[360px]">
            {heroHighlights.map((item) => (
              <div key={item.label} className="flex flex-col gap-1 rounded-2xl bg-white/70 p-4 text-center shadow-inner">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-xl font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-white/80 p-5 shadow-lg shadow-indigo-500/5 backdrop-blur"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stat.value}</p>
            <p className="mt-2 text-xs text-emerald-600">{stat.delta}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/80 p-6 shadow-lg shadow-indigo-500/5">
          <p className="text-sm font-semibold text-slate-500">سلامت کلی سرویس‌های هوش مصنوعی</p>
          <p className="mt-4 text-4xl font-black text-slate-900">{healthSummary.totalTokens} توکن</p>
          <p className="mt-1 text-xs text-slate-500">مصرف ۲۴ ساعت اخیر</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            {healthSummary.unhealthyCount === 0 ? (
              <span>تمام سرویس‌ها پایدار هستند و SLA رعایت شده است.</span>
            ) : (
              <>
                <span className="font-semibold text-amber-600">
                  {healthSummary.unhealthyCount} سرویس نیازمند توجه
                </span>
                {healthSummary.degradedNames.length > 0 && (
                  <ul className="mt-2 list-disc pr-5 text-xs text-slate-500">
                    {healthSummary.degradedNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/90 p-6 shadow-lg shadow-indigo-500/5 lg:col-span-2">
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-bold text-slate-900">پایش سلامت سرویس‌های AI</p>
              <p className="text-xs text-slate-500">نمودار لحظه‌ای وضعیت TTS، مدل‌ها و کوتا</p>
            </div>
            <Button
              variant="outline"
              className="rounded-2xl border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50"
            >
              به‌روزرسانی دستی
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            {aiServices.map((service) => {
              const Icon = service.icon;
              const statusMeta = aiServiceStatusConfig[service.status];
              const usagePercent = Math.min(100, Math.round((service.tokens24h / service.quota) * 100));
              return (
                <div
                  key={service.id}
                  className="rounded-2xl border border-slate-100/60 bg-white/80 p-4 shadow-sm shadow-indigo-500/5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{service.title}</p>
                        <p className="text-xs text-slate-500">{service.type}</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.badge}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 text-xs text-slate-500 sm:grid-cols-3">
                    <p>
                      تاخیر:{" "}
                      <span className="font-semibold text-slate-900">
                        {service.latencyMs ? `${service.latencyMs} ms` : "در دسترس نیست"}
                      </span>
                    </p>
                    <p>
                      مصرف ۲۴ ساعت:{" "}
                      <span className="font-semibold text-slate-900">
                        {formatNumber(service.tokens24h)} از {formatNumber(service.quota)}
                      </span>
                    </p>
                    <p>
                      آخرین هشدار: <span className="font-semibold text-slate-900">{service.lastIncident}</span>
                    </p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${
                        service.status === "down"
                          ? "bg-rose-400"
                          : service.status === "degraded"
                            ? "bg-amber-400"
                            : "bg-indigo-500"
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.title}
              onClick={() => navigate(shortcut.path)}
              className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/80 p-6 text-left shadow-lg shadow-indigo-500/5 transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <span className={`flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br ${shortcut.accent}`}>
                  <Icon className="h-6 w-6 text-white" />
                </span>
                <div>
                  <p className="text-base font-bold text-slate-900">{shortcut.title}</p>
                  <p className="text-sm text-slate-500">{shortcut.description}</p>
                </div>
              </div>
              <div className="mt-6 text-left text-sm font-semibold text-indigo-500 opacity-0 transition group-hover:opacity-100">
                شروع مدیریت ←
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
};

export default AdminDashboard;
