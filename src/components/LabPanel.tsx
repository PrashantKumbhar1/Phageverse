import { ArrowUpRight, Pause, Play, RotateCcw, ScanLine } from "lucide-react";
import { labComponents, type LabComponent } from "../data/labComponents";
type Props = {
  component: LabComponent;
  onComponent: (name: LabComponent) => void;
  explode: number;
  onExplode: (n: number) => void;
  progress: number;
  onProgress: (n: number) => void;
  playing: boolean;
  onPlay: () => void;
  onReset: () => void;
  view: string;
  onView: (view: string) => void;
};
export default function LabPanel(p: Props) {
  const data = labComponents.find((c) => c.name === p.component)!;
  return (
    <aside className="learning-panel lab-panel anatomy-panel">
      <div className="panel-kicker">ANATOMY THEATRE / INTERACTIVE 3D</div>
      <h2>
        {p.component === "Whole specimen"
          ? "Dissect the invisible."
          : p.component}
      </h2>
      <div className="organism-key">
        <span className="phage-key" />
        BACTERIOPHAGE <span className="bacteria-key" />
        BACTERIUM
      </div>
      <label>
        Choose a structure
        <select
          aria-label="Choose laboratory component"
          value={p.component}
          onChange={(e) => p.onComponent(e.target.value as LabComponent)}
        >
          {["Overview", "Bacteriophage", "Bacterium"].map((group) => (
            <optgroup key={group} label={group}>
              {labComponents
                .filter((c) => c.group === group)
                .map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="component-pills">
        {labComponents.map((c) => (
          <button
            key={c.name}
            className={p.component === c.name ? "chosen" : ""}
            onClick={() => p.onComponent(c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>
      {p.component === "Whole specimen" ? (
        <label>
          View through the cell
          <select value={p.view} onChange={(e) => p.onView(e.target.value)}>
            {[
              "Exterior",
              "Transparent",
              "Cutaway",
              "DNA focus",
              "Phage structure",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="dissection-control">
          <span>
            Dissection <strong>{Math.round(p.explode * 100)}%</strong>
          </span>
          <input
            aria-label="Separate component layers"
            type="range"
            min="0"
            max="1"
            step=".01"
            value={p.explode}
            onChange={(e) => p.onExplode(+e.target.value)}
          />
          <small>
            {["Cell envelope", "Capsid", "Tail", "Portal & neck"].includes(
              p.component,
            )
              ? "Separate the layers and protein assemblies."
              : "Separate or enlarge the structure for inspection."}
          </small>
        </label>
      )}
      <div className="lab-demo-controls">
        <button className="primary" onClick={p.onPlay}>
          {p.playing ? <Pause size={14} /> : <Play size={14} />}{" "}
          {p.playing ? "Pause behavior" : "Animate behavior"}
        </button>
        <button
          className="icon-button"
          aria-label="Reset laboratory animation and camera"
          onClick={p.onReset}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <label className="demo-scrub">
        <span>{data.demo}</span>
        <input
          aria-label="Scrub component behavior"
          type="range"
          min="0"
          max="1"
          step=".005"
          value={p.progress}
          onChange={(e) => p.onProgress(+e.target.value)}
        />
      </label>
      <h3>{data.title}</h3>
      <p>{data.role}</p>
      <details open>
        <summary>What you are seeing</summary>
        <p>{data.look}</p>
      </details>
      <details>
        <summary>How it behaves</summary>
        <p>{data.behavior}</p>
      </details>
      <a
        className="text-link"
        href={data.source}
        target="_blank"
        rel="noreferrer"
      >
        Structural reference <ArrowUpRight size={13} />
      </a>
      <p className="lab-gesture">
        <ScanLine size={13} /> Use Orbit to rotate, pan, and zoom. Models and
        dissection distances are schematic.
      </p>
    </aside>
  );
}
