// src/pages/Register.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";

const steps = [
  {
    title: "تعریف نقش",
    description: "نام و اطلاعات سازمانی خود را ثبت کنید تا در مسیر گفتگو دیده شوید.",
  },
  {
    title: "انتخاب مسیر",
    description: "زمینه تحصیلی و تجربه کاری به شخصی‌سازی نمودارها کمک می‌کند.",
  },
  {
    title: "شروع جلسه",
    description: "پس از تایید، اولین جلسه آزمایشی روی مسیر خمیده فعال می‌شود.",
  },
];

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", // Renamed from first_name
    lastName: "",  // Renamed from last_name
    email: "",
    // username field is removed
    password: "",
    passwordConfirmation: "", // Renamed from password_confirmation
    phoneNumber: "", // Renamed for consistency
    age: "",
    educationLevel: "", // Renamed for consistency
    workExperience: "", // Renamed for consistency
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.passwordConfirmation) {
      toast.error("رمز عبور و تکرار آن یکسان نیستند");
      setIsLoading(false);
      return;
    }

    try {
      // *** FIX APPLIED HERE ***
      // Keys are now camelCase to match the backend expectations.
      // Unnecessary fields are removed.
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

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen items-center lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-slate-950 text-white lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/70 via-slate-950 to-slate-900" />
          <div className="absolute -left-10 top-24 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl" />
          <div className="absolute right-0 bottom-12 h-48 w-48 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="relative z-10 flex flex-1 flex-col justify-center gap-12 px-12 py-16">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/70">
              <span>بوته</span>
              <span>ثبت‌نام</span>
            </div>
            <div className="space-y-6">
              <Logo variant="large" className="h-12 w-auto text-white" />
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                مسیر تازه‌ای از گفتگوهای نرم با نمودارهای بنفش و خطوط خمیده آغاز کنید.
              </h1>
              <p className="max-w-md text-sm leading-7 text-white/70">
                اطلاعات پایه را کامل کنید تا نقش شما در کنار راوی و مبصر روی مسیر مینیمال پلتفرم قرار گیرد.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Sparkles className="h-4 w-4" />
                <span>پروفایل در حال تکمیل: {primaryField}</span>
              </div>
              <div className="mt-6 grid gap-4">
                {steps.map((step) => (
                  <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">{step.title}</p>
                    <p className="mt-2 text-xs leading-6 text-white/70">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="flex h-full w-full items-center justify-center px-4 py-12 sm:px-8">
          <div className="relative w-full max-w-xl">
            <div className="absolute -top-14 left-6 hidden h-28 w-28 rounded-full bg-purple-500/20 blur-3xl sm:block" />
            <div className="absolute -bottom-20 right-0 hidden h-36 w-36 rounded-full bg-slate-900/10 blur-2xl sm:block" />
            <Card className="relative z-10 border border-slate-200/80 bg-white/95 shadow-hrbooteh-md backdrop-blur">
              <CardContent className="max-h-[80vh] overflow-y-auto p-8">
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">ساخت حساب جدید</h2>
                  <p className="text-sm leading-6 text-slate-500">
                    با تکمیل فرم زیر، حساب شما در مسیر گفتگوها فعال خواهد شد.
                  </p>
                </div>
                <form onSubmit={handleRegister} className="mt-8 space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-right text-sm font-medium text-slate-700">
                        نام
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        dir="rtl"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-right text-sm font-medium text-slate-700">
                        نام خانوادگی
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        dir="rtl"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-right text-sm font-medium text-slate-700">
                      ایمیل
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      dir="rtl"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="text-right"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-right text-sm font-medium text-slate-700">
                        رمز عبور
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          dir="rtl"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          className="pr-4 text-right"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirmation" className="text-right text-sm font-medium text-slate-700">
                        تکرار رمز عبور
                      </Label>
                      <Input
                        id="passwordConfirmation"
                        name="passwordConfirmation"
                        type="password"
                        dir="rtl"
                        value={formData.passwordConfirmation}
                        onChange={handleChange}
                        required
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-right text-sm font-medium text-slate-700">
                        شماره تماس
                      </Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        dir="rtl"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-right text-sm font-medium text-slate-700">
                        سن
                      </Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        dir="rtl"
                        value={formData.age}
                        onChange={handleChange}
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="educationLevel" className="text-right text-sm font-medium text-slate-700">
                        سطح تحصیلات
                      </Label>
                      <Input
                        id="educationLevel"
                        name="educationLevel"
                        dir="rtl"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workExperience" className="text-right text-sm font-medium text-slate-700">
                        شغل
                      </Label>
                      <Input
                        id="workExperience"
                        name="workExperience"
                        dir="rtl"
                        value={formData.workExperience}
                        onChange={handleChange}
                        className="text-right"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full bg-slate-900 py-5 text-base font-medium text-white transition hover:bg-slate-800 hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : "ثبت‌نام"}
                  </Button>
                </form>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center text-sm text-slate-600">
                  <span>قبلاً ثبت‌نام کرده‌اید؟ </span>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-medium text-purple-600 transition hover:text-purple-700 hover:underline"
                  >
                    ورود به حساب
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

export default Register;
