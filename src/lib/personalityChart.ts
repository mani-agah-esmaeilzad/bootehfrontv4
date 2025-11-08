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

const LETTER_COLORS: Record<string, string> = {
  E: "#2563eb",
  I: "#f97316",
  S: "#22c55e",
  N: "#14b8a6",
  T: "#a855f7",
  F: "#ec4899",
  J: "#facc15",
  P: "#0ea5e9",
};

export const buildMbtiWheelData = (analysis: any): { categories: WheelCategory[]; data: WheelDataRow[] } => {
  if (!analysis || !Array.isArray(analysis.axes) || analysis.axes.length === 0) {
    return { categories: [], data: [] };
  }

  const categoryMap = new Map<string, WheelCategory>();
  const registerLetter = (letter?: string) => {
    if (!letter) return;
    const normalized = letter.toUpperCase();
    if (categoryMap.has(normalized)) return;
    categoryMap.set(normalized, {
      key: normalized,
      label: normalized,
      color: LETTER_COLORS[normalized] || "#94a3b8",
    });
  };

  analysis.axes.forEach((axis: any) => {
    registerLetter(axis?.primary?.letter);
    registerLetter(axis?.secondary?.letter);
  });

  const categories = Array.from(categoryMap.values());
  const data: WheelDataRow[] = analysis.axes.map((axis: any, index: number) => {
    const dimension = axis?.dimension || axis?.primary?.label || axis?.secondary?.label || `بعد ${index + 1}`;
    const row: WheelDataRow = { dimension };
    categories.forEach((category) => {
      if (category.key === axis?.primary?.letter) {
        row[category.key] = clamp(axis?.primary?.score ?? 0);
      } else if (category.key === axis?.secondary?.letter) {
        row[category.key] = clamp(axis?.secondary?.score ?? 0);
      } else {
        row[category.key] = 0;
      }
    });
    return row;
  });

  return { categories, data };
};
