// src/hooks/useAvalaiTts.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestAssessmentSpeech } from "@/services/ttsService";
import { toast } from "sonner";

type TtsJob = {
  id: string;
  text: string;
  personaName?: string;
};

const MAX_CACHE_ITEMS = 12;

export const useAvalaiTts = () => {
  const queueRef = useRef<TtsJob[]>([]);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const rememberUrl = useCallback((key: string, url: string) => {
    cacheRef.current.set(key, url);
    if (cacheRef.current.size > MAX_CACHE_ITEMS) {
      const oldestKey = cacheRef.current.keys().next().value;
      if (oldestKey) {
        const oldUrl = cacheRef.current.get(oldestKey);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        cacheRef.current.delete(oldestKey);
      }
    }
  }, []);

  const getFromCache = useCallback((key: string) => cacheRef.current.get(key) ?? null, []);

  const fetchClipUrl = useCallback(
    async (job: TtsJob) => {
      const cacheKey = `${job.personaName ?? "default"}::${job.text}`;
      const cachedUrl = getFromCache(cacheKey);
      if (cachedUrl) return cachedUrl;
      const blob = await requestAssessmentSpeech(job.text, job.personaName);
      const url = URL.createObjectURL(blob);
      rememberUrl(cacheKey, url);
      return url;
    },
    [getFromCache, rememberUrl]
  );

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  const scheduleNext = useCallback(async () => {
    if (isProcessingRef.current) return;
    const nextJob = queueRef.current.shift();
    if (!nextJob) {
      setIsSpeaking(false);
      return;
    }

    isProcessingRef.current = true;
    setIsSpeaking(true);

    try {
      const clipUrl = await fetchClipUrl(nextJob);
      const audio = ensureAudio();
      audio.src = clipUrl;
      audio.currentTime = 0;
      await audio.play();
    } catch (error: any) {
      console.error("AvalAI TTS error:", error);
      toast.error(error?.message || "خطا در تولید صدای متن");
      isProcessingRef.current = false;
      setIsSpeaking(false);
      scheduleNext();
    }
  }, [ensureAudio, fetchClipUrl]);

  const enqueueSpeech = useCallback(
    (text: string, personaName?: string) => {
      const normalized = text?.trim();
      if (!normalized) return;
      queueRef.current.push({
        id: `${Date.now()}-${Math.random()}`,
        text: normalized,
        personaName,
      });
      scheduleNext();
    },
    [scheduleNext]
  );

  const stopAll = useCallback(() => {
    queueRef.current = [];
    isProcessingRef.current = false;
    setIsSpeaking(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
  }, []);

  useEffect(() => {
    const audio = ensureAudio();
    const handleComplete = () => {
      isProcessingRef.current = false;
      if (queueRef.current.length === 0) {
        setIsSpeaking(false);
      }
      scheduleNext();
    };
    audio.addEventListener("ended", handleComplete);
    audio.addEventListener("error", handleComplete);
    return () => {
      audio.removeEventListener("ended", handleComplete);
      audio.removeEventListener("error", handleComplete);
      audio.pause();
      audio.src = "";
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
      queueRef.current = [];
      isProcessingRef.current = false;
    };
  }, [ensureAudio, scheduleNext]);

  return {
    enqueueSpeech,
    stopAll,
    isSpeaking,
  };
};
