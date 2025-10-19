// src/pages/Register.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";

const defaultFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
  phoneNumber: "",
  age: "",
  educationLevel: "",
  workExperience: "",
};

type RegisterField = {
  key: keyof typeof defaultFormState;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  dir?: "rtl" | "ltr";
};

const fields: RegisterField[] = [
  {
    key: "firstName",
    label: "نام",
    placeholder: "نام خود را وارد کنید",
    required: true,
    dir: "rtl",
    autoComplete: "given-name",
  },
  {
    key: "lastName",
    label: "نام خانوادگی",
    placeholder: "نام خانوادگی خود را وارد کنید",
    required: true,
    dir: "rtl",
    autoComplete: "family-name",
  },
  {
    key: "email",
    label: "ایمیل سازمانی",
    placeholder: "you@example.com",
    type: "email",
    required: true,
    dir: "ltr",
    autoComplete: "email",
  },
  {
    key: "password",
    label: "رمز عبور",
    placeholder: "••••••••",
    type: "password",
    required: true,
    dir: "ltr",
    autoComplete: "new-password",
  },
  {
    key: "passwordConfirmation",
    label: "تکرار رمز عبور",
    placeholder: "رمز عبور را دوباره وارد کنید",
    type: "password",
    required: true,
    dir: "ltr",
    autoComplete: "new-password",
  },
  {
    key: "phoneNumber",
    label: "شماره تماس",
    placeholder: "09xxxxxxxxx",
    dir: "rtl",
    autoComplete: "tel",
  },
  {
    key: "age",
    label: "سن",
    placeholder: "مثلاً 28",
    type: "number",
    dir: "ltr",
  },
  {
    key: "educationLevel",
    label: "سطح تحصیلات",
    placeholder: "مثلاً کارشناسی ارشد",
    dir: "rtl",
  },
  {
    key: "workExperience",
    label: "شغل",
    placeholder: "عنوان شغلی یا حوزه فعالیت",
    dir: "rtl",
  },
];

const Register = () => {
  const [formData, setFormData] = useState(defaultFormState);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const activeField = fields[currentStep];
  const totalSteps = fields.length;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleRegister = async () => {
    setIsLoading(true);

    if (formData.password !== formData.passwordConfirmation) {
      toast.error("رمز عبور و تکرار آن یکسان نیستند");
      setIsLoading(false);
      return;
    }

    try {
      const submissionData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber || null,
        age: formData.age ? parseInt(formData.age, 10) : null,
        educationLevel: formData.educationLevel || null,
        workExperience: formData.workExperience || null,
      };

      const response = await apiFetch("auth/register", {
        method: "POST",
        body: JSON.stringify(submissionData),
      });

      // Backend now returns a message, not a token on register
      if (response.success) {
        toast.success("ثبت‌نام با موفقیت انجام شد! لطفاً وارد شوید.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        throw new Error(response.error || response.message || "خطایی در ثبت‌نام رخ داد");
      }
    } catch (error: any) {
      toast.error(error.message || "خطای سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const primaryField = useMemo(() => formData.firstName.trim() || "پروفایل جدید", [formData.firstName]);

  const handleContinue = async () => {
    if (isLoading) return;
    const value = formData[activeField.key]?.toString().trim();

    if (activeField.required && !value) {
      toast.error("این فیلد الزامی است");
      return;
    }

    if (currentStep === totalSteps - 1) {
      await handleRegister();
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 0 || isLoading) return;
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleContinue();
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b0b10] text-white">
      <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-xs uppercase tracking-[0.4em] text-white/50">بوته</span>
          <h1 className="text-3xl font-semibold">ساخت حساب جدید</h1>
          <p className="max-w-md text-sm text-white/60">
            مراحل را یک‌به‌یک تکمیل کنید تا حساب {primaryField} برای گفتگوهای چندنقشه فعال شود.
          </p>
        </div>

        <Card className="w-full max-w-xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="space-y-8 p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-fuchsia-500 text-white shadow-lg">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/50">
                  مرحله {currentStep + 1} از {totalSteps}
                </p>
                <h2 className="text-xl font-medium text-white">{activeField.label}</h2>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Input
                  key={activeField.key}
                  name={activeField.key}
                  type={(() => {
                    if (activeField.key === "password" && !showPassword) return "password";
                    if (activeField.key === "passwordConfirmation" && !showPasswordConfirmation) return "password";
                    return activeField.type || "text";
                  })()}
                  dir={activeField.dir ?? "rtl"}
                  placeholder={activeField.placeholder}
                  autoComplete={activeField.autoComplete}
                  value={formData[activeField.key]}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className={`h-12 rounded-2xl border-white/10 bg-white/10 pr-4 text-base text-white placeholder:text-white/35 focus-visible:border-white/40 focus-visible:ring-0 ${
                    activeField.dir === "ltr" ? "text-left" : "text-right"
                  }`}
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

                {activeField.key === "passwordConfirmation" && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                    className="absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/10 text-white/70 hover:bg-white/20"
                  >
                    {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
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
                <div className="flex flex-wrap justify-end gap-1">
                  {fields.map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-6 rounded-full transition ${
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
                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : currentStep === totalSteps - 1 ? "ثبت‌نام" : "ادامه"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm text-white/70">
          <span>قبلاً ثبت‌نام کرده‌اید؟ </span>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-white transition hover:text-white/80 hover:underline"
          >
            ورود به حساب
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
