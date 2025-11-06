// src/hooks/useSpeechRecognition.ts

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onFinalResult?: (transcript: string) => void;
  onPartialResult?: (transcript: string) => void;
  onError?: (event: any) => void;
  onUnsupported?: () => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isRecording: boolean;
  start: () => boolean;
  stop: () => void;
  toggle: () => void;
  restart: () => void;
}

export const useSpeechRecognition = (
  {
    lang = "fa-IR",
    continuous = true,
    interimResults = true,
    onFinalResult,
    onPartialResult,
    onError,
    onUnsupported,
  }: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
  const recognitionRef = useRef<any | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const finalHandlerRef = useRef(onFinalResult);
  const partialHandlerRef = useRef(onPartialResult);
  const errorHandlerRef = useRef(onError);

  useEffect(() => {
    finalHandlerRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    partialHandlerRef.current = onPartialResult;
  }, [onPartialResult]);

  useEffect(() => {
    errorHandlerRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      onUnsupported?.();
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (!transcript) continue;
        if (event.results[i].isFinal) {
          finalHandlerRef.current?.(transcript);
        } else {
          partialHandlerRef.current?.(transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      errorHandlerRef.current?.(event);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      try {
        recognition.stop();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
      setIsRecording(false);
    };
  }, [continuous, interimResults, lang, onUnsupported]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return false;
    try {
      recognition.start();
      return true;
    } catch (error: any) {
      // start throws if already running; try soft restart
      try {
        recognition.stop();
      } catch {
        // ignore secondary errors
      }
      setTimeout(() => {
        try {
          recognition.start();
        } catch {
          // ignore if restart fails
        }
      }, 120);
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  }, []);

  const restart = useCallback(() => {
    stop();
    setTimeout(() => {
      start();
    }, 160);
  }, [start, stop]);

  const toggle = useCallback(() => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  }, [isRecording, start, stop]);

  return {
    isSupported,
    isRecording,
    start,
    stop,
    toggle,
    restart,
  };
};
