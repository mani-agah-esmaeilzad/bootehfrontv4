// src/components/modals/ResultsModal.tsx

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import apiFetch from '@/services/apiService';
import { SpiderChart } from '@/components/ui/SpiderChart';
import ReactMarkdown from 'react-markdown';

// --- Type Definitions ---
interface FactorScore {
    factor: string;
    score: number;
    maxScore: number;
}
interface FinalAnalysis {
    score: number;
    report: string;
    factor_scores: FactorScore[];
}
interface AssessmentResult {
    questionnaire_title: string;
    results: {
        // The final_analysis is now expected to be an object
        final_analysis: FinalAnalysis; 
    };
}
interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessmentId: number | null;
}

const ResultsModal = ({ isOpen, onClose, assessmentId }: ResultsModalProps) => {
    const [analysis, setAnalysis] = useState<FinalAnalysis | null>(null);
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && assessmentId) {
            setIsLoading(true);
            setError(null);
            setAnalysis(null);

            const fetchResult = async () => {
                try {
                    const response = await apiFetch(`assessment/results/${assessmentId}`);
                    if (response.success && response.data) {
                        const resultData: AssessmentResult = response.data;
                        setTitle(resultData.questionnaire_title);

                        // *** FINAL FIX APPLIED HERE: No more JSON.parse needed ***
                        // We now directly access the final_analysis object.
                        if (resultData.results && typeof resultData.results.final_analysis === 'object') {
                            setAnalysis(resultData.results.final_analysis);
                        } else {
                            // This error will be thrown if the backend response structure is wrong
                            throw new Error("ساختار گزارش نهایی دریافت شده از سرور نامعتبر است.");
                        }
                    } else {
                        throw new Error(response.message || "گزارش ارزیابی یافت نشد.");
                    }
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchResult();
        }
    }, [isOpen, assessmentId]);

    const chartData = analysis?.factor_scores.map(item => ({
        subject: item.factor,
        score: item.score,
        fullMark: item.maxScore,
    })) || [];

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-80 gap-4">
                    <LoaderCircle className="h-12 w-12 animate-spin text-hrbooteh-primary" />
                    <p>در حال آماده‌سازی گزارش نهایی شما...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-destructive">
                    <AlertTriangle className="h-12 w-12" />
                    <p className="font-semibold">خطا در بارگذاری گزارش</p>
                    <p className="text-sm text-center font-mono bg-red-50 p-2 rounded">{error}</p>
                </div>
            );
        }
        if (analysis) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto p-1">
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-hrbooteh-text-primary">نمودار شایستگی‌ها</h3>
                        <div className="w-full h-80 flex items-center justify-center">
                            {chartData.length > 0 ? (
                                <SpiderChart data={chartData} />
                            ) : <p className="text-sm text-gray-500">داده‌ای برای نمایش نمودار وجود ندارد.</p>}
                        </div>
                        <div className="text-center">
                            <p className="text-hrbooteh-text-secondary">امتیاز کل</p>
                            <p className="text-4xl font-bold text-hrbooteh-primary">{analysis.score}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                         <h3 className="text-lg font-semibold text-hrbooteh-text-primary">تحلیل نهایی عملکرد</h3>
                         <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-hrbooteh-surface-elevated rounded-md border">
                            <ReactMarkdown>
                                {analysis.report}
                            </ReactMarkdown>
                         </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">گزارش نهایی ارزیابی: {title}</DialogTitle>
                    <DialogDescription>
                        این گزارش بر اساس عملکرد شما در طول مصاحبه شبیه‌سازی شده تهیه شده است.
                    </DialogDescription>
                </DialogHeader>
                
                {renderContent()}

                <DialogFooter>
                    <Button onClick={onClose}>بستن</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ResultsModal;
