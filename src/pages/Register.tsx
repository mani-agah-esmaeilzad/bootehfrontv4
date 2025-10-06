// src/pages/Register.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";

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
        // Optional fields
        phoneNumber: formData.phoneNumber || null,
        age: formData.age ? parseInt(formData.age, 10) : null,
        educationLevel: formData.educationLevel || null,
        workExperience: formData.workExperience || null,
      };

      const response = await apiFetch('auth/register', {
        method: 'POST',
        body: JSON.stringify(submissionData),
      });

      // Backend now returns a message, not a token on register
      if (response.success) {
        toast.success("ثبت‌نام با موفقیت انجام شد! لطفاً وارد شوید.");
        setTimeout(() => {
          navigate('/login'); // Redirect to login page after successful registration
        }, 2000);
      } else {
        throw new Error(response.error || response.message || 'خطایی در ثبت‌نام رخ داد');
      }
    } catch (error: any) {
      toast.error(error.message || 'خطای سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hrbooteh-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-hrbooteh-lg border-0 bg-hrbooteh-surface overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Logo variant="large" />
          </div>
          <CardTitle className="text-2xl font-bold text-hrbooteh-text-primary">
            ثبت‌نام در hrbooteh
          </CardTitle>
          <CardDescription className="text-hrbooteh-text-secondary">
            حساب کاربری خود را ایجاد کنید و مسیر ارزیابی را شروع کنید
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">نام</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">نام خانوادگی</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} className="pl-10" required />
                  <Button type="button" variant="hrbooteh-ghost" size="icon-sm" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">تکرار رمز عبور</Label>
                <Input id="passwordConfirmation" name="passwordConfirmation" type="password" value={formData.passwordConfirmation} onChange={handleChange} required />
              </div>
            </div>

            <hr className="my-4 border-hrbooteh-surface-elevated" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">شماره تماس (اختیاری)</Label>
                <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">سن (اختیاری)</Label>
                <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="educationLevel">سطح تحصیلات (اختیاری)</Label>
                <Input id="educationLevel" name="educationLevel" value={formData.educationLevel} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workExperience">شغل (اختیاری)</Label>
                <Input id="workExperience" name="workExperience" value={formData.workExperience} onChange={handleChange} />
              </div>
            </div>

            <Button type="submit" variant="hrbooteh-gradient" size="lg" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : 'ثبت‌نام'}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-hrbooteh-text-secondary text-sm">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <button onClick={() => navigate('/login')} className="text-hrbooteh-primary hover:text-hrbooteh-primary-hover font-medium underline-offset-4 hover:underline transition-colors">
                وارد شوید
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
