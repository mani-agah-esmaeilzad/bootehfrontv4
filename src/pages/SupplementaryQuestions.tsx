// src/pages/SupplementaryQuestions.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import ResultsModal from "@/components/modals/ResultsModal";

interface SupplementaryQuestionsData {
    supplementary_question_1: string;
    supplementary_question_2: string;
}

const SupplementaryQuestions = () => {
    const { id: questionnaireId } = useParams<{ id: string }>(); // This is the questionnaire ID
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<SupplementaryQuestionsData | null>(null);
    const [answers, setAnswers] = useState({ q1: "", q2: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [nextStage, setNextStage] = useState<{ type?: string; slug?: string | null } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // *** FIX: State to hold the correct assessment ID for the modal ***
    const [finalAssessmentId, setFinalAssessmentId] = useState<number | null>(null);

    useEffect(() => {
        if (!questionnaireId) {
            toast.error("شناسه ارزیابی نامعتبر است.");
            navigate('/dashboard');
            return;
        }

        const storedStateRaw = sessionStorage.getItem(`assessmentState_${questionnaireId}`);
        if (!storedStateRaw) {
            toast.error("جلسه ارزیابی منقضی شده است.");
            navigate('/dashboard');
            return;
        }
        
        const storedState = JSON.parse(storedStateRaw);
        setSessionId(storedState.sessionId);
        setNextStage(storedState.nextStage ?? null);

        const fetchQuestions = async () => {
            try {
                const response = await apiFetch(`assessment/supplementary/${questionnaireId}`, {
                    method: 'POST',
                    body: JSON.stringify({ session_id: storedState.sessionId })
                });

                if (response.success && response.data) {
                    setQuestions(response.data);
                } else {
                    throw new Error(response.message || "سوالات تکمیلی یافت نشدند.");
                }
            } catch (error: any) {
                toast.error(error.message);
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
    }, [questionnaireId, navigate]);

    const handleSubmit = async () => {
        if (!questionnaireId || !sessionId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // *** FIX: Capture the response from the finish API call ***
            const response = await apiFetch(`assessment/finish/${questionnaireId}`, {
                method: 'POST',
                body: JSON.stringify({ 
                    session_id: sessionId,
                    supplementary_answers: answers 
                }),
            });
            
            // *** FIX: Extract the correct assessmentId from the response ***
            if (response.success && response.data?.assessmentId) {
                setFinalAssessmentId(response.data.assessmentId);
                toast.success("پاسخ‌ها با موفقیت ارسال شد! در حال آماده‌سازی نتایج...");
                setIsModalOpen(true);
            } else {
                throw new Error(response.message || "خطا در نهایی‌سازی ارزیابی");
            }

        } catch (error: any) {
            toast.error("خطا در ارسال پاسخ‌ها: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        sessionStorage.removeItem(`assessmentState_${questionnaireId}`);
        if (nextStage?.type === 'mystery' && nextStage.slug) {
            navigate(`/mystery/${nextStage.slug}`);
        } else {
            navigate('/dashboard');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-hrbooteh-gradient-subtle">
                <LoaderCircle className="animate-spin h-12 w-12 text-hrbooteh-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-hrbooteh-gradient-subtle flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">سوالات تکمیلی</CardTitle>
                    <CardDescription>
                        لطفاً به دو سوال زیر پاسخ دهید تا تحلیل کامل‌تری از عملکرد شما داشته باشیم.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {questions?.supplementary_question_1 && (
                        <div className="space-y-2">
                            <Label htmlFor="q1" className="font-semibold">{questions.supplementary_question_1}</Label>
                            <Textarea id="q1" value={answers.q1} onChange={e => setAnswers(prev => ({ ...prev, q1: e.target.value }))} rows={5} />
                        </div>
                    )}
                    {questions?.supplementary_question_2 && (
                        <div className="space-y-2">
                            <Label htmlFor="q2" className="font-semibold">{questions.supplementary_question_2}</Label>
                            <Textarea id="q2" value={answers.q2} onChange={e => setAnswers(prev => ({ ...prev, q2: e.target.value }))} rows={5} />
                        </div>
                    )}
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
                        {isSubmitting ? <LoaderCircle className="animate-spin" /> : "ارسال و مشاهده نتیجه"}
                    </Button>
                </CardContent>
            </Card>

            {/* *** FIX: Pass the correct, final assessment ID to the modal *** */}
            <ResultsModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                assessmentId={finalAssessmentId}
            />
        </div>
    );
};

export default SupplementaryQuestions;
