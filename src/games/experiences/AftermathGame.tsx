import { useLearning } from "../shared/LearningMode";
import { useEffect, useState } from "react";
import { Html, OrbitControls } from "@react-three/drei";
import { GameStage, Medium, Bacterium, MicroPhage } from "../render/GameStage";
import {
  initialPopulation,
  stepPopulation,
  dosePopulation,
  counts,
  populationWon,
  scenarios,
  type Population,
  type PopulationSettings,
} from "../core/population";
import { useGameLoop, rememberWin } from "../core/useGameLoop";
type RecordEntry = {
  name: string;
  route: string;
  time: number;
  alive: number;
  produced: number;
  lysogens: number;
  lost: number;
};
function PopulationWorld({
  state: s,
  selected,
  onSelect,
  close,
}: {
  state: Population;
  selected: number | null;
  onSelect: (id: number) => void;
  close: boolean;
}) {
  const focus = s.cells.find((c) => c.id === selected);
  return (
    <>
      <Medium extent={40} />
      {s.cells.map((c) => (
        <group key={c.id}>
          <Bacterium
            position={[c.x, 0, c.z]}
            scale={0.65}
            compatible={c.compatible}
            state={c.state}
            inside={
              c.id === selected &&
              (c.state === "infected" || c.state === "lysogen")
            }
            progress={c.age}
            onClick={() => onSelect(c.id)}
          />
          {(c.rejectedUntil ?? 0) > s.time && (
            <Html position={[c.x, 1, c.z]} center>
              <span className="contact-rejected">Receptor mismatch</span>
            </Html>
          )}
          {c.id === selected && (
            <Html position={[c.x, 1.6, c.z]} center>
              <span className="specimen-label">
                SPECIMEN {c.id + 1}
                <small>
                  {c.compatible ? "Compatible" : "Incompatible"} · {c.state}
                </small>
              </span>
            </Html>
          )}
          {c.state === "infected" && (
            <mesh position={[c.x, -0.85, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry
                args={[
                  0.78,
                  0.82,
                  32,
                  1,
                  0,
                  Math.PI * 2 * Math.min(1, c.age / 8),
                ]}
              />
              <meshBasicMaterial color="#bd8c5e" />
            </mesh>
          )}
        </group>
      ))}
      {s.particles.map((v) => (
        <MicroPhage
          key={v.id}
          scale={v.state === "bound" ? 0.14 : 0.18}
          position={[v.x, v.state === "bound" ? 0.1 : 0.55, v.z]}
          rotation={
            v.state === "bound"
              ? [Math.PI / 2, 0, 0]
              : [0.35, Math.sin(v.id + s.time * 0.2), 0.35]
          }
          empty={v.state === "bound"}
        />
      ))}
      <OrbitControls
        makeDefault
        enableDamping
        minDistance={close ? 4 : 12}
        maxDistance={close ? 11 : 35}
        maxPolarAngle={Math.PI * 0.47}
        target={close && focus ? [focus.x, 0, focus.z] : [0, 0, 0]}
      />
    </>
  );
}
export default function AftermathGame() {
  const [scenario, Scenario] = useState(0),
    [settings, Settings] = useState<PopulationSettings>({
      ...scenarios[0].settings,
    }),
    [state, State] = useState(() => initialPopulation(scenarios[0].settings)),
    [running, Running] = useState(false),
    [selected, Selected] = useState<number | null>(null),
    [close, Close] = useState(false),
    [doses, Doses] = useState(2),
    [records, Records] = useState<RecordEntry[]>([]),
    [tutorial, Tutorial] = useState(true);
  const { level } = useLearning();
  const numbers = counts(state),
    won = populationWon(state, scenario),
    finished = state.time >= settings.duration,
    cell = state.cells.find((c) => c.id === selected);
  useGameLoop(
    (dt) => State((s) => stepPopulation(s, settings, dt)),
    running && !finished,
  );
  useEffect(() => {
    if (won) rememberWin(`aftermath-${scenario}`);
  }, [won, scenario]);
  const reset = (p = settings, index = scenario) => {
    Settings({ ...p });
    State(initialPopulation(p));
    Running(false);
    Selected(null);
    Close(false);
    Doses(2);
    Scenario(index);
  };
  const change = (key: keyof PopulationSettings, value: number | string) =>
    reset({ ...settings, [key]: value });
  const record = () =>
    Records((r) => [
      ...r.slice(-2),
      {
        name: scenarios[scenario].name,
        route: settings.route,
        time: state.time,
        alive: numbers.healthy + numbers.infected + numbers.lysogens,
        produced: numbers.produced,
        lysogens: numbers.lysogens,
        lost: numbers.lost,
      },
    ]);
  return (
    <div className="aftermath-experience">
      <div className="mission-strip">
        <div>
          <span className="game-eyebrow">
            A LIVING POPULATION / STRATEGY OBSERVATORY
          </span>
          <h2>Phage AftermathGame</h2>
        </div>
        <label className="scenario-selector">
          Scenario
          <select
            value={scenario}
            onChange={(e) => {
              const i = +e.target.value;
              reset(scenarios[i].settings, i);
            }}
          >
            {scenarios.map((s, i) => (
              <option value={i} key={s.name}>
                {String(i + 1).padStart(2, "0")} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => Close(!close)} disabled={selected === null}>
          {close ? "Overview" : "Inspect selected"}
        </button>
      </div>
      <div className="population-objective">
        <span className={won ? "objective-complete" : ""}>
          {won ? "✓ OBJECTIVE ACHIEVED" : "YOUR OBJECTIVE"}
        </span>
        <strong>
          {level === "Explorer"
            ? [
                "Follow three matching infections.",
                "Watch four cells release new phages.",
                "Follow the purple DNA into new daughter cells.",
                "Compare matching and non-matching hosts.",
              ][scenario]
            : scenarios[scenario].goal}
        </strong>
        <span>
          {Math.floor(state.time)} / {settings.duration} model seconds
        </span>
      </div>
      <div className="aftermath-workspace">
        <aside className="population-settings">
          <span className="game-eyebrow">STARTING CONDITIONS</span>
          <p>Changing a condition starts a fresh experiment.</p>
          <fieldset disabled={running}>
            <label>
              Bacterial cells <strong>{settings.bacteria}</strong>
              <input
                aria-label="Starting bacterial population"
                type="range"
                min={8}
                max={24}
                step={2}
                value={settings.bacteria}
                onChange={(e) => change("bacteria", +e.target.value)}
              />
            </label>
            <label>
              Compatible hosts{" "}
              <strong>{Math.round(settings.compatible * 100)}%</strong>
              <input
                aria-label="Compatible host percentage"
                type="range"
                min={0.25}
                max={1}
                step={0.25}
                value={settings.compatible}
                onChange={(e) => change("compatible", +e.target.value)}
              />
            </label>
            <label>
              Initial phages <strong>{settings.phages}</strong>
              <input
                aria-label="Initial phage population"
                type="range"
                min={2}
                max={10}
                value={settings.phages}
                onChange={(e) => change("phages", +e.target.value)}
              />
            </label>
            <label>
              Pathway
              <select
                value={settings.route}
                onChange={(e) => change("route", e.target.value)}
              >
                <option value="lytic">Lytic outcome</option>
                <option value="lysogenic">Lysogenic outcome</option>
              </select>
            </label>
            <label>
              Progression speed
              <select
                value={settings.rate}
                onChange={(e) => change("rate", +e.target.value)}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </label>
            <label>
              Duration
              <select
                value={settings.duration}
                onChange={(e) => change("duration", +e.target.value)}
              >
                <option value={45}>45 model seconds</option>
                <option value={60}>60 model seconds</option>
                <option value={70}>70 model seconds</option>
                <option value={90}>90 model seconds</option>
              </select>
            </label>
          </fieldset>
        </aside>
        <div className="game-viewport population-viewport">
          <GameStage position={[12, 15, 20]}>
            <PopulationWorld
              state={state}
              selected={selected}
              onSelect={Selected}
              close={close}
            />
          </GameStage>
          <div className="viewport-caption">
            <span>TEAL · COMPATIBLE / SAND · INCOMPATIBLE</span>
            <span>DRAG TO ORBIT · PINCH / SCROLL TO ZOOM</span>
          </div>
          {tutorial && (
            <div className="control-intro">
              <strong>Watch encounters become outcomes.</strong>
              <p>
                Select a cell in the arena. You have two additional inoculum
                doses: choose where and when to release them. Watch receptor
                mismatches, infections, and descendants.
              </p>
              <button onClick={() => Tutorial(false)}>Enter observatory</button>
            </div>
          )}
          {finished && (
            <div className="population-end">
              <strong>
                {won ? "Scenario complete" : "Objective not reached"}
              </strong>
              <span>
                {won
                  ? "Compare this run with a different population."
                  : "Change the dose, host mix, or duration and try again."}
              </span>
              <button onClick={record}>Save comparison snapshot</button>
            </div>
          )}
        </div>
      </div>
      <div className="population-counters">
        {[
          ["Susceptible", numbers.susceptible],
          ["Incompatible", numbers.incompatible],
          ["Infected", numbers.infected],
          ["Lysogens", numbers.lysogens],
          ["Free phages", numbers.free],
          ["New progeny", numbers.produced],
          ["Cells lysed", numbers.lost],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="population-command">
        <label>
          Playback
          <select
            aria-label="Population playback speed"
            value={settings.rate}
            onChange={(e) => Settings((v) => ({ ...v, rate: +e.target.value }))}
          >
            <option value={0.5}>0.5?</option>
            <option value={1}>1?</option>
            <option value={2}>2?</option>
          </select>
        </label>
        <button
          className="game-primary"
          disabled={finished}
          onClick={() => Running(!running)}
        >
          {running ? "Pause" : state.time ? "Resume" : "Start experiment"}
        </button>
        <button onClick={() => reset()}>Reset</button>
        <button
          disabled={!cell || !doses || finished || cell.state === "lysed"}
          onClick={() => {
            if (cell) {
              State((s) => dosePopulation(s, cell.x, cell.z));
              Doses((n) => n - 1);
            }
          }}
        >
          Release 3 near selected · {doses} doses
        </button>
        <button onClick={record}>Record outcome</button>
      </div>
      <div className="context-line" role="status">
        {cell
          ? `Specimen ${cell.id + 1}: ${cell.compatible ? "compatible receptor" : "incompatible receptor"} · ${cell.state}. `
          : "Select a cell to inspect it or position an inoculum dose. "}
        {state.failed} failed contacts · {state.contacts} infections ·{" "}
        {state.inherited} inherited prophages.
      </div>
      {records.length > 0 && (
        <div className="run-comparison">
          <h3>Your experiment log</h3>
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Scenario / pathway</th>
                  <th>Time</th>
                  <th>Living cells</th>
                  <th>Progeny</th>
                  <th>Lysogens</th>
                  <th>Lysed</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {r.name} / {r.route}
                    </td>
                    <td>{Math.round(r.time)}</td>
                    <td>{r.alive}</td>
                    <td>{r.produced}</td>
                    <td>{r.lysogens}</td>
                    <td>{r.lost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="ecosystem-log">
        <h3>
          {level === "Explorer"
            ? "What happened in this world"
            : "Biological event history"}
        </h3>
        {state.events.length === 0 ? (
          <p>Start the experiment to record encounters and outcomes.</p>
        ) : (
          <ol>
            {state.events
              .slice(-10)
              .reverse()
              .map((event) => (
                <li key={event.id}>
                  <time>{event.time.toFixed(1)}s</time>
                  <strong>Cell {event.cell + 1}</strong>
                  <span>{event.message}</span>
                </li>
              ))}
          </ol>
        )}
      </div>
      <details className="model-assumptions">
        <summary>How this educational model works</summary>
        <p>
          Contacts follow deterministic trajectories. Only compatible,
          uninfected cells can be infected. After eight model seconds, a lytic
          infection releases three explicitly rendered progeny; a lysogenic
          infection instead establishes a prophage. A lysogen divides once after
          fifteen model seconds, passing the prophage to both daughters.
          Incompatible cells remain uninfected. Two optional doses add three
          input phages each; these are not counted as newly produced progeny.
          Population size is capped at 40 cells. Mutation, resistance evolution,
          immunity, degradation, nutrients, and molecular regulation are
          omitted. This is not a validated biological predictor.
        </p>
      </details>
    </div>
  );
}
