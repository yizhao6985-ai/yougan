import { useLatest, useTimeout, useUpdateEffect } from "ahooks";
import { useMemo, useRef, useState } from "react";

import { segmentGraphemes } from "@/lib/segment-graphemes";
import type { NextStepSuggestion } from "@/lib/types";

const BETWEEN_ITEMS_MS = 15;
const MAX_TYPE_MS_PER_ITEM = 220;
const MIN_MS_PER_GRAPHEME = 2;
const MAX_MS_PER_GRAPHEME = 6;

function msPerGrapheme(graphemeCount: number): number {
  if (graphemeCount < 1) return MIN_MS_PER_GRAPHEME;
  return Math.min(
    MAX_MS_PER_GRAPHEME,
    Math.max(MIN_MS_PER_GRAPHEME, MAX_TYPE_MS_PER_ITEM / graphemeCount),
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type RevealPhase = "typing" | "pause" | "done";

function initialRevealState(animate: boolean, count: number) {
  const shouldAnimate =
    animate && count > 0 && !prefersReducedMotion();
  if (!shouldAnimate) {
    return {
      visibleCount: count,
      currentIndex: -1,
      charIndex: 0,
      phase: "done" as const,
    };
  }
  return {
    visibleCount: 1,
    currentIndex: 0,
    charIndex: 0,
    phase: "typing" as const,
  };
}

export function useOpeningSuggestionsReveal({
  suggestions,
  animate,
  onComplete,
}: {
  suggestions: NextStepSuggestion[];
  animate: boolean;
  onComplete?: () => void;
}) {
  const fingerprint = useMemo(
    () => suggestions.map((s) => s.id).join("\u0000"),
    [suggestions],
  );

  const segmentsByIndex = useMemo(
    () => suggestions.map((s) => segmentGraphemes(s.message)),
    [fingerprint, suggestions],
  );

  const initial = initialRevealState(animate, suggestions.length);
  const [visibleCount, setVisibleCount] = useState(initial.visibleCount);
  const [currentIndex, setCurrentIndex] = useState(initial.currentIndex);
  const [charIndex, setCharIndex] = useState(initial.charIndex);
  const [phase, setPhase] = useState<RevealPhase>(initial.phase);
  const completedRef = useRef(false);
  const hasAnimatedRef = useRef(animate);
  const onCompleteRef = useLatest(onComplete);

  const isDone = phase === "done";
  const currentSegments = segmentsByIndex[currentIndex] ?? [];

  useUpdateEffect(() => {
    completedRef.current = false;
    if (!animate || suggestions.length === 0 || prefersReducedMotion()) {
      hasAnimatedRef.current = false;
      setVisibleCount(suggestions.length);
      setCurrentIndex(-1);
      setCharIndex(0);
      setPhase("done");
      return;
    }

    hasAnimatedRef.current = true;
    setVisibleCount(1);
    setCurrentIndex(0);
    setCharIndex(0);
    setPhase("typing");
  }, [animate, fingerprint, suggestions.length]);

  useUpdateEffect(() => {
    if (phase !== "done" || !hasAnimatedRef.current || completedRef.current) {
      return;
    }
    completedRef.current = true;
    onCompleteRef.current?.();
  }, [phase]);

  useTimeout(
    () => {
      if (charIndex >= currentSegments.length) {
        if (currentIndex >= suggestions.length - 1) {
          setPhase("done");
          setCurrentIndex(-1);
          return;
        }
        setPhase("pause");
        return;
      }
      setCharIndex((prev) => prev + 1);
    },
    phase === "typing" && currentIndex >= 0
      ? msPerGrapheme(currentSegments.length)
      : undefined,
  );

  useTimeout(
    () => {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCharIndex(0);
      setVisibleCount(nextIndex + 1);
      setPhase("typing");
    },
    phase === "pause" ? BETWEEN_ITEMS_MS : undefined,
  );

  const getDisplayText = (index: number): string => {
    const segments = segmentsByIndex[index] ?? [];
    if (!animate || phase === "done") {
      return suggestions[index]?.message ?? "";
    }
    if (index < currentIndex) {
      return suggestions[index]?.message ?? "";
    }
    if (index === currentIndex && currentIndex >= 0) {
      return segments.slice(0, charIndex).join("");
    }
    return "";
  };

  const isTypingIndex = (index: number) =>
    animate && phase === "typing" && index === currentIndex;

  const showCaret = (index: number) =>
    isTypingIndex(index) &&
    charIndex < (segmentsByIndex[index]?.length ?? 0);

  return {
    visibleCount: animate && phase !== "done" ? visibleCount : suggestions.length,
    isDone,
    getDisplayText,
    showCaret,
  };
}
