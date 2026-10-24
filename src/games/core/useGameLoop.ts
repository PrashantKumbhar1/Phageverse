import { useEffect, useRef } from "react";
export function useGameLoop(step: (dt: number) => void, active = true) {
  const callback = useRef(step);
  callback.current = step;
  useEffect(() => {
    if (!active) return;
    let frame = 0,
      last = 0,
      accumulator = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      accumulator += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (accumulator >= 1 / 30) {
        callback.current(1 / 30);
        accumulator -= 1 / 30;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}
export function rememberWin(key: string) {
  try {
    localStorage.setItem(`phageverse-games-v2-${key}`, "complete");
  } catch {}
}
export function hasWon(key: string) {
  try {
    return localStorage.getItem(`phageverse-games-v2-${key}`) === "complete";
  } catch {
    return false;
  }
}
