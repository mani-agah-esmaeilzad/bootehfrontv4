// src/components/modals/ResultsModal.tsx

import { useEffect, useState, useMemo } from 'react';
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
    phase_breakdown?: PhaseBreakdownEntry[];
}
interface PhaseBreakdownEntry {
    phase?: number;
    personaName?: string | null;
    analysis?: Record<string, unknown> | null;
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

const persianDigitMap: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
};

const toNum = (val: unknown): number => {
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (val === null || val === undefined) return 0;
    const normalized = String(val)
        .trim()
        .replace(/[۰-۹]/g, (digit) => persianDigitMap[digit] ?? digit)
        .replace(/,/g, "")
        .replace(/%/g, "")
        .replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const parseArrayLike = (input: unknown): unknown[] => {
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const normalizeSpiderData = (input: unknown): Array<{ subject: string; score: number; fullMark: number }> => {
    const candidateArray = parseArrayLike(input);
    if (!Array.isArray(candidateArray)) return [];
    return candidateArray
        .map((entry, index) => {
            if (entry && typeof entry === "object") {
                const record = entry as Record<string, unknown>;
                const subject =
                    (record.factor as string) ||
                    (record.subject as string) ||
                    (record.name as string) ||
                    (record.label as string) ||
                    `مولفه ${index + 1}`;
                const score = toNum(record.score ?? record.value ?? record.actual ?? record.current);
                const fullMark = toNum(record.maxScore ?? record.fullMark ?? record.max ?? 5) || 5;
                return { subject, score, fullMark };
            }
            const numericValue = toNum(entry);
            return { subject: `مولفه ${index + 1}`, score: numericValue, fullMark: 5 };
        })
        .filter((item) => Number.isFinite(item.score));
};

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
    const phaseSpiderCharts = useMemo(() => {
        const phases = analysis?.phase_breakdown;
        if (!Array.isArray(phases)) return [];
        return phases
            .map((phase, index) => {
                const phaseNumber = typeof phase.phase === "number" ? phase.phase : index + 1;
                const persona = phase.personaName?.trim();
                const label = persona ? `پرسشنامه ${phaseNumber} · ${persona}` : `پرسشنامه ${phaseNumber}`;
                const phaseAnalysis = (phase.analysis ?? {}) as Record<string, unknown>;
                const baseData = normalizeSpiderData(phaseAnalysis["factor_scores"]);
                const fallbackScatter = normalizeSpiderData(phaseAnalysis["factor_scatter"]);
                const fallbackTreemap = normalizeSpiderData(phaseAnalysis["factor_contribution"]);
                const finalData =
                    baseData.length > 0
                        ? baseData
                        : fallbackScatter.length > 0
                            ? fallbackScatter
                            : fallbackTreemap.length > 0
                                ? fallbackTreemap
                                : [];
                if (finalData.length === 0) return null;
                return { id: `phase-spider-${phaseNumber}-${index}`, label, data: finalData };
            })
            .filter((item): item is { id: string; label: string; data: Array<{ subject: string; score: number; fullMark: number }> } => Boolean(item));
    }, [analysis]);

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
                        {phaseSpiderCharts.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-base font-semibold text-hrbooteh-text-primary">نمودار هر مرحله</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {phaseSpiderCharts.map((phase) => (
                                        <div
                                            key={phase.id}
                                            className="rounded-xl border border-hrbooteh-surface-elevated bg-hrbooteh-surface p-4"
                                        >
                                            <p className="text-sm font-medium text-hrbooteh-text-secondary mb-2">{phase.label}</p>
                                            <div className="h-64 flex items-center justify-center">
                                                <SpiderChart data={phase.data} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
