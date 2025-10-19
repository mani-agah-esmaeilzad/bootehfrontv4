// src/pages/Register.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#050509] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-1/2 h-96 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-between px-6 py-10 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3 text-sm text-white/70">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="tracking-[0.4em]">بوته</span>
          </div>

          <div className="mt-12 max-w-xl space-y-6">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              ثبت‌نام در اکوسیستم گفتگو
            </h1>
            <p className="text-base text-white/70 sm:text-lg">
              با تکمیل اطلاعات، حساب {primaryField} آماده‌ی گفتگوهای چندنقشه خواهد شد.
            </p>
          </div>

          <div className="mt-10 flex items-center justify-between text-xs text-white/50">
            <span>© {new Date().getFullYear()} بوته</span>
            <span>مسیر رشد فردی و سازمانی</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="w-full max-w-xl space-y-8">
            <div className="space-y-3 text-center lg:text-right">
              <p className="text-sm text-white/50">اطلاعات خواسته‌شده را گام‌به‌گام وارد کنید</p>
              <h2 className="text-2xl font-semibold text-white">{activeField.label}</h2>
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
                  className={`h-14 rounded-full border border-white/10 bg-white/5 pr-5 text-base text-white placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-0 ${
                    activeField.dir === "ltr" ? "text-left" : "text-right"
                  }`}
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

                {activeField.key === "passwordConfirmation" && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                    className="absolute left-4 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/10 text-white/70 hover:bg-white/15"
                  >
                    {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : currentStep === totalSteps - 1 ? "ثبت‌نام" : "ادامه"}
              </Button>
            </div>

            <div className="text-center text-sm text-white/70">
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
      </div>
    </div>
  );
};

export default Register;
