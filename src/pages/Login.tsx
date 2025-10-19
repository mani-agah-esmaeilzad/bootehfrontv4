// src/pages/Login.tsx

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div dir="rtl" className="min-h-screen bg-[#0b0b10] text-white">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="space-y-8 p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-fuchsia-500 text-white shadow-lg">
                <Logo className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">بوته</p>
                <h1 className="text-2xl font-semibold">به فضای گفتگو خوش آمدید</h1>
                <p className="text-sm text-white/60">{highlightedText}</p>
              </div>
            </div>

            <div className="space-y-3 text-center">
              <span className="text-xs text-white/50">
                مرحله {currentStep + 1} از {steps.length}
              </span>
              <h2 className="text-xl font-medium text-white">{activeField.label}</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
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
                    className="h-12 rounded-2xl border-white/10 bg-white/10 pr-4 text-left text-base text-white placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-0"
                  />
                  {activeField.key === "password" && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/10 text-white/70 hover:bg-white/20"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/40">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isLoading}
                  className="flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-white/10 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  بازگشت
                </button>
                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-8 rounded-full transition ${
                        index <= currentStep ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => void handleContinue()}
                disabled={isLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 py-6 text-base font-semibold text-white shadow-lg transition hover:shadow-purple-500/30 disabled:opacity-60"
              >
                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : isLastStep ? "ورود" : "ادامه"}
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
              <span>حساب کاربری ندارید؟ </span>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-medium text-white transition hover:text-white/80 hover:underline"
              >
                ساخت حساب جدید
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
