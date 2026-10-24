import { useLearning } from "./shared/LearningMode";
import {
  Component,
  lazy,
  Suspense,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowUpRight, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { hasWon } from "./core/useGameLoop";
import "./games.css";
const ContactGame = lazy(() => import("./experiences/ContactGame"));
const IntruderGame = lazy(() => import("./experiences/IntruderGame"));
const AftermathGame = lazy(() => import("./experiences/AftermathGame"));
const Preview = lazy(() =>
  import("./render/GameStage").then((m) => ({ default: m.Preview })),
);
const games = [
  {
    title: "CONTACT: The Perfect Lock",
    category: "EXPLORATION & PRECISION",
    description:
      "Drift through a living world. Find the right host, secure your attachment, and follow the genome inside.",
    detail: "3 missions · WASD + mouse / touch",
    number: "01",
    key: "contact-2",
  },
  {
    title: "INTRUDER: Two Fates, One Cell",
    category: "LIFECYCLE EXPEDITION",
    description:
      "Guide viral DNA into replication or integration. Assemble a particle, or pass a prophage into daughter cells.",
    detail: "2 pathways · Select, orbit & observe",
    number: "02",
    key: "intruder-lysogenic",
  },
  {
    title: "AFTERMATH: The Living World",
    category: "POPULATION STRATEGY",
    description:
      "A handful of encounters can change a population. Position an inoculum and watch the consequences unfold.",
    detail: "4 scenarios · Real-time 3D strategy",
    number: "03",
    key: "aftermath-3",
  },
];
class LoadBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="game-render-error">
        <h2>The experience could not load.</h2>
        <button onClick={() => location.reload()}>Reload and try again</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function GamesPage() {
  const { level, setLevel } = useLearning();
  const [active, Active] = useState<number | null>(() => {
      const i = ["contact", "intruder", "aftermath"].indexOf(
        location.hash.split("/")[1],
      );
      return i < 0 ? null : i;
    }),
    [sound, Sound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const cue = () => {
    if (!sound) return;
    try {
      const ctx = audio.current ?? new AudioContext();
      audio.current = ctx;
      void ctx.resume();
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(420, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        620,
        ctx.currentTime + 0.08,
      );
      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.13);
    } catch {}
  };
  return (
    <section
      className="games-v2"
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("button")) cue();
      }}
    >
      <div className="games-topbar">
        <label className="game-learning-mode">
          Explanation
          <select
            aria-label="Game explanation level"
            value={level}
            onChange={(e) => setLevel(e.target.value as "Explorer" | "Science")}
          >
            <option>Explorer</option>
            <option>Science</option>
          </select>
        </label>
        {active !== null ? (
          <button
            className="back-to-hub"
            onClick={() => {
              Active(null);
              history.replaceState(null, "", "#games");
            }}
          >
            <ArrowLeft size={16} /> All expeditions
          </button>
        ) : (
          <span className="game-eyebrow">PHAGEVERSE / PLAY TO DISCOVER</span>
        )}
        <button
          className="sound-toggle"
          aria-pressed={sound}
          onClick={() => Sound(!sound)}
        >
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound{" "}
          {sound ? "on" : "off"}
        </button>
      </div>
      <LoadBoundary>
        {active === null ? (
          <>
            <div className="games-hub-heading">
              <div>
                <span className="game-eyebrow">THE LIVING MICROCOSM</span>
                <h1>
                  Small worlds.
                  <br />
                  <em>Extraordinary consequences.</em>
                </h1>
              </div>
              <p>
                Three ways to discover what a phage can do.
                <br />
                Explore, follow, and experiment — inside a living 3D world.
              </p>
            </div>
            <div className="expedition-covers">
              {games.map((g, i) => (
                <article
                  key={g.title}
                  className={`expedition-cover cover-${i}`}
                >
                  <div
                    className="cover-preview"
                    aria-label={`${g.title} 3D preview`}
                  >
                    <Suspense
                      fallback={
                        <div className="game-loading">Preparing specimen…</div>
                      }
                    >
                      <Preview kind={i} />
                    </Suspense>
                    <span className="cover-number">{g.number}</span>
                    <span className="cover-category">{g.category}</span>
                  </div>
                  <div className="cover-description">
                    <span className="game-eyebrow">{g.detail}</span>
                    <h2>{g.title}</h2>
                    <p>{g.description}</p>
                    <button
                      className="launch-expedition"
                      onClick={() => {
                        Active(i);
                        history.replaceState(
                          null,
                          "",
                          `#games/${["contact", "intruder", "aftermath"][i]}`,
                        );
                        window.scrollTo({ top: 0, behavior: "instant" });
                      }}
                    >
                      Enter experience <ArrowUpRight size={18} />
                    </button>
                    {hasWon(g.key) && (
                      <span className="completion-mark">
                        ✓ Expedition explored
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <div className="hub-footnote">
              <span>AMBER / PHAGE</span>
              <span>TEAL / BACTERIUM</span>
              <span>VIOLET / VIRAL DNA</span>
              <p>
                Progress stays on this device. No accounts, rankings, or student
                data collection.
              </p>
            </div>
          </>
        ) : (
          <Suspense
            fallback={
              <div className="game-loading large">
                <span className="loading-orbit" />
                <h2>Entering the microscopic world…</h2>
                <p>Preparing geometry, materials, and your expedition.</p>
              </div>
            }
          >
            {active === 0 ? (
              <ContactGame />
            ) : active === 1 ? (
              <IntruderGame />
            ) : (
              <AftermathGame />
            )}
          </Suspense>
        )}
      </LoadBoundary>
    </section>
  );
}
