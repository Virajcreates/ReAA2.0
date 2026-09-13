'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-IN',
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep callback refs updated to avoid re-triggering startListening
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  // Dynamically update active recognition language if user switches language
  useEffect(() => {
    if (recognitionRef.current && lang) {
      try {
        recognitionRef.current.lang = lang;
      } catch (err) {
        console.warn('Failed to update recognition lang dynamically:', err);
      }
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Speech recognition stop warning:', err);
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = 'Speech recognition is not supported in this browser.';
      setError(msg);
      onErrorRef.current?.(msg);
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognitionRef.current = recognition;

      setError(null);
      setTranscript('');

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        let hasFinal = false;

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          currentTranscript += item[0].transcript;
          if (item.isFinal) {
            hasFinal = true;
          }
        }

        setTranscript(currentTranscript);
        onResultRef.current?.(currentTranscript, hasFinal);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        let errorMsg = `Speech recognition error: ${event.error}`;
        if (event.error === 'not-allowed') {
          errorMsg = 'Microphone permission denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech detected. Please speak into your microphone.';
        }
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      const errMsg = err.message || 'Failed to start voice recognition.';
      setError(errMsg);
      onErrorRef.current?.(errMsg);
      setIsListening(false);
    }
  }, [continuous, interimResults, lang]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript: () => setTranscript(''),
  };
}
