// src/components/modals/ResultsModal.tsx

import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import apiFetch from '@/services/apiService';
import { SpiderChart } from '@/components/ui/SpiderChart';
import { ComparisonSpiderChart } from '@/components/ui/ComparisonSpiderChart';
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

const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]+/g, "");

const resolvePhaseField = (source: Record<string, any>, candidates: string[]) => {
    const normalizedMap = new Map<string, string>();
    Object.keys(source).forEach((key) => normalizedMap.set(normalizeKey(key), key));
    for (const candidate of candidates) {
        const normalized = normalizeKey(candidate);
        if (normalizedMap.has(normalized)) {
            return source[normalizedMap.get(normalized)!];
        }
    }
    return undefined;
};

const comparisonPalette = ["#6366f1", "#f97316", "#0ea5e9", "#14b8a6"];

const extractPhaseSpiderEntries = (phaseAnalysis?: Record<string, unknown> | null) => {
    if (!phaseAnalysis || typeof phaseAnalysis !== "object") return [];
    const source = phaseAnalysis as Record<string, any>;
    const candidates = [
        resolvePhaseField(source, ["factor_scores", "factor score", "factor-score"]),
        resolvePhaseField(source, ["factor_scatter", "scatter_data", "factor scatter"]),
        resolvePhaseField(source, ["factor_contribution", "factor share", "factor contribution"]),
    ];
    for (const candidate of candidates) {
        const normalized = normalizeSpiderData(candidate);
        if (normalized.length > 0) return normalized;
    }
    return [];
};

const buildPhaseComparison = (phases: PhaseBreakdownEntry[] | undefined | null) => {
    const usablePhases = Array.isArray(phases) ? phases : [];
    const series: Array<{ key: string; label: string; color: string }> = [];
    const dataMap = new Map<string, Record<string, number | string | undefined>>();

    usablePhases.forEach((phase, index) => {
        const entries = extractPhaseSpiderEntries(phase.analysis);
        if (entries.length === 0) return;
        const phaseNumber = phase.phase ?? index + 1;
        const key = `phase_${phaseNumber}`;
        const label = phase.personaName
            ? `پرسشنامه ${phaseNumber} – ${phase.personaName}`
            : `پرسشنامه ${phaseNumber}`;
        series.push({
            key,
            label,
            color: comparisonPalette[index % comparisonPalette.length],
        });

        entries.forEach((entry) => {
            const subjectKey = entry.subject || `مولفه ${phaseNumber}`;
            const existing = dataMap.get(subjectKey) ?? { subject: subjectKey, fullMark: entry.fullMark };
            const currentFullMark = typeof existing.fullMark === "number" ? existing.fullMark : toNum(existing.fullMark);
            existing.fullMark = Math.max(currentFullMark || 0, entry.fullMark || 0);
            existing[key] = entry.score;
            dataMap.set(subjectKey, existing);
        });
    });

    const data = Array.from(dataMap.values()).map((entry) => {
        series.forEach((serie) => {
            if (typeof entry[serie.key] !== "number") {
                entry[serie.key] = 0;
            }
        });
        return entry;
    });

    return { data, series };
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
                            const sanitizedAnalysis: FinalAnalysis = {
                                ...resultData.results.final_analysis,
                                report: "",
                            };
                            setAnalysis(sanitizedAnalysis);
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
                const finalData = extractPhaseSpiderEntries(phase.analysis);
                if (finalData.length === 0) return null;
                return { id: `phase-spider-${phaseNumber}-${index}`, label, data: finalData };
            })
            .filter(
                (item): item is { id: string; label: string; data: Array<{ subject: string; score: number; fullMark: number }> } =>
                    Boolean(item)
            );
    }, [analysis]);
    const phaseComparison = useMemo(() => buildPhaseComparison(analysis?.phase_breakdown), [analysis]);
    const phaseSummaries = useMemo(() => {
        const phases = analysis?.phase_breakdown;
        if (!Array.isArray(phases)) return [];
        return phases
            .map((phase, index) => {
                const phaseNumber = typeof phase.phase === "number" ? phase.phase : index + 1;
                const persona = phase.personaName?.trim();
                const title = persona ? `پرسشنامه ${phaseNumber} – ${persona}` : `پرسشنامه ${phaseNumber}`;
                const report =
                    phase.analysis && typeof (phase.analysis as Record<string, unknown>)?.report === "string"
                        ? ((phase.analysis as Record<string, unknown>).report as string).trim()
                        : "";
                if (!report) return null;
                return { id: `phase-summary-${phaseNumber}-${index}`, title, report };
            })
            .filter((item): item is { id: string; title: string; report: string } => Boolean(item));
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
                                phaseComparison.series.length >= 2 ? (
                                    <ComparisonSpiderChart data={phaseComparison.data} series={phaseComparison.series} />
                                ) : (
                                    <SpiderChart data={chartData} />
                                )
                            ) : (
                                <p className="text-sm text-gray-500">داده‌ای برای نمایش نمودار وجود ندارد.</p>
                            )}
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
                        {phaseSummaries.length > 0 ? (
                            <div className="space-y-3 rounded-xl border border-hrbooteh-surface-elevated bg-hrbooteh-surface p-4">
                                <p className="text-base font-semibold text-hrbooteh-text-primary">تحلیل هر پرسشنامه</p>
                                <div className="space-y-3">
                                    {phaseSummaries.slice(0, 2).map((summary) => (
                                        <div key={summary.id} className="rounded-lg border border-hrbooteh-surface-elevated/70 bg-hrbooteh-surface-elevated p-3">
                                            <p className="text-xs font-semibold text-hrbooteh-text-secondary">{summary.title}</p>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-hrbooteh-text-secondary">
                                                <ReactMarkdown>{summary.report}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-hrbooteh-surface-elevated bg-hrbooteh-surface/60 p-4 text-center text-sm text-hrbooteh-text-secondary">
                                تحلیلی برای پرسشنامه‌ها در دسترس نیست.
                            </div>
                        )}
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
