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
    <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 text-gray-900">
      <div className="w-full max-w-sm space-y-10">
        <div className="flex flex-col items-center space-y-4">
          <Logo className="h-12 w-12 text-gray-900" />
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold">ورود به حساب کاربری</h1>
            <p className="text-sm text-gray-500">{highlightedText}</p>
          </div>
        </div>

        <div className="space-y-6">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-900">
            {activeField.label}
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
                className={`h-12 rounded-none border-0 border-b border-gray-300 bg-transparent px-0 text-left text-base text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-900 focus-visible:ring-0 ${
                  activeField.key === "password" ? "pr-10" : ""
                }`}
              />
              {activeField.key === "password" && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-gray-500 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </label>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
              className="flex items-center gap-2 text-gray-500 transition hover:text-gray-900 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </button>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm font-medium text-gray-700 transition hover:text-gray-900"
            >
              ساخت حساب جدید
            </button>
          </div>

          <Button
            type="button"
            onClick={() => void handleContinue()}
            disabled={isLoading}
            className="w-full rounded-full bg-gray-900 py-3 text-base font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : isLastStep ? "ورود" : "ادامه"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
