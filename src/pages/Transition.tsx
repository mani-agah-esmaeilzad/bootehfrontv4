import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { useNavigate, useParams } from "react-router-dom";
import { useAssessment } from "@/contexts/assessment-context";
import { CheckCircle, ArrowLeft, Trophy } from "lucide-react";

const Transition = () => {
  const { stringId } = useParams<{ stringId: string }>();
  const { assessments, getNextAssessment, completedCount } = useAssessment();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  const completedAssessment = assessments.find(a => a.stringId === stringId);
  const nextAssessment = getNextAssessment();
  const totalAssessments = assessments.length;

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (nextAssessment) {
      navigate('/dashboard');
    } else {
      navigate('/results');
    }
  };

  if (!completedAssessment) {
    return (
      <div className="min-h-screen bg-hrbooteh-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-hrbooteh-text-primary mb-4">
            ارزیابی یافت نشد
          </h1>
          <Button variant="hrbooteh" onClick={() => navigate('/dashboard')}>
            بازگشت به داشبورد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hrbooteh-gradient-subtle flex items-center justify-center p-4">
      <Card className={`w-full max-w-lg shadow-hrbooteh-lg border-0 bg-hrbooteh-surface transition-all duration-500 ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <Logo variant="default" />
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-hrbooteh-gradient-success rounded-full flex items-center justify-center animate-pulse-gentle">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-hrbooteh-text-primary mb-3">
            {completedAssessment.title} با موفقیت تکمیل شد!
          </h1>

          <p className="text-hrbooteh-text-secondary mb-8 leading-relaxed">
            عالی بود! شما یک قدم دیگر در مسیر توسعه مهارت‌های حرفه‌ای خود پیش رفته‌اید.
          </p>

          <div className="bg-hrbooteh-surface-elevated rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-hrbooteh-text-primary">پیشرفت کلی</span>
              <span className="text-sm text-hrbooteh-text-secondary">
                {completedCount} از {totalAssessments}
              </span>
            </div>

            <div className="w-full bg-hrbooteh-surface-elevated rounded-full h-3 mb-2">
              <div
                className="bg-hrbooteh-gradient-primary h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: totalAssessments > 0 ? `${(completedCount / totalAssessments) * 100}%` : '0%' }}
              />
            </div>

            <p className="text-xs text-hrbooteh-text-muted">
              {totalAssessments > 0 ? Math.round((completedCount / totalAssessments) * 100) : 0}% تکمیل شده
            </p>
          </div>

          {nextAssessment ? (
            <div className="space-y-4">
              <Button
                variant="hrbooteh-gradient"
                size="xl"
                onClick={handleContinue}
                className="w-full group"
              >
                <ArrowLeft className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                ادامه مسیر
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-hrbooteh-primary mb-2">
                تبریک! تمام ارزیابی‌ها تکمیل شدند
              </h2>

              <p className="text-hrbooteh-text-secondary mb-6">
                شما با موفقیت تمام مراحل ارزیابی را پشت سر گذاشته‌اید. حالا زمان مشاهده گزارش جامع شماست.
              </p>

              <Button
                variant="hrbooteh-gradient"
                size="xl"
                onClick={() => navigate('/results')}
                className="w-full group"
              >
                <Trophy className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                مشاهده گزارش نهایی
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Transition;