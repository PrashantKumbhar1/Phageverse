export type ContactInput = {
  forward: number;
  strafe: number;
  turn: number;
  interact: boolean;
};
export type Host = { id: number; x: number; z: number; compatible: boolean };
export type ContactState = {
  mission: number;
  x: number;
  z: number;
  yaw: number;
  elapsed: number;
  phase: "seeking" | "attached" | "won" | "lost";
  genome: number;
  stability: number;
  strain: number;
  mistakes: number;
  inspected: number[];
  message: string;
  host: number | null;
};
export const contactHosts = (mission: number): Host[] => [
  { id: 0, x: -4, z: -3, compatible: false },
  {
    id: 1,
    x: mission === 2 ? 4 : 0,
    z: mission === 0 ? -5 : -7,
    compatible: true,
  },
  { id: 2, x: 5, z: -2, compatible: mission === 0 },
  { id: 3, x: -5, z: -9, compatible: false },
];
export const contactInitial = (mission = 0): ContactState => ({
  mission,
  x: mission === 2 ? 4 : 0,
  z: mission === 0 ? 6 : mission === 1 ? 0 : -2,
  yaw: 0,
  elapsed: 0,
  phase: "seeking",
  genome: 0,
  stability: 0,
  strain: 0,
  mistakes: 0,
  inspected: [],
  message:
    mission === 0
      ? "Investigate a receptor. Three matching lobes form the lambda binding site."
      : "Bring the tail into the docking ring. Hold steady to establish three points of contact.",
  host: null,
});
export const wrapAngle = (n: number) => Math.atan2(Math.sin(n), Math.cos(n));
export function contactStep(
  s: ContactState,
  input: ContactInput,
  dt: number,
): ContactState {
  if (s.phase === "won" || s.phase === "lost") return s;
  dt = Math.max(0, Math.min(0.1, dt));
  const n = { ...s, elapsed: s.elapsed + dt };
  if (s.phase === "attached") {
    n.strain = Math.max(
      0,
      s.strain +
        (Math.abs(input.forward) +
          Math.abs(input.strafe) +
          Math.abs(input.turn) >
        0.3
          ? dt
          : -dt * 0.8),
    );
    if (n.strain > 0.7)
      return {
        ...n,
        phase: "seeking",
        stability: 0,
        strain: 0,
        genome: 0,
        z: s.z + 1.15,
        message:
          "Attachment lost under strain. Ease back toward the receptor and steady the tail. Transfer is reset for this attempt.",
      };
    if (input.interact) {
      n.genome = Math.min(1, s.genome + dt / 5);
      n.message =
        "DNA is passing through the tail. The capsid remains outside.";
      if (n.genome >= 1) {
        n.phase = "won";
        n.message =
          "Transfer complete. Viral DNA is inside; the protein shell remains outside.";
      }
    }
    return n;
  }
  n.yaw = wrapAngle(s.yaw + input.turn * dt * 1.6);
  const norm = Math.max(1, Math.hypot(input.forward, input.strafe));
  n.x = Math.max(
    -10,
    Math.min(
      10,
      s.x +
        ((-Math.sin(n.yaw) * input.forward + Math.cos(n.yaw) * input.strafe) *
          2.6 *
          dt) /
          norm,
    ),
  );
  n.z = Math.max(
    -12,
    Math.min(
      10,
      s.z +
        ((-Math.cos(n.yaw) * input.forward - Math.sin(n.yaw) * input.strafe) *
          2.6 *
          dt) /
          norm,
    ),
  );
  const hosts = contactHosts(s.mission);
  for (const h of hosts)
    if (((n.x - h.x) / 2.2) ** 2 + ((n.z - h.z) / 1.45) ** 2 < 1) {
      n.x = s.x;
      n.z = s.z;
      n.message =
        "Surface contact. Use the receptor ring on the front of the cell.";
    }
  const host = hosts.reduce((a, b) =>
      Math.hypot(b.x - n.x, b.z + 2.2 - n.z) <
      Math.hypot(a.x - n.x, a.z + 2.2 - n.z)
        ? b
        : a,
    ),
    distance = Math.hypot(host.x - n.x, host.z + 2.2 - n.z),
    angle = Math.abs(wrapAngle(n.yaw));
  const steady =
    Math.hypot(input.forward, input.strafe) < 0.15 &&
    Math.abs(input.turn) < 0.15;
  if (!input.interact) {
    n.stability = Math.max(0, s.stability - dt * 0.3);
    return n;
  }
  if (distance > (s.mission === 0 ? 2.1 : 0.8)) {
    n.stability = Math.max(0, s.stability - dt * 0.6);
    n.message = "Move closer: the tail must reach the receptor ring.";
    return n;
  }
  n.host = host.id;
  if (!n.inspected.includes(host.id)) n.inspected = [...n.inspected, host.id];
  if (!host.compatible) {
    n.stability = 0;
    n.mistakes += dt;
    n.message =
      "The tip cannot bind this receptor geometry. Try another cell; compatibility is specific to lambda.";
    return n;
  }
  if (s.mission === 0) {
    n.stability = Math.min(1, s.stability + dt / 1.2);
    n.message =
      "Three-lobed LamB geometry identified. Hold to finish your surface inspection.";
    if (n.stability >= 1) {
      n.phase = "won";
      n.message =
        "LamB recognized. Its matching receptor geometry supports lambda attachment.";
    }
    return n;
  }
  if (angle > 0.28 || !steady) {
    n.stability = Math.max(0, s.stability - dt * 0.7);
    n.message =
      angle > 0.28
        ? "Rotate the tail into the receptor normal."
        : "Slow down and hold position. Stable contact needs all three binding regions.";
    return n;
  }
  n.stability = Math.min(1, s.stability + dt / 2.4);
  n.message =
    "Contact stabilizing. Keep the tail aligned and hold the interaction control.";
  if (n.stability >= 1) {
    n.x = host.x;
    n.z = host.z + 1.1;
    n.phase = s.mission === 1 ? "won" : "attached";
    n.message =
      s.mission === 1
        ? "Three contact regions engaged. Attachment established."
        : "Attachment established. Release, then hold Deliver to initiate genome transfer.";
  }
  return n;
}
