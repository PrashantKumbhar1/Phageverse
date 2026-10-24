export type Route = "lytic" | "lysogenic";
export type PopulationSettings = {
  bacteria: number;
  compatible: number;
  phages: number;
  rate: number;
  duration: number;
  route: Route;
};
export type MicroCell = {
  id: number;
  x: number;
  z: number;
  compatible: boolean;
  state: "healthy" | "infected" | "lysogen" | "lysed";
  age: number;
  generation: number;
  rejectedUntil?: number;
};
export type Particle = {
  id: number;
  x: number;
  z: number;
  target: number;
  state: "free" | "bound";
  born: boolean;
};
export type PopulationEvent = {
  id: number;
  time: number;
  cell: number;
  kind:
    | "attachment"
    | "infection"
    | "replication"
    | "assembly"
    | "lysis"
    | "integration"
    | "inheritance"
    | "rejection"
    | "dose";
  message: string;
};
export type Population = {
  events: PopulationEvent[];
  eventSequence: number;
  time: number;
  cells: MicroCell[];
  particles: Particle[];
  nextId: number;
  produced: number;
  lost: number;
  inherited: number;
  failed: number;
  contacts: number;
  history: { time: number; alive: number; phages: number }[];
};
export const scenarios = [
  {
    name: "First Contact",
    goal: "Establish three compatible infections.",
    settings: {
      bacteria: 12,
      compatible: 0.75,
      phages: 5,
      rate: 1,
      duration: 45,
      route: "lytic" as Route,
    },
  },
  {
    name: "The Lytic Wave",
    goal: "Release at least 12 progeny and lyse four hosts.",
    settings: {
      bacteria: 16,
      compatible: 1,
      phages: 4,
      rate: 1,
      duration: 60,
      route: "lytic" as Route,
    },
  },
  {
    name: "The Silent Reservoir",
    goal: "Establish four lysogens and observe four inherited prophages.",
    settings: {
      bacteria: 12,
      compatible: 1,
      phages: 5,
      rate: 1,
      duration: 70,
      route: "lysogenic" as Route,
    },
  },
  {
    name: "Host Diversity",
    goal: "Observe three failed contacts and three successful infections; retain incompatible hosts.",
    settings: {
      bacteria: 18,
      compatible: 0.5,
      phages: 6,
      rate: 1,
      duration: 60,
      route: "lytic" as Route,
    },
  },
];
export function initialPopulation(p: PopulationSettings): Population {
  const cells = Array.from({ length: p.bacteria }, (_, i) => ({
    id: i,
    x: ((i % 6) - 2.5) * 2.7,
    z: (Math.floor(i / 6) - 1) * 3.8,
    compatible: i < Math.round(p.bacteria * p.compatible),
    state: "healthy" as const,
    age: 0,
    generation: 0,
  }));
  return {
    time: 0,
    cells,
    particles: Array.from({ length: p.phages }, (_, i) => ({
      id: p.bacteria + i,
      x: ((i % 5) - 2) * 3,
      z: 8 + i * 0.25,
      target: (i * 7 + 3) % p.bacteria,
      state: "free" as const,
      born: false,
    })),
    nextId: p.bacteria + p.phages,
    produced: 0,
    lost: 0,
    inherited: 0,
    failed: 0,
    contacts: 0,
    history: [],
    events: [],
    eventSequence: 0,
  };
}
export function stepPopulation(
  s: Population,
  p: PopulationSettings,
  dt: number,
): Population {
  if (s.time >= p.duration) return s;
  dt = Math.min(0.1, Math.max(0, dt)) * p.rate;
  dt = Math.min(dt, p.duration - s.time);
  const n: Population = {
    ...s,
    time: s.time + dt,
    cells: s.cells.map((c) => ({ ...c })),
    particles: s.particles.map((v) => ({ ...v })),
    history: [...s.history],
    events: [...s.events],
  };
  const emit = (
    cell: number,
    kind: PopulationEvent["kind"],
    message: string,
  ) => {
    n.events.push({ id: n.eventSequence++, time: n.time, cell, kind, message });
    if (n.events.length > 100) n.events.shift();
  };
  const births: MicroCell[] = [],
    released: Particle[] = [];
  for (const c of n.cells) {
    const previousAge = c.age;
    c.age += dt;
    if (c.state === "infected" && p.route === "lytic") {
      if (previousAge < 2 && c.age >= 2)
        emit(c.id, "replication", "Viral DNA replication initiated");
      if (previousAge < 6 && c.age >= 6)
        emit(c.id, "assembly", "Three progeny assembled inside the host");
    }
    if (c.state === "infected" && c.age >= 8) {
      if (p.route === "lysogenic") {
        c.state = "lysogen";
        emit(c.id, "integration", "Viral DNA integrated: prophage established");
        c.age = 0;
      } else {
        c.state = "lysed";
        c.age = 0;
        n.lost++;
        emit(c.id, "lysis", "Envelope lysed; three progeny released");
        for (let j = 0; j < 3; j++) {
          released.push({
            id: n.nextId++,
            x: c.x + Math.cos(j * 2.094) * 0.4,
            z: c.z + Math.sin(j * 2.094) * 0.4,
            target: (c.id + j + 1) % n.cells.length,
            state: "free",
            born: true,
          });
          n.produced++;
        }
      }
    }
    if (
      c.state === "lysogen" &&
      c.age >= 15 &&
      c.generation < 1 &&
      n.cells.length + births.length < 40
    ) {
      c.age = 0;
      c.generation++;
      births.push({ ...c, id: n.nextId++, x: c.x + 0.8, z: c.z + 1.1, age: 0 });
      c.x -= 0.4;
      n.inherited += 2;
      emit(
        c.id,
        "inheritance",
        "Cell divided; both daughters inherited the prophage",
      );
    }
  }
  for (const v of n.particles) {
    if (v.state === "bound") continue;
    let target = n.cells.find((c) => c.id === v.target);
    if (!target || target.state !== "healthy") {
      const healthy = n.cells.filter((c) => c.state === "healthy");
      target =
        healthy[(v.id + Math.floor(n.time / 4)) % Math.max(1, healthy.length)];
      if (!target) {
        v.x += Math.sin(v.id + n.time * 0.4) * dt * 0.25;
        v.z += Math.cos(v.id + n.time * 0.4) * dt * 0.25;
        continue;
      }
      v.target = target.id;
    }
    const dx = target.x - v.x,
      dz = target.z - v.z,
      d = Math.hypot(dx, dz),
      speed = 1.4;
    if (d < 0.65) {
      if (target.compatible) {
        target.state = "infected";
        target.age = 0;
        v.state = "bound";
        v.x = target.x;
        v.z = target.z + 0.5;
        n.contacts++;
        emit(target.id, "attachment", "Compatible receptor attachment");
        emit(target.id, "infection", "Genome entry established infection");
      } else {
        n.failed++;
        target.rejectedUntil = n.time + 1.3;
        emit(
          target.id,
          "rejection",
          "Attachment failed: receptor incompatible with lambda",
        );
        v.x = target.x + 1.8;
        v.z = target.z + 1.6;
        const healthy = n.cells.filter(
          (c) => c.state === "healthy" && c.id !== target!.id,
        );
        v.target =
          healthy[(v.id + Math.floor(n.time)) % Math.max(1, healthy.length)]
            ?.id ?? target.id;
      }
    } else {
      v.x += (dx / d) * Math.min(d, speed * dt);
      v.z += (dz / d) * Math.min(d, speed * dt);
    }
  }
  n.cells.push(...births);
  n.particles.push(...released);
  if (Math.floor(n.time) > Math.floor(s.time))
    n.history.push({
      time: n.time,
      alive: n.cells.filter((c) => c.state !== "lysed").length,
      phages: n.particles.filter((v) => v.state === "free").length,
    });
  return n;
}
export function counts(s: Population) {
  return {
    healthy: s.cells.filter((c) => c.state === "healthy").length,
    susceptible: s.cells.filter((c) => c.compatible && c.state === "healthy")
      .length,
    incompatible: s.cells.filter((c) => !c.compatible && c.state !== "lysed")
      .length,
    infected: s.cells.filter((c) => c.state === "infected").length,
    lysogens: s.cells.filter((c) => c.state === "lysogen").length,
    free: s.particles.filter((v) => v.state === "free").length,
    produced: s.produced,
    lost: s.lost,
  };
}
export function dosePopulation(
  s: Population,
  x: number,
  z: number,
): Population {
  return {
    ...s,
    nextId: s.nextId + 3,
    eventSequence: s.eventSequence + 1,
    events: [
      ...s.events,
      {
        id: s.eventSequence,
        time: s.time,
        cell:
          s.cells
            .slice()
            .sort(
              (a, b) =>
                Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z),
            )[0]?.id ?? 0,
        kind: "dose" as const,
        message: "Player released three input phages nearby",
      },
    ].slice(-100),
    particles: [
      ...s.particles,
      ...Array.from({ length: 3 }, (_, i) => ({
        id: s.nextId + i,
        x: x + (i - 1) * 0.5,
        z: z + 2,
        target:
          s.cells
            .filter((c) => c.state === "healthy")
            .sort(
              (a, b) =>
                Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z),
            )[i]?.id ?? -1,
        state: "free" as const,
        born: false,
      })),
    ],
  };
}
export function populationWon(s: Population, scenario: number) {
  const c = counts(s);
  return scenario === 0
    ? s.contacts >= 3
    : scenario === 1
      ? s.produced >= 12 && s.lost >= 4
      : scenario === 2
        ? c.lysogens >= 4 && s.inherited >= 4
        : s.failed >= 3 &&
          s.contacts >= 3 &&
          s.cells.some((c) => !c.compatible && c.state === "healthy");
}
