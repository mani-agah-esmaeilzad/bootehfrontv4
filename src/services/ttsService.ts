// src/services/ttsService.ts

import { API_BASE_URL } from "./apiService";

const TTS_ENDPOINT = `${API_BASE_URL}/assessment/tts`;

export const requestAssessmentSpeech = async (text: string, personaName?: string) => {
  const normalized = text?.trim();
  if (!normalized) {
    throw new Error("متن معتبری برای تبدیل صدا ارسال نشده است.");
  }

  const token = localStorage.getItem("authToken");
  const response = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text: normalized, personaName }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => null);
    throw new Error(errorText || "خطا در برقراری ارتباط با سرویس تولید صدا");
  }

  return response.blob();
};
