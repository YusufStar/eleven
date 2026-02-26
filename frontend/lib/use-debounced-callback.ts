"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * Returns a callback that invokes fn after delay ms; cancels previous pending call on re-invoke.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  const fnRef = useRef(fn);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  fnRef.current = fn;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      lastArgsRef.current = args;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        fnRef.current(...(lastArgsRef.current ?? []));
      }, delay);
    }) as T,
    [delay]
  );
}
