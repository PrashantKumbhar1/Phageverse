import GenomeThread from "../render/GenomeThread";
import { useLearning } from "../shared/LearningMode";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { Phage } from "../../scenes/Biology";
import { GameStage, Medium, Bacterium } from "../render/GameStage";
import {
  contactHosts,
  contactInitial,
  contactStep,
  type ContactState,
  type ContactInput,
} from "../core/contact";
import { useGameLoop, rememberWin } from "../core/useGameLoop";
const titles = ["Find the Host", "Secure Attachment", "Deliver the Genome"];
const empty: ContactInput = { forward: 0, strafe: 0, turn: 0, interact: false };
function ContactWorld({
  state: s,
  close,
  inside,
}: {
  state: ContactState;
  close: boolean;
  inside: boolean;
}) {
  const reduced = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;
  const player = useRef<THREE.Group>(null),
    look = useRef(new THREE.Vector3(0, 0, 0));
  useFrame(({ camera }, dt) => {
    const alpha = reduced ? 1 : 1 - Math.exp(-dt * 5);
    if (player.current) {
      player.current.position.lerp(new THREE.Vector3(s.x, 0.4, s.z), alpha);
      player.current.rotation.y = s.yaw;
    }
    const cinematic = close || s.phase === "attached" || s.phase === "won";
    const offset = cinematic
      ? new THREE.Vector3(4, 3, 5)
      : new THREE.Vector3(Math.sin(s.yaw) * 6, 3.8, Math.cos(s.yaw) * 7);
    camera.position.lerp(offset.add(new THREE.Vector3(s.x, 0, s.z)), alpha);
    look.current.lerp(
      new THREE.Vector3(
        s.x - Math.sin(s.yaw) * 2,
        0.3,
        s.z - Math.cos(s.yaw) * 2,
      ),
      alpha,
    );
    camera.lookAt(look.current);
  });
  return (
    <>
      <Medium extent={35} />
      {contactHosts(s.mission).map((h) => (
        <group key={h.id}>
          <Bacterium
            position={[h.x, 0, h.z]}
            scale={1.4}
            compatible={h.compatible}
            inside={inside && h.id === s.host}
          />
          <Html position={[h.x, 1.6, h.z]} center distanceFactor={12}>
            <span className="specimen-label">
              {h.compatible ? "LamB · three lobes" : "Different receptor"}
              <small>
                {s.inspected.includes(h.id)
                  ? h.compatible
                    ? "Matching binding geometry"
                    : "No matching binding geometry"
                  : "Approach to investigate"}
              </small>
            </span>
          </Html>
          <mesh
            position={[h.x, -0.8, h.z + 2.2]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.65, 0.72, 40]} />
            <meshBasicMaterial color="#8c9b7d" transparent opacity={0.65} />
          </mesh>
          {h.compatible && (
            <Line
              points={[
                [h.x, -0.76, h.z + 3],
                [h.x, -0.76, h.z + 1.5],
              ]}
              color="#657a59"
              lineWidth={2}
            />
          )}
        </group>
      ))}
      <group ref={player} position={[s.x, 0.4, s.z]}>
        <Phage
          scale={0.48}
          rotation={[Math.PI / 2, 0, 0]}
          open={s.phase === "attached" || s.genome > 0}
          pack={1 - s.genome}
          attached={s.stability}
          detail
          onSelect={() => {}}
        />
      </group>
      {inside && s.genome > 0 && (
        <group position={[s.x, 0.3, s.z - 0.7]} scale={s.genome * 0.6}>
          <GenomeThread progress={s.genome} onSelect={() => {}} />
        </group>
      )}
      {s.genome > 0 && (
        <Line
          points={Array.from({ length: 80 }, (_, i) => {
            const t = i / 79;
            return new THREE.Vector3(
              s.x + Math.sin(t * 30) * 0.04,
              0.4,
              s.z + 1.8 - t * (1.8 + s.genome * 1.5),
            );
          })}
          color="#9968b0"
          lineWidth={3}
        />
      )}
    </>
  );
}
export default function Contact() {
  const [state, setState] = useState(() => contactInitial()),
    [paused, setPaused] = useState(false),
    [tutorial, setTutorial] = useState(true),
    [sensitivity, setSensitivity] = useState(1),
    [close, setClose] = useState(false),
    [inside, setInside] = useState(false);
  const { level } = useLearning();
  const keys = useRef(new Set<string>()),
    touch = useRef<ContactInput>({ ...empty }),
    drag = useRef<number | null>(null);
  const active =
    !tutorial && !paused && state.phase !== "won" && state.phase !== "lost";
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).matches("input,select,textarea")) return;
        if (
          [
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "ArrowLeft",
            "ArrowRight",
            "Space",
            "KeyE",
          ].includes(e.code)
        ) {
          e.preventDefault();
          keys.current.add(e.code);
        }
        if (e.code === "Escape") setPaused((v) => !v);
      },
      up = (e: KeyboardEvent) => keys.current.delete(e.code),
      clear = () => {
        keys.current.clear();
        touch.current = { ...empty };
        setPaused(true);
      };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
  useGameLoop((dt) => {
    const k = keys.current;
    setState((s) =>
      contactStep(
        s,
        {
          forward:
            Number(k.has("KeyW")) -
            Number(k.has("KeyS")) +
            touch.current.forward,
          strafe:
            Number(k.has("KeyD")) -
            Number(k.has("KeyA")) +
            touch.current.strafe,
          turn:
            (Number(k.has("ArrowLeft")) - Number(k.has("ArrowRight"))) *
              sensitivity +
            touch.current.turn,
          interact: k.has("KeyE") || k.has("Space") || touch.current.interact,
        },
        dt,
      ),
    );
  }, active);
  useEffect(() => {
    if (state.phase === "won") rememberWin(`contact-${state.mission}`);
  }, [state.phase, state.mission]);
  const reset = (mission = state.mission) => {
    setState(contactInitial(mission));
    setPaused(false);
    keys.current.clear();
    touch.current = { ...empty };
  };
  const hold =
    (axis: keyof ContactInput, value: number | boolean) =>
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      touch.current = { ...touch.current, [axis]: value };
    };
  const release = () => {
    touch.current = { ...empty };
  };
  return (
    <div className="contact-experience">
      <div className="game-title-line">
        <span>CONTACT</span>
        <p>The Perfect Lock</p>
      </div>
      <div className="mission-strip">
        <div>
          <span className="game-eyebrow">
            FIELD MISSION {state.mission + 1} / 3
          </span>
          <h2>{titles[state.mission]}</h2>
        </div>
        <div className="mission-pips">
          {titles.map((t, i) => (
            <span
              key={t}
              className={
                i === state.mission
                  ? "current"
                  : i < state.mission
                    ? "complete"
                    : ""
              }
            >
              {i + 1}
            </span>
          ))}
        </div>
        <button onClick={() => setPaused((v) => !v)}>
          {paused ? "Resume" : "Pause"}
        </button>
        <button onClick={() => reset()}>Restart</button>
        <button onClick={() => setTutorial(true)}>Controls</button>
        <button onClick={() => setClose(!close)}>
          {close ? "Tracking camera" : "Close-up"}
        </button>
        {state.genome > 0 && (
          <button onClick={() => setInside(!inside)}>
            {inside ? "Outside view" : "Follow DNA inside"}
          </button>
        )}
      </div>
      <div
        className="game-viewport contact-viewport"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).tagName === "CANVAS") {
            drag.current = e.clientX;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        }}
        onPointerMove={(e) => {
          if (drag.current !== null && active) {
            const delta = e.clientX - drag.current;
            setState((s) =>
              s.phase === "seeking"
                ? { ...s, yaw: s.yaw - delta * 0.006 * sensitivity }
                : s,
            );
            drag.current = e.clientX;
          }
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <GameStage position={[0, 4, 12]}>
          <ContactWorld state={state} close={close} inside={inside} />
        </GameStage>
        <div className="viewport-caption">
          <span>λ / HOST RECOGNITION</span>
          <span>
            {Math.floor(state.elapsed)}s exploration ? steady contact{" "}
            {Math.round(state.stability * 100)}%
          </span>
        </div>
        {tutorial && (
          <div className="control-intro">
            <strong>Move. Align. Make contact.</strong>
            <p>
              WASD to swim · drag to aim · ← → to rotate · hold E or Space to
              interact. Touch controls are below.
            </p>
            <button onClick={() => setTutorial(false)}>
              Got it — hide guide
            </button>
          </div>
        )}
        {(paused || state.phase === "won" || state.phase === "lost") && (
          <div className="game-overlay">
            <span className="game-eyebrow">
              {paused
                ? "OBSERVATION PAUSED"
                : state.phase === "won"
                  ? "MISSION COMPLETE"
                  : "TRY ANOTHER APPROACH"}
            </span>
            <h2>{paused ? "Take a closer look." : state.message}</h2>
            {paused ? (
              <button onClick={() => setPaused(false)}>
                Resume exploration
              </button>
            ) : state.phase === "won" && state.mission < 2 ? (
              <button onClick={() => reset(state.mission + 1)}>
                Next mission →
              </button>
            ) : (
              <button
                onClick={() => reset(state.phase === "won" ? 0 : state.mission)}
              >
                {state.phase === "won" ? "Replay expedition" : "Retry mission"}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="contact-command">
        <div className="movement-pad" aria-label="Touch movement controls">
          {[
            ["forward", 1, "Forward ↑"],
            ["strafe", -1, "Left ←"],
            ["forward", -1, "Back ↓"],
            ["strafe", 1, "Right →"],
            ["turn", 1, "Turn ↶"],
            ["turn", -1, "Turn ↷"],
          ].map(([axis, value, label]) => (
            <button
              key={String(label)}
              aria-label={String(label)}
              onPointerDown={hold(axis as keyof ContactInput, value as number)}
              onPointerUp={release}
              onPointerCancel={release}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  touch.current = { ...empty, [axis]: value };
              }}
              onKeyUp={release}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="game-primary interaction-button"
          onPointerDown={hold("interact", true)}
          onPointerUp={release}
          onPointerCancel={release}
          onKeyDown={(e) => {
            if (e.key === "Enter") touch.current.interact = true;
          }}
          onKeyUp={release}
        >
          {state.phase === "attached"
            ? "Hold to deliver DNA"
            : state.mission === 0
              ? "Hold to inspect"
              : "Hold to attach"}
        </button>
        <label>
          Aim sensitivity
          <select
            value={sensitivity}
            onChange={(e) => setSensitivity(+e.target.value)}
          >
            <option value={0.6}>Gentle</option>
            <option value={1}>Standard</option>
            <option value={1.5}>Fast</option>
          </select>
        </label>
      </div>
      <div className="context-line" role="status">
        <span className="bio-dot" />
        {level === "Explorer"
          ? state.phase === "attached"
            ? "Your phage is attached! Hold Deliver to move its DNA inside."
            : state.stability > 0
              ? "Keep still. The matching parts are connecting."
              : state.message
          : state.message}
        {(state.phase === "attached" || state.stability > 0) && (
          <progress
            aria-label={
              state.phase === "attached"
                ? "Genome delivery"
                : "Attachment stability"
            }
            value={state.phase === "attached" ? state.genome : state.stability}
            max={1}
          />
        )}
      </div>
      <p className="model-note">
        Navigation and the delivery hold are learning controls. Phages do not
        steer or consciously choose hosts; real attachment emerges from physical
        encounters.
      </p>
    </div>
  );
}
