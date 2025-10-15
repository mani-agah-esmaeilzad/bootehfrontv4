export interface SemanticFieldDatum {
  field: string;
  mentions: number;
}

const sanitizeNumber = (value: unknown): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const sanitizeLabel = (value: unknown, index: number): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number") {
    return value.toLocaleString("fa-IR");
  }

  return `حوزه ${index + 1}`;
};

export const withRtlFields = (input: unknown): SemanticFieldDatum[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((entry, index) => {
    if (typeof entry === "string" || typeof entry === "number") {
      return {
        field: sanitizeLabel(entry, index),
        mentions: typeof entry === "number" ? sanitizeNumber(entry) : 0,
      };
    }

    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const field = sanitizeLabel(record.field ?? record.name, index);
      const mentions = sanitizeNumber(record.mentions ?? record.value);
      return { field, mentions };
    }

    return {
      field: `حوزه ${index + 1}`,
      mentions: 0,
    };
  });
};
