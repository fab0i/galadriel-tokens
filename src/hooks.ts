import { useEffect, useRef } from "react";

const LONG_PRESS_MS = 450;

export function useLongPress(onPress: () => void, onLongPress: () => void) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);

  const cancel = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  return {
    onPointerDown: () => {
      fired.current = false;
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerUp: () => {
      if (timer.current !== undefined && !fired.current) onPress();
      cancel();
    },
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

export const wakeLockSupported =
  typeof navigator !== "undefined" && "wakeLock" in navigator;

export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !wakeLockSupported) return;
    let sentinel: WakeLockSentinel | undefined;
    let disposed = false;

    // The browser drops the lock whenever the page is hidden, so re-acquire on return.
    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (disposed) await sentinel.release();
      } catch {
        // Refused (e.g. battery saver); the screen just sleeps normally.
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release();
    };
  }, [enabled]);
}
