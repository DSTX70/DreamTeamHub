import { useEffect, useRef } from "react";

type ChordMapping = {
  [firstKey: string]: {
    [secondKey: string]: () => void;
  };
};

export function useHotkeys(chords: ChordMapping, windowMs = 1200) {
  const firstKeyRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // If we already have a first key, check for second key
      if (firstKeyRef.current) {
        const secondKeyMap = chords[firstKeyRef.current];
        if (secondKeyMap && secondKeyMap[key]) {
          e.preventDefault();
          secondKeyMap[key]();
          // Clear the first key
          firstKeyRef.current = null;
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        } else {
          // Invalid second key, reset
          firstKeyRef.current = null;
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
        return;
      }

      // Check if this is a valid first key
      if (chords[key]) {
        e.preventDefault();
        firstKeyRef.current = key;
        
        // Set timeout to clear first key if second key isn't pressed
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          firstKeyRef.current = null;
          timerRef.current = null;
        }, windowMs);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [chords, windowMs]);
}
