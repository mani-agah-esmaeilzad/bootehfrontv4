export type WheelCategory = {
  key: string;
  label: string;
  color: string;
};

export type WheelDataRow = {
  dimension: string;
  [key: string]: string | number;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

export const buildMbtiWheelData = (analysis: any): { categories: WheelCategory[]; data: WheelDataRow[] } => {
  if (!analysis || !Array.isArray(analysis.axes) || analysis.axes.length === 0) {
    return { categories: [], data: [] };
  }

  const categories: WheelCategory[] = [
    { key: "dominant", label: "ترجیح غالب", color: "#2563eb" },
    { key: "support", label: "ترجیح دوم", color: "#f97316" },
  ];

  const data: WheelDataRow[] = analysis.axes.map((axis: any, index: number) => {
    const dimension = axis?.dimension || axis?.primary?.label || axis?.secondary?.label || `بعد ${index + 1}`;
    const dominant = clamp(axis?.dominantScore ?? axis?.primary?.score ?? 0);
    const support = clamp(axis?.secondaryScore ?? axis?.secondary?.score ?? 0);
    return {
      dimension,
      dominant,
      support,
    };
  });

  return { categories, data };
};
