// src/pages/Register.tsx
import { useMemo, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
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
  gender: "",
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
  component?: "input" | "select";
  options?: Array<{ value: string; label: string }>;
};

const ageOptions = Array.from({ length: 53 }, (_, index) => {
  const age = 18 + index;
  return { value: age.toString(), label: `${age} سال` };
});

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
    placeholder: "سن خود را انتخاب کنید",
    dir: "rtl",
    component: "select",
    options: ageOptions,
  },
  {
    key: "educationLevel",
    label: "سطح تحصیلات",
    placeholder: "سطح تحصیلات خود را انتخاب کنید",
    dir: "rtl",
    component: "select",
    options: [
      { value: "diploma", label: "دیپلم" },
      { value: "associate", label: "فوق‌دیپلم" },
      { value: "bachelor", label: "کارشناسی" },
      { value: "master", label: "کارشناسی ارشد" },
      { value: "phd", label: "دکتری" },
      { value: "other", label: "سایر" },
    ],
  },
  {
    key: "gender",
    label: "جنسیت",
    placeholder: "جنسیت خود را انتخاب کنید",
    dir: "rtl",
    component: "select",
    options: [
      { value: "female", label: "زن" },
      { value: "male", label: "مرد" },
      { value: "non_binary", label: "غیره / ترجیح می‌دهم نگویم" },
    ],
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

  const updateField = (key: keyof typeof defaultFormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name as keyof typeof defaultFormState;
    updateField(name, event.target.value);
  };

  const handleSelectChange = (key: keyof typeof defaultFormState) => (value: string) => {
    updateField(key, value);
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
        gender: formData.gender || null,
        workExperience: formData.workExperience || null,
      };

      const response = await apiFetch("auth/register", {
        method: "POST",
        body: JSON.stringify(submissionData),
      });

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
    <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 text-gray-900">
      <div className="w-full max-w-xl space-y-10">
        <div className="flex flex-col items-center space-y-4">
          <Logo className="h-12 w-12 text-gray-900" />
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold">ساخت حساب جدید</h1>
            <p className="text-sm text-gray-500">
              اطلاعات موردنیاز را مرحله‌به‌مرحله وارد کنید تا حساب {primaryField} ایجاد شود.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-900">
            {activeField.label}
            <div className="relative">
              {activeField.component === "select" ? (
                <Select
                  key={activeField.key}
                  value={formData[activeField.key] || undefined}
                  onValueChange={handleSelectChange(activeField.key)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    dir={activeField.dir ?? "rtl"}
                    className={`h-12 rounded-none border-0 border-b border-gray-300 bg-transparent px-0 text-base text-gray-900 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                      activeField.dir === "ltr"
                        ? "justify-between text-left [&>span]:text-left"
                        : "flex-row-reverse gap-2 text-right [&>span]:w-full [&>span]:text-right"
                    }`}
                  >
                    <SelectValue placeholder={activeField.placeholder} />
                  </SelectTrigger>
                  <SelectContent
                    dir={activeField.dir === "rtl" ? "rtl" : "ltr"}
                    className={activeField.dir === "rtl" ? "text-right" : ""}
                  >
                    {activeField.options?.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className={activeField.dir === "rtl" ? "text-right" : ""}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
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
                    className={`h-12 rounded-none border-0 border-b border-gray-300 bg-transparent px-0 text-base text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-900 focus-visible:ring-0 ${
                      activeField.dir === "ltr" ? "text-left" : "text-right"
                    } ${
                      activeField.key === "password" || activeField.key === "passwordConfirmation" ? "pr-10" : ""
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

                  {activeField.key === "passwordConfirmation" && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                      className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-gray-500 hover:text-gray-900"
                    >
                      {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </>
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
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-gray-700 transition hover:text-gray-900"
            >
              قبلاً ثبت‌نام کرده‌اید؟ ورود
            </button>
          </div>

          <Button
            type="button"
            onClick={() => void handleContinue()}
            disabled={isLoading}
            className="w-full rounded-full bg-gray-900 py-3 text-base font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : currentStep === totalSteps - 1 ? "ثبت‌نام" : "ادامه"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register;
