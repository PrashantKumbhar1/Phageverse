import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(
  fs.readFileSync(new URL("../src/simulation.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const { advance, stageIndex, stages, questions } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
test("seeking uses stable boundaries including the final frame", () => {
  assert.equal(stageIndex(0), 0);
  assert.equal(stageIndex(11.99), 0);
  assert.equal(stageIndex(12), 1);
  assert.equal(stageIndex(36), 3);
  assert.equal(stageIndex(84), 6);
  assert.equal(stageIndex(-1), 0);
});
test("playback speeds and endpoints are deterministic", () => {
  assert.equal(advance(10, 2, 0.5), 11);
  assert.equal(advance(10, 2, 2), 14);
  assert.equal(advance(83, 2, 2), 84);
  assert.equal(advance(0, -1, 1), 0);
});
test("branches share infection stages and diverge in outcomes", () => {
  const a = stages("lytic"),
    b = stages("lysogenic");
  assert.deepEqual(a.slice(0, 4), b.slice(0, 4));
  assert.equal(a[6].name, "Lysis & release");
  assert.equal(b[4].name, "Integration");
  assert.equal(b[6].name, "Stable lysogeny");
  for (const s of [...a, ...b])
    for (const key of ["name", "science", "explorer", "why", "vocab"])
      assert.ok(s[key]?.length > 0);
});
test("every assessment question has a valid answer and explanation", () => {
  for (const q of questions) {
    assert.ok(q.a[q.correct]);
    assert.ok(q.why.length > 20);
  }
});
