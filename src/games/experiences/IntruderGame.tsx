import MolecularInteraction from "../render/MolecularInteraction";
import { useLearning } from "../shared/LearningMode";
import GenomeThread from "../render/GenomeThread";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Cell, Dna, Phage } from "../../scenes/Biology";
import { GameStage, Medium } from "../render/GameStage";
import {
  cellStages,
  cellStage,
  initialIntruder,
  stepCell,
  inspectCell,
  induceCell,
  cellWon,
  moveCargo,
  dropCargo,
  seekIntruder,
  timelineLimit,
  type IntruderSession,
} from "../core/intruder";
import { useGameLoop, rememberWin } from "../core/useGameLoop";
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const explanations = {
  lytic: [
    "The injected genome circularizes inside the cytoplasm. Only DNA enters.",
    "Viral DNA is copied using resources inside the host.",
    "Host machinery produces viral proteins. The parts do not yet form infectious particles.",
    "Heads package genomes and join tails. Follow a developing particle.",
    "Holin, endolysin, and spanin activities disrupt different envelope layers.",
    "The host lyses; progeny leave and can encounter other compatible cells.",
  ],
  lysogenic: [
    "The same injected genome can enter a different developmental program.",
    "Viral DNA joins the host chromosome. The protein capsid does not integrate.",
    "The integrated viral DNA is a prophage. Lytic genes are repressed.",
    "The host chromosome is copied, including its prophage segment.",
    "The host divides while maintaining the prophage. This is not lysis.",
    "Daughter cells inherit prophages. Ordinary lysogeny can persist without bursting.",
  ],
};
function CellWorld({
  onMove,
  onDrop,
  session: s,
  onInspect,
  orbit,
}: {
  onMove: (x: number, z: number) => void;
  onDrop: () => void;
  session: IntruderSession;
  onInspect: (name: string) => void;
  orbit: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const stage = cellStage(s.time),
    lytic = s.route === "lytic",
    integration = lytic ? 0 : clamp((s.time - 10) / 10),
    division = lytic ? 0 : clamp((s.time - 40) / 15),
    lysis = lytic ? clamp((s.time - 40) / 13) : 0;
  const reduced = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;
  const look = useRef(new THREE.Vector3());
  useFrame(({ camera }, dt) => {
    if (orbit) return;
    const focus =
      s.selected === "Viral DNA"
        ? new THREE.Vector3(0.4, 0.6, 0)
        : s.selected === "Progeny"
          ? new THREE.Vector3(1, 0.4, 1)
          : new THREE.Vector3(0, 0, 0);
    look.current.lerp(
      reduced ? new THREE.Vector3(0, 0, 0) : focus,
      reduced ? 1 : 1 - Math.exp(-dt * 3),
    );
    const desired = reduced
      ? new THREE.Vector3(5, 4, 9)
      : stage >= 4
        ? new THREE.Vector3(7, 4, 11)
        : new THREE.Vector3(4, 3, 7);
    camera.position.lerp(desired, reduced ? 1 : 1 - Math.exp(-dt * 2));
    camera.lookAt(look.current);
  });
  const select = (name: string) =>
    onInspect(
      name === "Bacterial chromosome" || name === "Prophage"
        ? "Bacterial chromosome"
        : name === "Viral genome"
          ? "Viral DNA"
          : name,
    );
  return (
    <>
      <Medium extent={24} />
      <group scale={1.2}>
        <MolecularInteraction
          onDrag={setDragging}
          session={s}
          onMove={onMove}
          onDrop={onDrop}
          onInspect={() =>
            onInspect(s.cargo === "genome" ? "Viral DNA" : "Progeny")
          }
        />
        <Cell
          cut
          lysis={lysis}
          integration={integration}
          division={division}
          quality="Auto"
          onSelect={select}
        />
        {s.replication && s.time < 20 && (
          <group position={[0.5, 0.55, 0.2]} scale={0.65 * (1 - integration)}>
            <GenomeThread
              progress={Math.min(1, s.time / 8)}
              onSelect={() => onInspect("Viral DNA")}
            />
            <Html key="viral-marker" position={[0, 1, 0]} center>
              <button
                className="structure-tag viral"
                onClick={() => onInspect("Viral DNA")}
              >
                Follow viral DNA
              </button>
            </Html>
          </group>
        )}
        <Html position={[-1.6, -0.6, 1.1]} center>
          <button
            className="structure-tag"
            onClick={() => onInspect("Bacterial chromosome")}
          >
            {integration > 0
              ? "Inspect prophage + chromosome"
              : "Inspect host chromosome"}
          </button>
        </Html>
        {lytic &&
          stage === 1 &&
          Array.from({ length: 4 }, (_, i) => (
            <group
              key={i}
              position={[(i - 1.5) * 0.7, 0.35, 0]}
              scale={clamp((s.time - 10 - i) / 6) * 0.35}
            >
              <Dna viral onSelect={() => onInspect("Viral DNA")} />
            </group>
          ))}
        {lytic &&
          stage >= 2 &&
          Array.from({ length: 6 }, (_, i) => {
            const release = clamp((s.time - 50) / 10),
              x = ((i % 3) - 1) * 1.1,
              z = (Math.floor(i / 3) - 0.5) * 0.7;
            return (
              <group
                key={i}
                position={[
                  x * (1 + release * 2),
                  0.1 + release * ((i % 2) + 0.5),
                  z + release * (i % 2 ? 2 : -2),
                ]}
              >
                <Phage
                  scale={0.22}
                  assembly={
                    s.assembled
                      ? 1
                      : Math.min(0.55, clamp((s.time - 23 - i * 0.5) / 13))
                  }
                  pack={clamp((s.time - 26) / 10)}
                  open={stage === 3}
                  onSelect={() => onInspect("Progeny")}
                  detail={false}
                />
              </group>
            );
          })}
        {lytic && stage >= 3 && (
          <Html position={[1.5, 1.3, 0.2]} center>
            <button
              className="structure-tag amber"
              onClick={() => onInspect("Progeny")}
            >
              Follow new phages
            </button>
          </Html>
        )}
        {!lytic && stage >= 4 && (
          <Html position={[2.6, 1, 0]} center>
            <button
              className="structure-tag viral"
              onClick={() => onInspect("Daughter cell")}
            >
              Follow inherited prophage
            </button>
          </Html>
        )}
        {lytic &&
          stage === 2 &&
          Array.from({ length: 12 }, (_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i * 2) * 1.5,
                Math.cos(i * 3) * 0.4,
                Math.sin(i) * 0.5,
              ]}
            >
              <icosahedronGeometry args={[0.08, 1]} />
              <meshStandardMaterial color="#c89762" roughness={0.55} />
            </mesh>
          ))}
      </group>
      {orbit && (
        <OrbitControls
          enabled={!dragging}
          enableDamping
          minDistance={3}
          maxDistance={18}
          target={[0, 0, 0]}
        />
      )}
    </>
  );
}
export default function IntruderGame() {
  const [s, S] = useState(() => initialIntruder()),
    [orbit, O] = useState(false),
    [records, R] = useState<string[]>([]),
    [tutorial, T] = useState(true);
  const { level } = useLearning();
  useGameLoop((dt) => S((v) => stepCell(v, dt)), s.running);
  useEffect(() => {
    if (cellWon(s)) {
      rememberWin(`intruder-${s.route}`);
      R((v) => (v.includes(s.route) ? v : [...v, s.route]));
    }
  }, [s.time, s.observed, s.route]);
  const stage = cellStage(s.time),
    tasks = [
      "Viral DNA",
      "Bacterial chromosome",
      s.route === "lytic" ? "Progeny" : "Daughter cell",
    ];
  const inspect = (name: string) => {
    if (tasks.includes(name)) S((v) => inspectCell(v, name));
  };
  return (
    <div className="cell-experience">
      <div className="mission-strip">
        <div>
          <span className="game-eyebrow">AN EXPEDITION WITH TWO ENDINGS</span>
          <h2>
            INTRUDER <small>Two Fates, One Cell</small>
          </h2>
        </div>
        <span className="route-badge">
          {s.branch
            ? "Choose a destination in the cell"
            : s.route === "lytic"
              ? "Lytic production"
              : "Lysogenic inheritance"}
        </span>
        <button onClick={() => S(initialIntruder())}>
          Return to branching point
        </button>
        <button onClick={() => T(true)}>Controls</button>
        <button onClick={() => O(!orbit)}>
          {orbit ? "Follow process" : "Free camera"}
        </button>
      </div>
      <div className="cell-workspace">
        <div className="game-viewport">
          <GameStage position={[5, 3, 8]}>
            <CellWorld
              session={s}
              onMove={(x, z) => S((v) => moveCargo(v, x, z))}
              onDrop={() => S((v) => dropCargo(v))}
              onInspect={inspect}
              orbit={orbit}
            />
          </GameStage>
          <div className="viewport-caption">
            <span>
              STAGE {stage + 1} / 6 · {cellStages[s.route][stage]}
            </span>
            <span>{s.induced ? "INDUCTION REPLAY" : "TEMPERATE PHAGE λ"}</span>
          </div>
          {tutorial && (
            <div className="control-intro">
              <strong>Track the fate of the genome.</strong>
              <p>
                Drag the viral genome into a pathway destination. Then position
                DNA at the replication region or align attP with attB. In the
                lytic route, join a tail to a packaged head. Fine controls below
                support keyboard play.
              </p>
              <button onClick={() => T(false)}>Begin observation</button>
            </div>
          )}
        </div>
        <aside className="cell-journal">
          <span className="game-eyebrow">FIELD NOTES</span>
          <h3>{cellStages[s.route][stage]}</h3>
          <p>
            {level === "Explorer"
              ? s.branch
                ? "Move the purple DNA toward one of the two paths."
                : s.route === "lytic"
                  ? "Help make new phages, then watch them leave the cell."
                  : "Join the purple DNA to the host DNA and follow it into two daughter cells."
              : explanations[s.route][stage]}
          </p>
          <div className="interaction-task" role="status">
            {s.message}
          </div>
          <div className="observation-list">
            {tasks.map((name, i) => (
              <div
                key={name}
                className={s.observed.includes(name) ? "observed" : ""}
              >
                <span>{s.observed.includes(name) ? "✓" : `0${i + 1}`}</span>
                {name}
              </div>
            ))}
          </div>
          <p className="small-note">
            Select structures in the 3D view to record observations. Completion
            requires all three and the final lifecycle outcome.
          </p>
          {s.time >= 60 && (
            <div className="outcome-note">
              <strong>
                {cellWon(s) ? "Expedition complete" : "One more look"}
              </strong>
              <p>
                {cellWon(s)
                  ? s.route === "lytic"
                    ? "New phages released. The host was lost."
                    : "Prophages inherited. Both daughter cells survive."
                  : "Scrub back to find any structures you missed."}
              </p>
            </div>
          )}
          {s.route === "lysogenic" && s.time >= 20 && (
            <button
              className="induction-button"
              onClick={() => S(induceCell(s))}
            >
              Advanced: induce lytic development
            </button>
          )}
          <div className="comparison-record">
            <strong>Compare your expeditions</strong>
            <span>
              Lytic:{" "}
              {records.includes("lytic")
                ? "observed · host lysed"
                : "not completed"}
            </span>
            <span>
              Lysogenic:{" "}
              {records.includes("lysogenic")
                ? "observed · inheritance"
                : "not completed"}
            </span>
            <button onClick={() => S(initialIntruder())}>
              Replay contrasting outcome →
            </button>
          </div>
        </aside>
      </div>
      <div className="cell-timeline">
        <button
          className="game-primary"
          disabled={s.branch}
          onClick={() =>
            S((v) => ({
              ...v,
              time: v.time >= 60 ? 0 : v.time,
              running: !v.running,
            }))
          }
        >
          {s.running ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => S(initialIntruder(s.branch ? undefined : s.route))}
        >
          Reset
        </button>
        <button onClick={() => S((v) => seekIntruder(v, stage * 10))}>
          Restart stage
        </button>
        <button
          disabled={stage === 0}
          onClick={() => S((v) => seekIntruder(v, (stage - 1) * 10))}
        >
          Previous
        </button>
        <button
          disabled={(stage + 1) * 10 > timelineLimit(s)}
          onClick={() => S((v) => seekIntruder(v, (stage + 1) * 10))}
        >
          Next
        </button>
        <input
          aria-label="Cell lifecycle timeline"
          type="range"
          min={0}
          max={60}
          step={0.1}
          value={s.time}
          onChange={(e) => S((v) => seekIntruder(v, +e.target.value))}
        />
        <span>{Math.floor(s.time)} / 60</span>
        <label>
          Speed
          <select
            value={s.speed}
            onChange={(e) => S((v) => ({ ...v, speed: +e.target.value }))}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
          </select>
        </label>
      </div>
      {(s.branch ||
        (s.route === "lytic" && !s.assembled) ||
        (s.route === "lysogenic" && !s.integrated)) && (
        <div className="molecular-controls">
          <strong>
            {s.cargo === "genome" ? "Viral DNA" : "Tail"} fine positioning
          </strong>
          <label>
            Left / right
            <input
              aria-label="Molecule horizontal position"
              type="range"
              min="-2.3"
              max="2.3"
              step=".05"
              value={s.position[0]}
              onChange={(e) =>
                S((v) => moveCargo(v, +e.target.value, v.position[1]))
              }
            />
          </label>
          <label>
            Depth
            <input
              aria-label="Molecule depth"
              type="range"
              min="-.9"
              max="1"
              step=".05"
              value={s.position[1]}
              onChange={(e) =>
                S((v) => moveCargo(v, v.position[0], +e.target.value))
              }
            />
          </label>
          <label>
            Rotation
            <input
              aria-label="Molecule rotation"
              type="range"
              min="-1.6"
              max="1.6"
              step=".05"
              value={s.twist}
              onChange={(e) => S((v) => ({ ...v, twist: +e.target.value }))}
            />
          </label>
          <button onClick={() => S((v) => dropCargo(v))}>
            Release molecule
          </button>
        </div>
      )}
      <p className="model-note">
        Lambda is a temperate phage. The pathway selector compares possible
        outcomes; real gene regulation determines the switch. Timing, scale, and
        particle counts are illustrative.
      </p>
    </div>
  );
}
