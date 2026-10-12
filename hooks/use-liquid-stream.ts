'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Custom React hook that implements an Adaptive Liquid Token Stream buffer.
 * It decouples rapid, uneven server stream ingestion from UI ticking by buffering
 * incoming text into a mutable ref and using an adaptive requestAnimationFrame
 * easing/lerp engine to smoothly type out characters at display refresh rate.
 *
 * Easing behavior:
 * - Small delta (< 10 chars): Natural typewriter cadence at steady 1-2 chars/frame.
 * - Medium delta (10-30 chars): Smooth transitional easing (Math.max(2, Math.ceil(delta * 0.12))).
 * - Large delta (> 30 chars during bursts): Proportional catch-up scaling (Math.max(2, Math.ceil(delta * 0.18))).
 * - Stream finish: Continues running the RAF ticker until the remaining buffer is completely drained.
 *
 * @param serverText - The raw accumulated text arriving from the server stream
 * @param isStreaming - Boolean indicating whether the message is actively generating
 * @returns The liquid smoothed text string to render in the UI
 */
export function useLiquidStream(serverText: string, isStreaming: boolean): string {
  const [displayedText, setDisplayedText] = useState<string>(() => serverText);

  // Mutable refs decoupling stream ingestion from UI rendering
  const targetTextRef = useRef<string>(serverText);
  const displayedLengthRef = useRef<number>(serverText.length);
  const rafIdRef = useRef<number | null>(null);
  const isStreamingRef = useRef<boolean>(isStreaming);

  // Keep streaming status ref in sync
  isStreamingRef.current = isStreaming;

  // Ingestion: Synchronize targetTextRef without triggering re-renders
  if (serverText.length > targetTextRef.current.length) {
    targetTextRef.current = serverText;
  }

  // Throttle timestamp ref to commit React state updates at ~30fps (~30ms)
  const lastRenderTimeRef = useRef<number>(0);
  const THROTTLE_MS = 30; // ~33fps typing cadence to prevent markdown AST re-parse flicker

  // Handle stream resets (e.g. query retry / regeneration / new chat session)
  if (serverText.length < displayedLengthRef.current) {
    targetTextRef.current = serverText;
    displayedLengthRef.current = serverText.length;
    lastRenderTimeRef.current = 0;
    setDisplayedText(serverText);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }

  useEffect(() => {
    // Synchronize latest target text
    if (serverText.length >= targetTextRef.current.length) {
      targetTextRef.current = serverText;
    }

    // Adaptive RAF ticker function with 30fps timestamp throttling
    const tick = () => {
      const currentLen = displayedLengthRef.current;
      const targetLen = targetTextRef.current.length;
      const delta = targetLen - currentLen;

      if (delta > 0) {
        const now = performance.now();
        // Only commit React state update if at least THROTTLE_MS has elapsed
        if (now - lastRenderTimeRef.current >= THROTTLE_MS) {
          lastRenderTimeRef.current = now;

          // Dynamic step size using smooth catch-up easing
          // At ~30fps (~33ms/tick), 2-4 chars per tick yields a crisp, natural 60-120 chars/sec typing speed
          let step: number;
          if (delta < 12) {
            step = delta <= 2 ? delta : (delta <= 6 ? 2 : 3);
          } else if (delta <= 35) {
            step = Math.max(3, Math.ceil(delta * 0.16));
          } else {
            step = Math.max(4, Math.ceil(delta * 0.24));
          }

          const nextLen = Math.min(targetLen, currentLen + step);
          displayedLengthRef.current = nextLen;
          setDisplayedText(targetTextRef.current.slice(0, nextLen));
        }

        // Continue ticking to drain buffer
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        // Buffer completely drained
        rafIdRef.current = null;
        if (!isStreamingRef.current) {
          displayedLengthRef.current = targetTextRef.current.length;
          setDisplayedText(targetTextRef.current);
        }
      }
    };

    // Ensure only one RAF loop is running at any time
    const needsTicking = displayedLengthRef.current < targetTextRef.current.length;
    if (needsTicking && rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(tick);
    }

    return () => {
      // Clean up RAF loop on unmount or reset
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [serverText, isStreaming]);

  // If streaming or actively draining remaining buffer, return displayedText; otherwise return final text
  const isDraining = displayedLengthRef.current < targetTextRef.current.length;
  return isStreaming || isDraining ? displayedText : (serverText || targetTextRef.current);
}
