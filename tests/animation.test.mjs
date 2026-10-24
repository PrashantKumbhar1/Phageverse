import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const compile = (path) =>
  ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const url = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const simulationUrl = url(compile("../src/simulation.ts"));
const poses = await import(
  url(
    compile("../src/simulation/poses.ts").replace(
      /(["'])\.\.\/simulation\1/g,
      JSON.stringify(simulationUrl),
    ),
  )
);
const geometry = await import(
  url(
    compile("../src/scenes/geometry.ts").replace(
      /(["'])three\1/g,
      JSON.stringify(import.meta.resolve("three")),
    ),
  )
);
const { lifecyclePose, interval } = poses;
test("lifecycle poses are identical after backward and forward seeking", () => {
  const initial = lifecyclePose(64.5, "lytic");
  lifecyclePose(84, "lytic");
  lifecyclePose(0, "lysogenic");
  assert.deepEqual(lifecyclePose(64.5, "lytic"), initial);
});
test("genome delivery completes before replication and assembly", () => {
  assert.equal(lifecyclePose(24, "lytic").injection, 0);
  assert.equal(lifecyclePose(36, "lytic").injection, 1);
  assert.equal(lifecyclePose(48, "lytic").replication, 0);
  assert.equal(lifecyclePose(60, "lytic").replication, 1);
  assert.equal(lifecyclePose(60, "lytic").assembly, 0);
  assert.equal(lifecyclePose(72, "lytic").assembly, 1);
  assert.equal(lifecyclePose(72, "lytic").lysis, 0);
});
test("lysogeny integrates before division and never triggers lysis", () => {
  assert.equal(lifecyclePose(60, "lysogenic").integration, 1);
  assert.equal(lifecyclePose(60, "lysogenic").division, 0);
  assert.equal(lifecyclePose(84, "lysogenic").division, 1);
  for (let t = 0; t <= 84; t += 0.5)
    assert.equal(lifecyclePose(t, "lysogenic").lysis, 0);
});
test("all animated channels stay finite and bounded across timeline", () => {
  for (const path of ["lytic", "lysogenic"])
    for (let t = -1; t <= 85; t += 0.17) {
      const pose = lifecyclePose(t, path);
      for (const [key, value] of Object.entries(pose)) {
        assert.ok(Number.isFinite(value), key);
        assert.ok(value >= 0 && value <= (key === "stage" ? 6 : 1), key);
      }
    }
  assert.equal(interval(-1, 0, 1), 0);
  assert.equal(interval(2, 0, 1), 1);
});
test("tail path and double helix geometry are finite and deterministic", () => {
  for (let i = 0; i <= 100; i++) {
    const p = geometry.tailPoint(i / 100);
    assert.ok(p.toArray().every(Number.isFinite));
  }
  const [a, b] = geometry.helixPoints();
  assert.equal(a.length, 300);
  assert.equal(b.length, 300);
  for (let i = 0; i < a.length; i++) assert.ok(a[i].distanceTo(b[i]) > 0.1);
  assert.ok(
    geometry.chromosomePoint(0).distanceTo(geometry.chromosomePoint(1)) < 1e-12,
  );
  assert.equal(geometry.random(42), geometry.random(42));
});
test("procedural tube and membrane texture contain valid data", () => {
  const tube = geometry.tube(
    [
      geometry.vector(0, 0, 0),
      geometry.vector(0.1, 1, 0),
      geometry.vector(0, 2, 0),
    ],
    0.04,
  );
  assert.ok([...tube.attributes.position.array].every(Number.isFinite));
  assert.ok([...tube.attributes.normal.array].every(Number.isFinite));
  tube.dispose();
  const texture = geometry.membraneTexture();
  assert.equal(texture.image.data.length, 256 * 256 * 4);
  texture.dispose();
});
