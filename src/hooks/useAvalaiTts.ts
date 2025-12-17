// src/hooks/useAvalaiTts.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestAssessmentSpeech } from "@/services/ttsService";
import { toast } from "sonner";

const MAX_CACHE_ITEMS = 12;

const buildCacheKey = (text: string, personaName?: string) =>
  `${personaName ?? "default"}::${text}`;

export const useAvalaiTts = () => {
  const cacheRef = useRef<Map<string, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const getCachedUrl = useCallback((key: string) => cacheRef.current.get(key) ?? null, []);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  const prefetchSpeech = useCallback(
    async (text: string, personaName?: string) => {
      const normalized = text?.trim();
      if (!normalized) return "";
      const cacheKey = buildCacheKey(normalized, personaName);
      const cached = getCachedUrl(cacheKey);
      if (cached) return cached;
      const blob = await requestAssessmentSpeech(normalized, personaName);
      const url = URL.createObjectURL(blob);
      rememberUrl(cacheKey, url);
      return url;
    },
    [getCachedUrl, rememberUrl]
  );

  const playClipFromUrl = useCallback(
    async (url: string) => {
      if (!url) return;
      const audio = ensureAudio();
      audio.src = url;
      audio.currentTime = 0;
      setIsSpeaking(true);
      try {
        await audio.play();
      } catch (error: any) {
        setIsSpeaking(false);
        throw error;
      }
    },
    [ensureAudio]
  );

  const speakWithPrefetch = useCallback(
    async (text: string, personaName?: string) => {
      const clipUrl = await prefetchSpeech(text, personaName);
      if (!clipUrl) return;
      await playClipFromUrl(clipUrl);
    },
    [playClipFromUrl, prefetchSpeech]
  );

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    const audio = ensureAudio();
    const handleComplete = () => {
      setIsSpeaking(false);
    };
    const handleError = (event: Event) => {
      console.error("AvalAI audio playback error", event);
      toast.error("پخش صدای دستیار با خطا مواجه شد.");
      setIsSpeaking(false);
    };
    audio.addEventListener("ended", handleComplete);
    audio.addEventListener("error", handleError);
    return () => {
      audio.removeEventListener("ended", handleComplete);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    };
  }, [ensureAudio]);

  return {
    prefetchSpeech,
    playClipFromUrl,
    speakWithPrefetch,
    stopAll,
    isSpeaking,
  };
};
