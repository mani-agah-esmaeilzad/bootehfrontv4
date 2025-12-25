const RTL_CHAR_REGEX = /[\u0600-\u06FF]/;
const ARABIC_INDIC_DIGIT_REGEX = /[\u0660-\u0669]/g;
const LATIN_DIGIT_REGEX = /[0-9]/g;

const ARABIC_INDIC_TO_PERSIAN: Record<string, string> = {
  "٠": "۰",
  "١": "۱",
  "٢": "۲",
  "٣": "۳",
  "٤": "۴",
  "٥": "۵",
  "٦": "۶",
  "٧": "۷",
  "٨": "۸",
  "٩": "۹",
};

const LATIN_TO_PERSIAN_DIGITS: Record<string, string> = {
  "0": "۰",
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵",
  "6": "۶",
  "7": "۷",
  "8": "۸",
  "9": "۹",
};

export const isRTL = (value?: string | number | null): boolean => {
  if (value === null || value === undefined) return false;
  return RTL_CHAR_REGEX.test(String(value));
};

const convertDigits = (value: string) =>
  value
    .replace(ARABIC_INDIC_DIGIT_REGEX, (digit) => ARABIC_INDIC_TO_PERSIAN[digit] ?? digit)
    .replace(LATIN_DIGIT_REGEX, (digit) => LATIN_TO_PERSIAN_DIGITS[digit] ?? digit);

export const normalizeBidi = (value?: string | number | null): string => {
  if (value === null || value === undefined) return "";
  const text = convertDigits(String(value));
  if (!text) return "";
  if (!isRTL(text)) return text;
  return `\u2067${text}\u2069`;
};
