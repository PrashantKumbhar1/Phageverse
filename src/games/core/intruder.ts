import type { Route } from "./population";
export type Cargo = "genome" | "tail";
export type IntruderSession = {
  time: number;
  route: Route;
  branch: boolean;
  running: boolean;
  speed: number;
  selected: string;
  observed: string[];
  induced: boolean;
  cargo: Cargo;
  position: [number, number];
  twist: number;
  replication: boolean;
  integrated: boolean;
  assembled: boolean;
  message: string;
};
export const initialIntruder = (route?: Route): IntruderSession => ({
  time: 0,
  route: route ?? "lytic",
  branch: !route,
  running: false,
  speed: 1,
  selected: "Viral DNA",
  observed: [],
  induced: false,
  cargo: "genome",
  position: [0, 0.7],
  twist: 0.7,
  replication: false,
  integrated: false,
  assembled: false,
  message:
    "Drag the violet genome into a pathway destination. The choice compares possible biological outcomes.",
});
export const cellStages = {
  lytic: [
    "Genome circularizes",
    "DNA replication",
    "Protein production",
    "Particle assembly",
    "Envelope breakdown",
    "Progeny release",
  ],
  lysogenic: [
    "Genome circularizes",
    "Integration",
    "Prophage established",
    "Chromosome copying",
    "Cell division",
    "Daughter-cell inheritance",
  ],
};
export const cellStage = (time: number) => Math.min(5, Math.floor(time / 10));
export function timelineLimit(s: IntruderSession) {
  if (s.branch) return 0;
  if (s.route === "lysogenic") return s.integrated ? 60 : 9.9;
  return !s.replication ? 9.9 : !s.assembled ? 39.9 : 60;
}
export function seekIntruder(
  s: IntruderSession,
  time: number,
): IntruderSession {
  return {
    ...s,
    time: Math.max(0, Math.min(timelineLimit(s), time)),
    cargo:
      s.route === "lytic" && time >= 30 && !s.assembled ? "tail" : "genome",
    running: false,
  };
}
export function stepCell(s: IntruderSession, dt: number): IntruderSession {
  if (!s.running || s.branch) return s;
  const time = Math.min(timelineLimit(s), s.time + Math.max(0, dt) * s.speed),
    blocked = time >= timelineLimit(s) && time < 60;
  return {
    ...s,
    time,
    running: time < 60 && !blocked,
    message: blocked
      ? s.route === "lysogenic"
        ? "Bring attP to attB and align the genome. This unlocks integration."
        : !s.replication
          ? "Move the circular viral genome into the replication region."
          : "Components are ready. Guide the separate tail into the packaged head."
      : s.message,
    cargo: s.route === "lytic" && time >= 30 && !s.assembled ? "tail" : s.cargo,
  };
}
export function moveCargo(
  s: IntruderSession,
  x: number,
  z: number,
): IntruderSession {
  return {
    ...s,
    position: [
      Math.max(-2.3, Math.min(2.3, x)),
      Math.max(-0.9, Math.min(1, z)),
    ],
  };
}
export function dropCargo(s: IntruderSession): IntruderSession {
  const [x, z] = s.position,
    near = (tx: number, tz: number, r = 0.48) => Math.hypot(x - tx, z - tz) < r;
  if (s.branch) {
    const route = near(-1.5, -0.4)
      ? "lytic"
      : near(1.5, -0.4)
        ? "lysogenic"
        : null;
    if (!route)
      return {
        ...s,
        message: "Guide the genome into one of the two marked destinations.",
      };
    return {
      ...s,
      route,
      branch: false,
      running: true,
      message:
        route === "lytic"
          ? "Lytic destination entered. Follow circularization, then carry the genome to the replication site."
          : "Lysogenic destination entered. Inspect attB; align the viral attP marker to initiate integration.",
    };
  }
  if (s.route === "lysogenic" && !s.integrated) {
    if (s.time < 8)
      return {
        ...s,
        message:
          "Let the injected genome circularize first. Integration follows circularization.",
      };
    if (!near(0.15, 0.05) || Math.abs(s.twist) > 0.25)
      return {
        ...s,
        message:
          "Match attP with attB: move over the chromosome marker and rotate until the notches align.",
      };
    return {
      ...s,
      integrated: true,
      selected: "Bacterial chromosome",
      observed: Array.from(
        new Set([...s.observed, "Viral DNA", "Bacterial chromosome"]),
      ),
      running: true,
      message:
        "Sites aligned. Initiating schematic site-specific recombination; only viral DNA integrates.",
    };
  }
  if (s.route === "lytic" && !s.replication) {
    if (s.time < 8 || !near(-1.3, 0.65))
      return {
        ...s,
        message:
          "After circularization, bring the genome into the replication region.",
      };
    return {
      ...s,
      replication: true,
      selected: "Viral DNA",
      observed: Array.from(new Set([...s.observed, "Viral DNA"])),
      running: true,
      message:
        "Genome positioned. DNA copies and structural components can now be produced.",
    };
  }
  if (s.route === "lytic" && !s.assembled) {
    if (s.time < 34 || s.cargo !== "tail" || !near(1.1, -0.1))
      return {
        ...s,
        message:
          "Wait for packaged heads, then guide the tail into the amber assembly socket.",
      };
    return {
      ...s,
      assembled: true,
      selected: "Progeny",
      observed: Array.from(new Set([...s.observed, "Progeny"])),
      running: true,
      message:
        "Head and tail joined. Assembly is complete; observe envelope breakdown and release.",
    };
  }
  return s;
}
export function inspectCell(s: IntruderSession, name: string): IntruderSession {
  return {
    ...s,
    selected: name,
    observed: s.observed.includes(name) ? s.observed : [...s.observed, name],
  };
}
export function induceCell(s: IntruderSession): IntruderSession {
  return s.route === "lysogenic" && s.time >= 20
    ? {
        ...s,
        route: "lytic",
        time: 10,
        induced: true,
        replication: true,
        assembled: false,
        cargo: "genome",
        running: true,
        message:
          "Conditional induction: prophage excision is represented before the lytic production sequence.",
      }
    : s;
}
export const cellWon = (s: IntruderSession) =>
  !s.branch &&
  s.time >= 60 &&
  (s.route === "lytic" ? s.replication && s.assembled : s.integrated) &&
  s.observed.length >= 3;
