// src/lib/rtlText.ts
import reshape from "arabic-persian-reshaper";

const RTL_CHAR_PATTERN = /[\u0600-\u06FF]/;

export const shapeText = (value: unknown): string => {
  if (typeof value !== "string" || value.trim().length === 0) return String(value ?? "");
  if (!RTL_CHAR_PATTERN.test(value)) return value;
  try {
    return reshape.convert(value);
  } catch {
    return value;
  }
};

export const mapShape = <T extends Record<string, any>>(item: T): T => {
  const next: Record<string, any> = { ...item };
  Object.keys(next).forEach((key) => {
    const val = next[key];
    next[key] =
      typeof val === "string"
        ? shapeText(val)
        : Array.isArray(val)
        ? val.map((entry) => (typeof entry === "string" ? shapeText(entry) : entry))
        : val;
  });
  return next as T;
};

