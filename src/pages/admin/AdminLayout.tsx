// src/pages/admin/AdminLayout.tsx

import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  SlidersHorizontal,
  BarChart3,
  Sparkles,
  BarChart4,
  LogOut,
  Newspaper,
  Menu,
  X,
  Building,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "داشبورد" },
    { to: "/admin/questionnaires", icon: FileText, label: "پرسشنامه‌ها" },
    { to: "/admin/users", icon: Users, label: "کاربران" },
    { to: "/admin/user-stages", icon: SlidersHorizontal, label: "مراحل کاربران" },
    { to: "/admin/organizations", icon: Building, label: "سازمان‌ها" },
    { to: "/admin/reports", icon: BarChart3, label: "گزارش‌ها" },
    { to: "/admin/blog", icon: Newspaper, label: "بلاگ" },
    { to: "/admin/personality-tests", icon: Sparkles, label: "آزمون‌های شخصیتی" },
    { to: "/admin/personality-results", icon: BarChart4, label: "نتایج شخصیتی" },
  ];

  const activeNavLabel = useMemo(() => {
    const active = navItems.find((item) => location.pathname.startsWith(item.to));
    return active?.label ?? "پنل مدیریت";
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    toast.success("با موفقیت خارج شدید.");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/90 to-slate-900 text-white">
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-40 w-72 shrink-0 border-l border-white/10 bg-white/5 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex h-20 items-center justify-between px-6">
            <Logo variant="large" />
            <button className="p-2 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-white/70" />
            </button>
          </div>
          <div className="space-y-6 px-4 pb-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 shadow-lg shadow-indigo-500/10">
              <p className="text-xs text-white/50">امروز</p>
              <p className="mt-2 text-lg font-semibold text-white">به پنل مدیریت خوش آمدید</p>
              <p className="text-xs text-white/60">امور سازمانی خود را از اینجا کنترل کنید.</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white",
                        isActive && "bg-white text-slate-900 shadow-lg shadow-indigo-500/20"
                      )
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-white",
                        location.pathname.startsWith(item.to) && "bg-slate-900 text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <Button
              className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25 hover:opacity-90"
              onClick={handleLogout}
            >
              <LogOut className="ml-2 h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex items-center gap-3">
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white lg:hidden"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                >
                  {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div>
                  <p className="text-xs text-white/60">پنل مدیریت</p>
                  <h1 className="text-lg font-semibold text-white">{activeNavLabel}</h1>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-end gap-3">
                <div className="hidden w-full max-w-sm items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 shadow-inner shadow-black/10 sm:flex">
                  <span className="text-white/50">مدیریت حرفه‌ای، تجربه‌ای روان.</span>
                </div>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/20 bg-white/10 text-white shadow-lg shadow-indigo-500/10 hover:bg-white/20"
                  onClick={() => navigate("/")}
                >
                  بازگشت به وب‌سایت
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-7xl">
              <div className="admin-page">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
