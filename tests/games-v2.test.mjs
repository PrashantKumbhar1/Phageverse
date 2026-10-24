import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const load = async (name) => {
  const code = ts.transpileModule(
    fs.readFileSync("src/games/core/" + name + ".ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  return import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
};
const h = await load("contact"),
  c = await load("intruder"),
  p = await load("population");
const idle = { forward: 0, strafe: 0, turn: 0, interact: false };
const hold = (s, n = 30, input = { ...idle, interact: true }) => {
  for (let i = 0; i < n; i++) s = h.contactStep(s, input, 0.1);
  return s;
};
test("CONTACT movement, orientation and bounds remain player controlled", () => {
  const s = h.contactInitial();
  assert.ok(h.contactStep(s, { ...idle, forward: 1 }, 0.1).z < s.z);
  assert.notEqual(h.contactStep(s, { ...idle, turn: 1 }, 0.1).yaw, 0);
  assert.equal(
    h.contactStep({ ...s, x: 10 }, { ...idle, strafe: 1 }, 0.1).x,
    10,
  );
  assert.equal(
    h.contactStep({ ...s, elapsed: 1000 }, idle, 0.1).phase,
    "seeking",
  );
});
test("CONTACT incompatible binding and misalignment fail consistently", () => {
  let s = hold({ ...h.contactInitial(1), x: -4, z: -0.8 });
  assert.equal(s.stability, 0);
  assert.equal(s.phase, "seeking");
  assert.ok(s.inspected.includes(0));
  s = hold({ ...h.contactInitial(1), x: 0, z: -4.8, yaw: 1 });
  assert.equal(s.phase, "seeking");
  assert.equal(s.stability, 0);
});
test("CONTACT a single click cannot establish attachment; sustained contact can", () => {
  let s = { ...h.contactInitial(1), x: 0, z: -4.8 };
  s = h.contactStep(s, { ...idle, interact: true }, 0.1);
  assert.equal(s.phase, "seeking");
  assert.ok(s.stability > 0 && s.stability < 1);
  s = hold(s);
  assert.equal(s.phase, "won");
  assert.equal(s.stability, 1);
});
test("CONTACT all missions complete, injection prerequisites and strain recovery work", () => {
  assert.equal(hold({ ...h.contactInitial(), x: 0, z: -2.8 }, 15).phase, "won");
  let s = hold({ ...h.contactInitial(2), x: 4, z: -4.8 });
  assert.equal(s.phase, "attached");
  assert.equal(h.contactStep(s, idle, 0.1).genome, s.genome);
  const strained = hold(s, 9, { ...idle, forward: 1 });
  assert.equal(strained.phase, "seeking");
  assert.equal(strained.genome, 0);
  s = hold(s, 60);
  assert.equal(s.phase, "won");
  assert.equal(s.genome, 1);
  assert.deepEqual(h.contactInitial(), h.contactInitial());
});
test("INTRUDER route entry is spatial and cannot be bypassed by seeking", () => {
  let s = c.initialIntruder();
  assert.equal(c.seekIntruder(s, 60).time, 0);
  assert.equal(c.dropCargo(s).branch, true);
  s = c.dropCargo(c.moveCargo(s, -1.5, -0.4));
  assert.equal(s.branch, false);
  assert.equal(s.route, "lytic");
  assert.equal(s.running, true);
  assert.equal(c.seekIntruder(s, 60).time, 9.9);
});
test("INTRUDER lytic production requires replication placement and tail assembly", () => {
  let s = { ...c.initialIntruder("lytic"), time: 9.9 };
  assert.equal(c.dropCargo(s).replication, false);
  s = c.dropCargo(c.moveCargo(s, -1.3, 0.65));
  assert.equal(s.replication, true);
  s = c.stepCell({ ...s, running: true }, 40);
  assert.equal(s.time, 39.9);
  assert.equal(s.cargo, "tail");
  assert.equal(c.dropCargo(s).assembled, false);
  s = c.dropCargo(c.moveCargo(s, 1.1, -0.1));
  assert.equal(s.assembled, true);
  s = c.stepCell(s, 25);
  s = c.inspectCell(s, "Bacterial chromosome");
  assert.equal(c.cellWon(s), true);
});
test("INTRUDER integration requires matching att sites and orientation", () => {
  let s = { ...c.initialIntruder("lysogenic"), time: 9.9 };
  s = c.moveCargo(s, 0.15, 0.05);
  assert.equal(c.dropCargo(s).integrated, false);
  s = c.dropCargo({ ...s, twist: 0 });
  assert.equal(s.integrated, true);
  s = c.stepCell(s, 60);
  assert.equal(s.route, "lysogenic");
  assert.equal(c.cellWon(s), false);
  s = c.inspectCell(s, "Daughter cell");
  assert.equal(c.cellWon(s), true);
  assert.equal(c.induceCell(s).route, "lytic");
});
test("INTRUDER pause, speed and reset keep a consistent timeline", () => {
  let s = c.initialIntruder("lytic");
  assert.equal(c.stepCell(s, 2).time, 0);
  s = c.stepCell({ ...s, running: true, speed: 2 }, 2);
  assert.equal(s.time, 4);
  assert.equal(c.seekIntruder(s, 2).running, false);
  assert.deepEqual(c.initialIntruder(), c.initialIntruder());
});
const run = (settings) => {
  let s = p.initialPopulation(settings);
  while (s.time < settings.duration) s = p.stepPopulation(s, settings, 1 / 30);
  return s;
};
test("all four default population scenarios have achievable goals", () => {
  for (let i = 0; i < 4; i++) {
    const s = run(p.scenarios[i].settings);
    assert.equal(
      p.populationWon(s, i),
      true,
      `${p.scenarios[i].name}: ${JSON.stringify({ ...p.counts(s), contacts: s.contacts, failed: s.failed, inherited: s.inherited })}`,
    );
  }
});
test("population replay is deterministic and counts reflect actual entities", () => {
  const settings = p.scenarios[1].settings,
    a = run(settings),
    b = run(settings);
  assert.deepEqual(a, b);
  const n = p.counts(a);
  assert.equal(n.healthy + n.infected + n.lysogens + n.lost, a.cells.length);
  assert.equal(n.produced, a.particles.filter((v) => v.born).length);
  assert.equal(n.free, a.particles.filter((v) => v.state === "free").length);
  assert.equal(n.lost, a.cells.filter((v) => v.state === "lysed").length);
});
test("incompatible cells survive; lysogens inherit without lysis", () => {
  const mixed = run(p.scenarios[3].settings);
  assert.ok(
    mixed.cells
      .filter((c) => !c.compatible)
      .every((c) => c.state === "healthy"),
  );
  const lys = run(p.scenarios[2].settings);
  assert.equal(lys.lost, 0);
  assert.equal(lys.produced, 0);
  assert.ok(lys.inherited >= 4);
  assert.ok(lys.cells.some((c) => c.generation === 1 && c.state === "lysogen"));
});
test("player inoculum adds rendered input particles without inventing progeny", () => {
  const s = p.initialPopulation(p.scenarios[0].settings),
    n = p.dosePopulation(s, 1, 2);
  assert.equal(n.particles.length, s.particles.length + 3);
  assert.equal(n.produced, 0);
  assert.equal(new Set(n.particles.map((v) => v.id)).size, n.particles.length);
});

test("AFTERMATH event history corresponds to actual biological state transitions", () => {
  const l = run(p.scenarios[1].settings);
  assert.equal(l.events.filter((e) => e.kind === "lysis").length, l.lost);
  assert.equal(
    l.events.filter((e) => e.kind === "infection").length,
    l.contacts,
  );
  assert.ok(l.events.some((e) => e.kind === "replication"));
  assert.ok(l.events.some((e) => e.kind === "assembly"));
  const lys = run(p.scenarios[2].settings);
  assert.equal(
    lys.events.filter((e) => e.kind === "inheritance").length * 2,
    lys.inherited,
  );
  assert.equal(
    lys.events.some((e) => e.kind === "lysis"),
    false,
  );
  assert.equal(new Set(lys.events.map((e) => e.id)).size, lys.events.length);
  assert.ok(lys.events.every((e) => lys.cells.some((c) => c.id === e.cell)));
});

test("INTRUDER seeking switches the manipulated molecule to match the stage", () => {
  const s = { ...c.initialIntruder("lytic"), replication: true };
  assert.equal(c.seekIntruder(s, 35).cargo, "tail");
  assert.equal(c.seekIntruder({ ...s, cargo: "tail" }, 5).cargo, "genome");
});

const { TouchControls } = await load("../shared/TouchControls");
test("mobile multi-touch keeps movement and interaction independent", () => {
  const input = new TouchControls();
  input.press(1, "forward", 1);
  let value = input.press(2, "interact", true);
  assert.equal(value.forward, 1);
  assert.equal(value.interact, true);
  value = input.release(2);
  assert.equal(value.forward, 1);
  assert.equal(value.interact, false);
  value = input.release(1);
  assert.equal(value.forward, 0);
});
test("mobile cancellation, opposing controls and repeated release leave no stuck input", () => {
  const input = new TouchControls();
  input.press(1, "turn", 1);
  assert.equal(input.press(2, "turn", -1).turn, 0);
  assert.equal(input.release(1).turn, -1);
  assert.equal(input.release(1).turn, -1);
  assert.deepEqual(input.clear(), {
    forward: 0,
    strafe: 0,
    turn: 0,
    interact: false,
  });
  assert.equal(input.release(2).turn, 0);
});
