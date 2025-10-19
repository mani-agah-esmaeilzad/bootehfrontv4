// src/pages/Login.tsx

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";

const steps = [
  {
    key: "email",
    label: "ایمیل سازمانی",
    type: "email",
    placeholder: "you@example.com",
    autoComplete: "email",
  },
  {
    key: "password",
    label: "رمز عبور",
    type: "password",
    placeholder: "••••••••",
    autoComplete: "current-password",
  },
];

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const highlightedText = useMemo(
    () => formData.email.trim() || "به اکوسیستم گفتگو خوش آمدید",
    [formData.email],
  );

  const isLastStep = currentStep === steps.length - 1;
  const activeField = steps[currentStep];

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
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

  const handleContinue = async () => {
    if (isLoading) return;
    const value = formData[activeField.key as keyof typeof formData]?.toString().trim();

    if (!value) {
      toast.error("لطفاً این فیلد را تکمیل کنید");
      return;
    }

    if (isLastStep) {
      await handleLogin();
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleContinue();
    }
  };

  const handleBack = () => {
    if (currentStep === 0 || isLoading) return;
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#050509] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-between px-6 py-10 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3 text-sm text-white/70">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Logo className="h-7 w-7" />
            </div>
            <span className="tracking-[0.4em]">بوته</span>
          </div>

          <div className="mt-12 max-w-xl space-y-6">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              ورود به فضای گفتگو
            </h1>
            <p className="text-base text-white/70 sm:text-lg">
              {highlightedText}
            </p>
          </div>

          <div className="mt-10 flex items-center justify-between text-xs text-white/50">
            <span>© {new Date().getFullYear()} بوته</span>
            <span>تجربه‌ای روان برای تیم شما</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3 text-center lg:text-right">
              <p className="text-sm text-white/50">اطلاعات کاربری خود را وارد کنید</p>
              <h2 className="text-2xl font-semibold text-white">{activeField.label}</h2>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Input
                  key={activeField.key}
                  name={activeField.key}
                  type={activeField.key === "password" && !showPassword ? "password" : activeField.type}
                  dir="ltr"
                  placeholder={activeField.placeholder}
                  autoComplete={activeField.autoComplete}
                  value={formData[activeField.key as keyof typeof formData]}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="h-14 rounded-full border border-white/10 bg-white/5 pr-5 text-left text-base text-white placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-0"
                />
                {activeField.key === "password" && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute left-4 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/10 text-white/70 hover:bg-white/15"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
              </div>

              <div className="flex justify-start text-sm text-white/60">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isLoading}
                  className="flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 transition hover:border-white/30 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  بازگشت
                </button>
              </div>

              <Button
                type="button"
                onClick={() => void handleContinue()}
                disabled={isLoading}
                className="w-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 py-4 text-base font-semibold text-white shadow-lg transition hover:shadow-fuchsia-500/30 disabled:opacity-60"
              >
                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : isLastStep ? "ورود" : "ادامه"}
              </Button>
            </div>

            <div className="text-center text-sm text-white/70">
              <span>حساب کاربری ندارید؟ </span>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-medium text-white transition hover:text-white/80 hover:underline"
              >
                ساخت حساب جدید
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
