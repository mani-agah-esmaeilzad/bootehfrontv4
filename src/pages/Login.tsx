// src/pages/Login.tsx

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";

const highlights = [
  {
    title: "ورود امن",
    description: "تمامی داده‌ها با استانداردهای رمزنگاری سازمانی محافظت می‌شوند.",
  },
  {
    title: "گزارش لحظه‌ای",
    description: "پس از ورود، داشبورد گفتگوها با نمودارهای خمیده به‌روزرسانی می‌شود.",
  },
  {
    title: "همراهی نقش‌ها",
    description: "راوی، مبصر و کاربر در یک مسیر ساده و مینیمال کنار شما هستند.",
  },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        localStorage.setItem("isLoggedIn", "true");

        toast.success("ورود با موفقیت انجام شد!");
        navigate("/dashboard");
      } else {
        throw new Error(response.message || "ایمیل یا رمز عبور نامعتبر است");
      }
    } catch (error: any) {
      toast.error(error.message || "خطا در ورود به سیستم. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const highlightedText = useMemo(
    () => email.trim() || "به اکوسیستم گفتگو خوش آمدید",
    [email],
  );

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen items-center lg:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden h-full items-center justify-center overflow-hidden bg-slate-950 text-white lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/60 via-slate-950 to-slate-900" />
          <div className="absolute inset-x-0 -top-24 h-[420px] bg-gradient-to-b from-purple-500/20 via-purple-500/5 to-transparent" />
          <div className="absolute inset-0">
            <svg className="h-full w-full opacity-20" viewBox="0 0 800 600" preserveAspectRatio="none">
              <path
                d="M0 520 Q200 440 400 480 T800 420"
                fill="none"
                stroke="url(#loginLineGradient)"
                strokeWidth="2"
              />
              <path
                d="M0 360 Q220 300 420 340 T800 300"
                fill="none"
                stroke="url(#loginLineGradient)"
                strokeWidth="2"
              />
              <defs>
                <linearGradient id="loginLineGradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="50%" stopColor="rgba(168,85,247,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="relative z-10 flex w-full max-w-lg flex-col gap-12 px-12">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/70">
              <span>بوته</span>
              <span>پلتفرم گفتگوی چندنقشه</span>
            </div>
            <div className="space-y-6">
              <Logo variant="large" className="h-12 w-auto text-white" />
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                ورود به فضای تحلیل احساس و تصمیم به سادگی یک لمس.
              </h1>
              <p className="max-w-md text-sm leading-7 text-white/70">
                پس از ورود، روند گفتگوهای سه‌نقشی روی مسیر خمیده نمایش داده می‌شود و نمودارهای بنفش نبض جلسات شما را دنبال می‌کنند.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>هایلایت بعدی</span>
                <ArrowLeft className="h-4 w-4" />
              </div>
              <p className="mt-4 text-base font-medium text-white">
                {highlightedText}
              </p>
              <div className="mt-6 grid gap-3 text-sm text-white/70">
                {highlights.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-xs leading-6 text-white/70">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="flex h-full w-full items-center justify-center px-4 py-12 sm:px-8">
          <div className="relative w-full max-w-md">
            <div className="absolute -top-16 right-6 hidden h-32 w-32 rounded-full bg-purple-500/20 blur-3xl sm:block" />
            <div className="absolute -bottom-12 left-0 hidden h-28 w-28 rounded-full bg-slate-900/10 blur-2xl sm:block" />
            <Card className="relative z-10 border border-slate-200/80 bg-white/95 shadow-hrbooteh-md backdrop-blur">
              <CardContent className="space-y-8 p-8">
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                    <ArrowLeft className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">ورود به حساب</h2>
                  <p className="text-sm leading-6 text-slate-500">
                    ایمیل سازمانی خود را وارد کنید تا مسیر گفتگوها و نمودارهای شخصی‌سازی‌شده را ببینید.
                  </p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-right text-sm font-medium text-slate-700">
                      ایمیل
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      dir="rtl"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-right text-sm font-medium text-slate-700">
                      رمز عبور
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        dir="rtl"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="pr-4 text-right"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full rounded-full bg-slate-900 py-6 text-base font-medium text-white transition hover:bg-slate-800"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : "ورود"}
                  </Button>
                </form>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center text-sm text-slate-600">
                  <span>حساب کاربری ندارید؟ </span>
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="font-medium text-purple-600 transition hover:text-purple-700"
                  >
                    ثبت‌نام کنید
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
