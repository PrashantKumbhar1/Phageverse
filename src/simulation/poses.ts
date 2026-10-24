import { stageIndex, type Pathway } from "../simulation";

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
export const interval = (value: number, start: number, end: number) =>
  ease((value - start) / (end - start));
export function lifecyclePose(time: number, path: Pathway) {
  const stage = stageIndex(time);
  const progress = clamp01((time - stage * 12) / 12);
  return {
    stage,
    progress,
    approach: interval(time, 0, 15),
    attachment: interval(time, 12, 22),
    injection: interval(time, 24, 35),
    circularization: interval(time, 29, 36),
    replication: path === "lytic" ? interval(time, 48, 59) : 0,
    assembly: path === "lytic" ? interval(time, 60, 71) : 0,
    lysis: path === "lytic" ? interval(time, 73, 83) : 0,
    integration: path === "lysogenic" ? interval(time, 49, 59) : 0,
    division: path === "lysogenic" ? interval(time, 61, 71) : 0,
  };
}
