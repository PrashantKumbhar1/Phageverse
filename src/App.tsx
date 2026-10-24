import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Volume2,
  VolumeX,
  Microscope,
  MoveUpRight,
  Atom,
  Check,
  X,
  ScanLine,
  Focus,
  Keyboard,
  CircleHelp,
  Layers3,
  ArrowDown,
  Sun,
  Moon,
} from "lucide-react";
import {
  advance,
  stageIndex,
  stages,
  structures,
  questions,
  explorerQuestions,
  type Pathway,
} from "./simulation";
import { useTheme } from "./theme";
import { GameLearning, type LearningMode } from "./games/shared/LearningMode";
import LabPanel from "./components/LabPanel";
import GamesPage from "./games/GamesPage";
import { labComponents, type LabComponent } from "./data/labComponents";
const Scene = lazy(() => import("./Scene"));
type Page =
  "Home" | "Journey" | "Laboratory" | "Compare" | "Knowledge" | "Games";
const nav: Page[] = [
  "Home",
  "Journey",
  "Laboratory",
  "Games",
  "Compare",
  "Knowledge",
];
export default function App() {
  const { theme, toggle } = useTheme();
  const [page, setPage] = useState<Page>(
      window.location.hash.startsWith("#games") ? "Games" : "Home",
    ),
    [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [path, setPath] = useState<Pathway>("lytic"),
    [level, setLevel] = useState("Science"),
    [quality, setQuality] = useState("Auto"),
    [camera, setCamera] = useState("Guided"),
    [view, setView] = useState("Exterior"),
    [selected, setSelected] = useState(""),
    [narration, setNarration] = useState(false),
    [intro, setIntro] = useState(true),
    [prediction, setPrediction] = useState(false),
    [predictionAnswer, setPredictionAnswer] = useState<number | null>(null),
    [checked, setChecked] = useState(false);
  const [labComponent, setLabComponent] =
    useState<LabComponent>("Whole specimen");
  const [labExplode, setLabExplode] = useState(0),
    [labProgress, setLabProgress] = useState(0),
    [labPlaying, setLabPlaying] = useState(false),
    [controlsHidden, setControlsHidden] = useState(false);
  const focusComponent = (name: LabComponent) => {
    setLabComponent(name);
    setLabProgress(0);
    setLabPlaying(false);
    setSelected("");
    setCamera("Guided");
  };
  useEffect(() => {
    if (!labPlaying || page !== "Laboratory") return;
    const id = setInterval(
      () =>
        setLabProgress((v) => {
          if (v >= 1) {
            setLabPlaying(false);
            return 1;
          }
          return Math.min(1, v + 0.005);
        }),
      40,
    );
    return () => clearInterval(id);
  }, [labPlaying, page]);
  const reduced = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;
  const [introProgress, setIntroProgress] = useState(reduced ? 1 : 0);
  const [labels, setLabels] = useState(true);
  const [help, setHelp] = useState(false);
  const [homePaused, setHomePaused] = useState(false);
  const [hunt, setHunt] = useState(false),
    [huntFeedback, setHuntFeedback] = useState("");
  const inspect = (name: string) => {
    if (page === "Laboratory" && labComponents.some((c) => c.name === name)) {
      focusComponent(name as LabComponent);
      return;
    }
    setSelected(name);
    if (hunt)
      setHuntFeedback(
        name === "Capsid"
          ? "Correct — the capsid protects the viral genome."
          : "Look again. Find the protein shell surrounding the viral DNA.",
      );
  };
  const active = stageIndex(time),
    data = stages(path),
    stage = data[active],
    predicted = useRef(false);
  useEffect(() => {
    if (!playing) return;
    let id = 0,
      last = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      if (now - last >= 33) {
        const delta = Math.min((now - last) / 1000, 0.15);
        setTime((t) => advance(t, delta, speed));
        last = now;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, speed]);
  useEffect(() => {
    if (time >= 84) setPlaying(false);
    if (page === "Journey" && time >= 36 && !predicted.current && playing) {
      predicted.current = true;
      setPlaying(false);
      setPrediction(true);
    }
  }, [time, playing, page]);
  useEffect(() => {
    if (!narration || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      level === "Science" ? stage.science : stage.explorer,
    );
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
    return () => window.speechSynthesis.cancel();
  }, [narration, active, level, path]);
  useEffect(() => {
    if (!intro || reduced) {
      setIntroProgress(1);
      return;
    }
    if (page !== "Home") return;
    let id = 0,
      start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 6500);
      setIntroProgress(progress);
      if (progress === 1) {
        setIntro(false);
        return;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [intro, reduced, page]);
  const go = (next: Page) => {
    setPage(next);
    history.replaceState(
      null,
      "",
      next === "Games" ? "#games" : location.pathname + location.search,
    );
    setSelected("");
    setHunt(false);
    setHuntFeedback("");
    setView(next === "Laboratory" ? "Cutaway" : "Exterior");
    setCamera(next === "Laboratory" ? "Explore" : "Guided");
    setPlaying(next === "Journey");
    if (next === "Laboratory") setTime(0);
    if (next === "Journey") {
      setTime(0);
      predicted.current = false;
    }
  };
  const seek = (t: number) => {
    setTime(t);
    setSelected("");
  };
  const restart = () => {
    setTime(0);
    predicted.current = false;
    setPredictionAnswer(null);
    setPlaying(true);
  };
  const branch = (p: Pathway) => {
    setPath(p);
    seek(36);
    setPlaying(false);
  };
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        (event.target.closest(
          'input,select,textarea,[contenteditable="true"]',
        ) ||
          (event.code === "Space" && event.target.closest("button")))
      )
        return;
      if (prediction || help) return;
      if (page === "Journey" || page === "Compare") {
        if (event.code === "Space") {
          event.preventDefault();
          setPlaying((v) => !v);
        }
        if (event.code === "ArrowRight") {
          event.preventDefault();
          setTime((t) => Math.min(72, (stageIndex(t) + 1) * 12));
        }
        if (event.code === "ArrowLeft") {
          event.preventDefault();
          setTime((t) => Math.max(0, (stageIndex(t) - 1) * 12));
        }
      }
      if (event.key.toLowerCase() === "l") setLabels((v) => !v);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [page, prediction, help]);
  useEffect(() => {
    if (!prediction && !help) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const buttons = dialog?.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    );
    buttons?.[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHelp(false);
        setPrediction(false);
        setPlaying(false);
        return;
      }
      if (event.key !== "Tab" || !buttons?.length) return;
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [help, prediction]);
  return (
    <div className={`app ${page === "Home" ? "home" : "inside"}`}>
      <header>
        <button
          className="brand"
          onClick={() => go("Home")}
          aria-label="PhageVerse home"
        >
          <span className="brand-symbol">
            <Atom size={27} />
          </span>
          PHAGE<span>VERSE</span>
          <span className="brand-dot" />
        </button>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n}
              className={page === n ? "active" : ""}
              onClick={() => go(n)}
            >
              {n === "Journey"
                ? "The Journey"
                : n === "Knowledge"
                  ? "Knowledge hub"
                  : n}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title="Change appearance"
          >
            {theme === "light" ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === "light" ? "Light" : "Dark"}</span>
          </button>
          <span className="live-dot" />
          <span>AN INTERACTIVE MICROWORLD</span>
          <button
            className="icon-button"
            title="Expand experience"
            aria-label="Toggle fullscreen"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void document.documentElement.requestFullscreen?.();
            }}
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </header>
      <main
        data-page={page}
        data-controls={controlsHidden ? "hidden" : "shown"}
      >
        {page !== "Games" && page !== "Knowledge" && (
          <div className="scene-wrap">
            <Suspense
              fallback={
                <div className="loading">Preparing the microscopic world…</div>
              }
            >
              <Scene
                theme={theme}
                labComponent={labComponent}
                labExplode={labExplode}
                labProgress={labProgress}
                time={time}
                path={path}
                home={page === "Home"}
                lab={page === "Laboratory"}
                view={view}
                camera={camera}
                quality={quality}
                selected={selected}
                onSelect={inspect}
                reduced={reduced}
                ambientPaused={homePaused}
                intro={introProgress}
                playing={playing}
                labels={labels}
              />
            </Suspense>
          </div>
        )}
        <div className="scene-shade" />
        <div className="ambient-aura" aria-hidden="true" />
        <div className="viewport-corners" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        {page === "Home" ? (
          <>
            <div className="hero-copy">
              <div className="eyebrow">
                <span />
                THE MICROSCOPIC HAS A MONUMENTAL STORY.
              </div>
              <h1>
                Inside the
                <br />
                <em>Invisible.</em>
              </h1>
              <p>
                One virus. One bacterium. Two possible futures.
                <br />
                Enter the remarkable world of bacteriophage lambda
                <br className="desktop-break" /> and discover the biology that
                unfolds within.
              </p>
              <div className="hero-actions">
                <button className="primary" onClick={() => go("Journey")}>
                  Begin the Journey <ArrowUpRight size={19} />
                </button>
                <button className="secondary" onClick={() => go("Laboratory")}>
                  <Microscope size={17} /> Enter the Laboratory
                </button>
              </div>
              <button className="text-link" onClick={() => go("Compare")}>
                Compare the two pathways <ArrowRight size={15} />
              </button>
              <div className="hero-meta">
                <span>REAL-TIME 3D</span>
                <i />
                <span>SCIENTIFICALLY GUIDED</span>
                <i />
                <span>FREE TO EXPLORE</span>
              </div>
            </div>
            <div className="specimen-label phage-label">
              <span className="label-line" />
              <span className="label-number">01</span>
              <div>
                BACTERIOPHAGE λ<small>A virus with two possible futures</small>
              </div>
            </div>
            <div className="specimen-label cell-label">
              <span className="label-line" />
              <span className="label-number">02</span>
              <div>
                ESCHERICHIA COLI<small>The host. The living environment.</small>
              </div>
            </div>
            <div className="scene-caption">
              <span className="live-dot" /> LIVE 3D ENVIRONMENT{" "}
              <span className="caption-divider" /> CONCEPTUAL SCALE
            </div>
            <div className="specimen-coordinate">
              <span>SPECIMEN — 001</span>
              <strong>λ / E. coli</strong>
              <small>A study in two possible futures.</small>
            </div>
            <div className="home-scene-tools">
              <button
                aria-label={
                  homePaused ? "Resume ambient motion" : "Pause ambient motion"
                }
                onClick={() => setHomePaused((v) => !v)}
              >
                {homePaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <span>LIVE SPECIMEN</span>
              <i />
              <button
                aria-label="Open specimen in laboratory"
                onClick={() => go("Laboratory")}
              >
                <ScanLine size={17} />
              </button>
            </div>
            <button className="intro-control" onClick={() => setIntro(!intro)}>
              {intro ? "Skip introduction" : "Replay introduction"}{" "}
              <ArrowRight size={13} />
            </button>
            <div className="home-bottom">
              <div className="index">
                01 <span>/ 05</span>
              </div>
              <div className="bottom-note">
                A SMALL ENCOUNTER.
                <br />
                <span>AN EXTRAORDINARY STORY.</span>
              </div>
              <button className="discover" onClick={() => go("Journey")}>
                EXPLORE THE UNSEEN <span>↓</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="workspace-heading">
              <div className="eyebrow">PHAGEVERSE / {page.toUpperCase()}</div>
              <h1>
                {page === "Journey"
                  ? "A microscopic journey."
                  : page === "Laboratory"
                    ? "Look a little closer."
                    : page === "Compare"
                      ? "Two paths. One beginning."
                      : "Put discovery into practice."}
              </h1>
            </div>
            {page !== "Knowledge" && page !== "Games" && (
              <div className="chapter-badge">
                <span className="live-dot" />
                <span>
                  {page === "Laboratory"
                    ? "FREE EXPLORATION"
                    : `${path.toUpperCase()} / ${String(active + 1).padStart(2, "0")}`}
                </span>
              </div>
            )}
            {page === "Journey" && (
              <aside className="learning-panel">
                <div className="panel-kicker">
                  STAGE {String(active + 1).padStart(2, "0")} / 07{" "}
                  <span>{path.toUpperCase()}</span>
                </div>
                <h2>{stage.name}</h2>
                <div className="stage-visual">
                  <span style={{ width: `${((active + 1) / 7) * 100}%` }} />
                </div>
                <p className="summary">{stage.summary}</p>
                <p>{level === "Science" ? stage.science : stage.explorer}</p>
                <div className="vocabulary">{stage.vocab}</div>
                <h3>Why this matters</h3>
                <p>{stage.why}</p>
                {active >= 3 && (
                  <div className="branch-buttons">
                    <button
                      className={path === "lytic" ? "chosen" : ""}
                      onClick={() => branch("lytic")}
                    >
                      Lytic pathway <ArrowUpRight size={14} />
                    </button>
                    <button
                      className={path === "lysogenic" ? "chosen" : ""}
                      onClick={() => branch("lysogenic")}
                    >
                      Lysogenic pathway <ArrowUpRight size={14} />
                    </button>
                  </div>
                )}
                {path === "lysogenic" && active === 6 && (
                  <button
                    className="secondary"
                    onClick={() => {
                      setPath("lytic");
                      seek(48);
                      setPlaying(true);
                    }}
                  >
                    Induce lytic pathway
                  </button>
                )}
              </aside>
            )}
            {page === "Laboratory" && (
              <LabPanel
                component={labComponent}
                onComponent={focusComponent}
                explode={labExplode}
                onExplode={setLabExplode}
                progress={labProgress}
                onProgress={(v) => {
                  setLabPlaying(false);
                  setLabProgress(v);
                }}
                playing={labPlaying}
                onPlay={() => {
                  if (labProgress >= 1) setLabProgress(0);
                  setLabPlaying(!labPlaying);
                }}
                onReset={() => {
                  setLabProgress(0);
                  setLabExplode(0);
                  setLabPlaying(false);
                  setCamera("Guided");
                }}
                view={view}
                onView={setView}
              />
            )}
            {page === "Games" && (
              <GameLearning level={level as LearningMode} setLevel={setLevel}>
                <GamesPage />
              </GameLearning>
            )}
            {page === "Compare" && (
              <div className="compare-panel">
                <div className="compare-top">
                  <span>SHARED STAGE {active + 1} / 7</span>
                  <span>One active 3D scene · synchronized explanations</span>
                </div>
                <div className="compare-columns">
                  {(["lytic", "lysogenic"] as const).map((p) => (
                    <section
                      key={p}
                      className={p === path ? "selected-path" : ""}
                    >
                      <button className="path-title" onClick={() => setPath(p)}>
                        {p === "lytic" ? "Lytic pathway" : "Lysogenic pathway"}{" "}
                        <ArrowUpRight size={18} />
                      </button>
                      <h2>{stages(p)[active].name}</h2>
                      <p>
                        {level === "Science"
                          ? stages(p)[active].science
                          : stages(p)[active].explorer}
                      </p>
                      <dl>
                        <dt>Viral genome</dt>
                        <dd>
                          {active < 4
                            ? "Enters the host"
                            : p === "lytic"
                              ? "Replicated and packaged"
                              : "Integrated as a prophage"}
                        </dd>
                        <dt>New phage assembly</dt>
                        <dd>
                          {p === "lytic" && active >= 5
                            ? "Yes, after component production"
                            : "Not during stable lysogeny"}
                        </dd>
                        <dt>Host outcome</dt>
                        <dd>
                          {p === "lytic"
                            ? "Lysis at the end of productive infection"
                            : "Survives and can pass the prophage to daughter cells"}
                        </dd>
                      </dl>
                      <button className="text-link" onClick={() => setPath(p)}>
                        {path === p
                          ? "Viewing in 3D"
                          : "View this pathway in 3D"}{" "}
                        <ArrowRight size={14} />
                      </button>
                    </section>
                  ))}
                </div>
              </div>
            )}
            {page === "Knowledge" && (
              <Knowledge
                science={level === "Science"}
                onStructure={() => {
                  go("Laboratory");
                  setView("Phage structure");
                  setHunt(true);
                }}
              />
            )}
            {hunt && page === "Laboratory" && (
              <div className="hunt-prompt" role="status">
                <div className="eyebrow">STRUCTURE HUNT</div>
                <h3>Select the shell that protects viral DNA.</h3>
                <p>
                  {huntFeedback ||
                    "Click the structure in 3D or choose its name from the laboratory list."}
                </p>
                <button className="text-link" onClick={() => setHunt(false)}>
                  Finish challenge <Check size={14} />
                </button>
              </div>
            )}
            {selected && page !== "Knowledge" && page !== "Games" && (
              <div className="inspection">
                <button
                  className="icon-button"
                  aria-label="Close structure information"
                  onClick={() => setSelected("")}
                >
                  <X size={15} />
                </button>
                <div className="eyebrow">STRUCTURE INSPECTION</div>
                <h3>{selected}</h3>
                <p>{structures.find((s) => s[0] === selected)?.[1]}</p>
                <small>Current context: {stage.name}</small>
              </div>
            )}
            {page !== "Knowledge" && page !== "Games" && (
              <div className="viewport-tools">
                <button
                  className={camera === "Guided" ? "chosen" : ""}
                  onClick={() => setCamera("Guided")}
                >
                  <Focus size={14} /> Guided
                </button>
                <button
                  className={camera === "Explore" ? "chosen" : ""}
                  onClick={() => setCamera("Explore")}
                >
                  <ScanLine size={14} /> Orbit
                </button>
                <button
                  className={labels ? "chosen" : ""}
                  aria-label="Toggle structure labels"
                  aria-pressed={labels}
                  onClick={() => setLabels((v) => !v)}
                >
                  <Layers3 size={14} />
                  <span>Labels</span>
                </button>
                <button
                  aria-label="Show keyboard shortcuts"
                  onClick={() => setHelp(true)}
                >
                  <Keyboard size={15} />
                </button>
              </div>
            )}
            {(page === "Journey" || page === "Compare") && !controlsHidden && (
              <div
                className="timeline-panel"
                style={
                  { "--progress": `${(time / 84) * 100}%` } as CSSProperties
                }
              >
                <div className="timeline-topline">
                  <button onClick={() => setControlsHidden(true)}>
                    Hide controls ?
                  </button>
                  <span>
                    <span className="live-dot" />
                    {playing ? "SIMULATION RUNNING" : "SIMULATION PAUSED"}
                  </span>
                  <span>ANIMATION TIME · NOT BIOLOGICAL TIME</span>
                  <button
                    onClick={() => setHelp(true)}
                    aria-label="Simulation help"
                  >
                    <CircleHelp size={14} />
                  </button>
                </div>
                <div className="stage-track">
                  {data.map((s, i) => (
                    <button
                      key={i}
                      className={
                        active === i ? "current" : active > i ? "completed" : ""
                      }
                      onClick={() => seek(i * 12)}
                      aria-current={active === i ? "step" : undefined}
                    >
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {s.name}
                    </button>
                  ))}
                </div>
                <input
                  aria-label="Simulation timeline"
                  type="range"
                  min="0"
                  max="84"
                  step=".05"
                  value={time}
                  onChange={(e) => seek(+e.target.value)}
                />
                <div className="playback">
                  <div>
                    <button
                      className="icon-button"
                      aria-label="Restart pathway"
                      onClick={restart}
                    >
                      <RotateCcw size={17} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Previous stage"
                      onClick={() => seek(Math.max(0, active - 1) * 12)}
                    >
                      <ChevronLeft size={19} />
                    </button>
                    <button
                      className="play-button"
                      aria-label={playing ? "Pause" : "Play"}
                      onClick={() => setPlaying(!playing)}
                    >
                      {playing ? <Pause size={17} /> : <Play size={17} />}
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Next stage"
                      onClick={() => seek(Math.min(6, active + 1) * 12)}
                    >
                      <ChevronRight size={19} />
                    </button>
                    <span className="time-readout">
                      {Math.floor(time).toString().padStart(2, "0")}s{" "}
                      <span>/ 84s</span>
                    </span>
                  </div>
                  <div>
                    <label className="speed-label">
                      Speed{" "}
                      <select
                        aria-label="Playback speed"
                        value={speed}
                        onChange={(e) => setSpeed(+e.target.value)}
                      >
                        <option value={0.5}>0.5×</option>
                        <option value={1}>1×</option>
                        <option value={2}>2×</option>
                      </select>
                    </label>
                    <span className="progress-label">
                      {Math.round((time / 84) * 100)}% COMPLETE
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {(page === "Journey" || page === "Compare") && controlsHidden && (
          <div className="compact-playback">
            <button onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play"}
            </button>
            <span>{stage.name}</span>
            <button onClick={() => setControlsHidden(false)}>
              Show timeline ?
            </button>
          </div>
        )}
      </main>
      <footer>
        <div className="footer-left">
          <span className="footer-mark">λ</span>
          <span>SMALL SCALE. INFINITE DISCOVERY.</span>
        </div>
        <div className="preferences">
          <label>
            Learning mode
            <select
              aria-label="Learning mode"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option>Science</option>
              <option>Explorer</option>
            </select>
          </label>
          <span className="footer-divider" />
          <label>
            Quality
            <select
              aria-label="Rendering quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              {["Auto", "High", "Balanced", "Performance"].map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
          </label>
          <button
            className="icon-button"
            disabled={!("speechSynthesis" in window)}
            aria-label={
              narration ? "Mute narration" : "Enable browser narration"
            }
            title="Optional browser speech narration"
            onClick={() => setNarration(!narration)}
          >
            {narration ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </footer>
      {help && (
        <div className="modal-shade" onClick={() => setHelp(false)}>
          <section
            className="question-modal shortcut-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal icon-button"
              aria-label="Close shortcuts"
              onClick={() => setHelp(false)}
            >
              <X size={18} />
            </button>
            <div className="eyebrow">YOUR MICROSCOPE, YOUR PACE</div>
            <h2 id="shortcuts-title">A few ways to explore.</h2>
            <dl>
              <dt>
                <kbd>Space</kbd>
              </dt>
              <dd>Play or pause the journey</dd>
              <dt>
                <kbd>←</kbd>
                <kbd>→</kbd>
              </dt>
              <dd>Previous or next stage</dd>
              <dt>
                <kbd>L</kbd>
              </dt>
              <dd>Show or hide structure labels</dd>
              <dt>Drag</dt>
              <dd>Orbit in exploration mode</dd>
              <dt>Scroll / pinch</dt>
              <dd>Move closer or further away</dd>
            </dl>
            <p>
              The simulation is a conceptual illustration. Organism sizes and
              event durations are adjusted for clarity.
            </p>
            <button className="primary" onClick={() => setHelp(false)}>
              Back to discovery <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
      {prediction && (
        <div className="modal-shade">
          <section
            className="question-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prediction-title"
          >
            <div className="eyebrow">PAUSE & PREDICT</div>
            <h2 id="prediction-title">
              What happens after DNA enters the host?
            </h2>
            <p>Choose the most complete explanation.</p>
            {[
              "The whole capsid enters the chromosome.",
              "Viral DNA can direct lytic growth or establish lysogeny.",
              "The cell immediately releases new phages.",
            ].map((a, i) => (
              <button
                key={a}
                className={`answer ${predictionAnswer === i ? "chosen" : ""}`}
                onClick={() => {
                  setPredictionAnswer(i);
                  setChecked(true);
                }}
              >
                {a}
              </button>
            ))}
            {checked && (
              <p className="feedback">
                {predictionAnswer === 1 ? "Correct. " : "Take another look. "}
                Lambda can follow either pathway; infection conditions and gene
                regulation influence the outcome.
              </p>
            )}
            <button
              className="primary"
              onClick={() => {
                setPrediction(false);
                setPlaying(true);
                setChecked(false);
              }}
            >
              Continue the journey <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function Knowledge({
  science,
  onStructure,
}: {
  science: boolean;
  onStructure: () => void;
}) {
  const [q, setQ] = useState(0),
    [answers, setAnswers] = useState<number[]>([]),
    [finished, setFinished] = useState(false),
    [order, setOrder] = useState([2, 0, 3, 1]),
    [orderChecked, setOrderChecked] = useState(false),
    [orderPath, setOrderPath] = useState<Pathway>("lytic");
  const question = (science ? questions : explorerQuestions)[q],
    answer = answers[q];
  const labels =
    orderPath === "lytic"
      ? ["Attachment", "Genome injection", "Replication", "Assembly & release"]
      : ["Attachment", "Genome injection", "Integration", "Inheritance"];
  return (
    <div className="knowledge-grid">
      <section>
        <div className="panel-kicker">01 / KNOWLEDGE CHECK</div>
        <h2>
          {finished
            ? "Your discovery review"
            : science
              ? "Test your understanding"
              : "What did you discover?"}
        </h2>
        {finished ? (
          <>
            <div className="score">
              {answers.filter((a, i) => a === questions[i].correct).length}
              <span> / {questions.length}</span>
            </div>
            <p>Questions answered. Review any missed ideas below.</p>
            {questions.map((item, i) => (
              <p key={i} className="review">
                {answers[i] === item.correct ? (
                  <Check size={15} />
                ) : (
                  <X size={15} />
                )}{" "}
                {item.why}
              </p>
            ))}
            <button
              className="primary"
              onClick={() => {
                setQ(0);
                setAnswers([]);
                setFinished(false);
              }}
            >
              Try again <RotateCcw size={16} />
            </button>
          </>
        ) : (
          <>
            <span className="question-count">
              QUESTION {q + 1} OF {questions.length}
            </span>
            <h3>{question.q}</h3>
            {question.a.map((a, i) => (
              <button
                key={a}
                className={`answer ${answer === i ? "chosen" : ""}`}
                disabled={answer !== undefined}
                onClick={() => setAnswers([...answers, i])}
              >
                {a}
                {answer === i && <Check size={16} />}
              </button>
            ))}
            {answer !== undefined && (
              <>
                <p className="feedback">
                  {answer === question.correct ? "Correct. " : "Not quite. "}
                  {question.why}
                </p>
                <button
                  className="primary"
                  onClick={() =>
                    q === questions.length - 1 ? setFinished(true) : setQ(q + 1)
                  }
                >
                  {q === questions.length - 1
                    ? "View results"
                    : "Next question"}{" "}
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </>
        )}
      </section>
      <section>
        <div className="panel-kicker">02 / PUT EVENTS IN ORDER</div>
        <h2>Rebuild the lifecycle.</h2>
        <label>
          Pathway
          <select
            value={orderPath}
            onChange={(e) => {
              setOrderPath(e.target.value as Pathway);
              setOrderChecked(false);
            }}
          >
            <option value="lytic">Lytic</option>
            <option value="lysogenic">Lysogenic</option>
          </select>
        </label>
        <p>Use the arrows to move the events into their correct sequence.</p>
        {order.map((id, i) => (
          <div className="order-row" key={id}>
            <span>{i + 1}</span>
            {labels[id]}
            <button
              aria-label={`Move ${labels[id]} up`}
              disabled={i === 0}
              onClick={() => {
                const n = [...order];
                [n[i - 1], n[i]] = [n[i], n[i - 1]];
                setOrder(n);
                setOrderChecked(false);
              }}
            >
              ↑
            </button>
            <button
              aria-label={`Move ${labels[id]} down`}
              disabled={i === 3}
              onClick={() => {
                const n = [...order];
                [n[i + 1], n[i]] = [n[i], n[i + 1]];
                setOrder(n);
                setOrderChecked(false);
              }}
            >
              ↓
            </button>
          </div>
        ))}
        <button className="secondary" onClick={() => setOrderChecked(true)}>
          Check sequence <Check size={16} />
        </button>
        {orderChecked && (
          <p className="feedback">
            {order.every((v, i) => v === i)
              ? "Correct — you have reconstructed this pathway."
              : "Not yet. Attachment comes first; genetic material enters before replication or integration."}
          </p>
        )}
        <div className="structure-challenge">
          <div className="panel-kicker">03 / STRUCTURE HUNT</div>
          <h3>Where is the viral DNA protected?</h3>
          <p>
            Find and select the capsid in the laboratory. Its information panel
            will explain its role.
          </p>
          <button className="text-link" onClick={onStructure}>
            Inspect the phage <MoveUpRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
