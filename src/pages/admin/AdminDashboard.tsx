// src/pages/admin/AdminDashboard.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart2, Building, FileText, Sparkles, Users, SlidersHorizontal } from "lucide-react";
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
