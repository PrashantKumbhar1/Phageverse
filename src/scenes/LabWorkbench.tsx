import { useMemo, useEffect } from "react";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { Cell, Phage, Dna, Instances } from "./Biology";
import { palette } from "./palette";
import { vector, random, chromosomePoint, type Instance } from "./geometry";
import { ease, interval } from "../simulation/poses";
import type { LabComponent } from "../data/labComponents";
type Props = {
  component: LabComponent;
  explode: number;
  progress: number;
  view: string;
  quality: string;
  onSelect: (name: string) => void;
  labels: boolean;
};
function Label({
  position,
  children,
}: {
  position: [number, number, number];
  children: string;
}) {
  return (
    <Html position={position} center distanceFactor={9}>
      <span className="world-label">{children}</span>
    </Html>
  );
}

function Receptor({ explode = 0 }: { explode?: number }) {
  const strands = useMemo(
    () =>
      Array.from({ length: 3 * 18 }, (_, i) => {
        const barrel = Math.floor(i / 18),
          a = (barrel * Math.PI * 2) / 3,
          base = vector(
            Math.cos(a) * (0.4 + explode * 0.3),
            0,
            Math.sin(a) * (0.4 + explode * 0.3),
          );
        return Array.from({ length: 14 }, (_, j) => {
          const t = j / 13,
            b = ((i % 18) / 18) * Math.PI * 2 + t * 0.27;
          return base
            .clone()
            .add(
              vector(Math.cos(b) * 0.23, (t - 0.5) * 0.9, Math.sin(b) * 0.23),
            );
        });
      }),
    [explode],
  );
  return (
    <group>
      {strands.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={i % 3 ? palette.bacteriaLight : palette.bacteria}
          lineWidth={3}
        />
      ))}
      {[0, 1, 2].map((i) => {
        const a = (i * Math.PI * 2) / 3;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * (0.4 + explode * 0.3),
              0.46,
              Math.sin(a) * (0.4 + explode * 0.3),
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.23, 0.035, 6, 18]} />
            <meshStandardMaterial color="#9ee4c7" roughness={0.65} />
          </mesh>
        );
      })}
    </group>
  );
}

function LipidLayer({
  y,
  outer = false,
  lysis = 0,
}: {
  y: number;
  outer?: boolean;
  lysis?: number;
}) {
  const heads = useMemo(() => {
    const items: Instance[] = [];
    for (let x = 0; x < 11; x++)
      for (let z = 0; z < 7; z++)
        for (const side of [-1, 1]) {
          const position = vector(
            (x - 5) * 0.28,
            y + side * 0.23,
            (z - 3) * 0.28,
          );
          if (
            lysis > 0.01 &&
            Math.hypot(position.x - 0.7, position.z) < lysis * 4
          )
            continue;
          items.push({ position, scale: vector(0.09, 0.08, 0.09) });
        }
    return items;
  }, [y, lysis]);
  const tails = useMemo(
    () =>
      heads.flatMap((h) =>
        [-1, 1].map((side) => ({
          position: h.position
            .clone()
            .add(vector(side * 0.025, h.position.y > y ? -0.11 : 0.11, 0)),
          scale: vector(0.018, 0.11, 0.018),
        })),
      ),
    [heads, y],
  );
  const lps = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) =>
        Array.from({ length: 9 }, (_, j) =>
          vector(
            ((i % 5) - 2) * 0.5 + Math.sin(j * 0.8 + i) * 0.04,
            y + 0.25 + j * 0.09,
            (Math.floor(i / 5) - 0.5) * 0.85,
          ),
        ),
      ),
    [y],
  );
  return (
    <group>
      <Instances
        items={heads}
        color={outer ? palette.bacteriaLight : palette.innerMembrane}
      />
      <Instances items={tails} color="#588a81" />
      {outer &&
        lysis < 0.2 &&
        lps.map((points, i) => (
          <Line key={i} points={points} color="#a6d5ad" lineWidth={2} />
        ))}
    </group>
  );
}
function Envelope({
  explode,
  progress,
  labels,
}: {
  explode: number;
  progress: number;
  labels: boolean;
}) {
  const outerY = 0.9 + explode * 0.75,
    innerY = -0.7 - explode * 0.5;
  const mesh = useMemo(() => {
    const lines: THREE.Vector3[] = [];
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 0.36;
      lines.push(vector(x, 0.12, -1), vector(x, 0.12, 1));
    }
    for (let i = 0; i < 7; i++) {
      const z = (i - 3) * 0.33;
      lines.push(vector(-1.5, 0.12, z), vector(1.5, 0.12, z));
    }
    return lines;
  }, []);
  return (
    <group rotation={[0.24, 0.15, -0.06]}>
      <LipidLayer y={outerY} outer lysis={interval(progress, 0.6, 1)} />
      <Line
        segments
        points={mesh}
        color={palette.peptidoglycan}
        lineWidth={3}
        transparent
        opacity={1 - interval(progress, 0.3, 0.7)}
      />
      <LipidLayer y={innerY} lysis={interval(progress, 0.1, 0.55)} />
      {labels && (
        <>
          <Label position={[2.1, outerY, 0]}>OUTER MEMBRANE + LPS</Label>
          <Label position={[2.1, 0.12, 0]}>PEPTIDOGLYCAN</Label>
          <Label position={[2.1, innerY, 0]}>INNER MEMBRANE</Label>
        </>
      )}
    </group>
  );
}
function CircularGenome({
  progress,
  explode,
}: {
  progress: number;
  explode: number;
}) {
  const points = useMemo(
    () =>
      [0, 1].map((side) =>
        Array.from({ length: 200 }, (_, i) => {
          const t = i / 199,
            a = t * Math.PI * 2,
            r = 1.1;
          const ring = vector(Math.cos(a) * r, Math.sin(a) * r, 0),
            linear = vector((t - 0.5) * 4, Math.sin(t * Math.PI) * 0.15, 0);
          const p = linear.lerp(ring, ease(progress));
          return p.add(
            vector(
              Math.cos(t * 60 + side * Math.PI) * (0.06 + explode * 0.06),
              0,
              Math.sin(t * 60 + side * Math.PI) * (0.06 + explode * 0.06),
            ),
          );
        }),
      ),
    [progress, explode],
  );
  return (
    <group>
      {points.map((p, i) => (
        <Line
          key={i}
          points={p}
          color={i ? palette.viralDna : "#f2cef9"}
          lineWidth={3}
        />
      ))}
      <Line
        segments
        points={Array.from({ length: 40 }, (_, i) => [
          points[0][i * 5],
          points[1][i * 5],
        ]).flat()}
        color="#aa79bf"
        lineWidth={1}
      />
    </group>
  );
}
function Ribosome({
  progress,
  explode,
}: {
  progress: number;
  explode: number;
}) {
  const peptide = useMemo(
    () =>
      Array.from({ length: Math.max(2, Math.floor(progress * 45)) }, (_, i) =>
        vector(
          Math.sin(i * 0.7) * 0.2,
          0.4 + i * 0.046,
          Math.cos(i * 0.7) * 0.2,
        ),
      ),
    [progress],
  );
  return (
    <group>
      <mesh position={[0, 0.32 + explode * 0.5, 0]} scale={[1, 0.72, 0.65]}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial color="#69b6a8" roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.42 - explode * 0.3, 0.1]} scale={[0.85, 0.4, 0.6]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#287985" roughness={0.7} />
      </mesh>
      <Line
        points={Array.from({ length: 75 }, (_, i) =>
          vector(
            (i / 74 - 0.5) * 4,
            Math.sin(i * 0.24 + progress * 8) * 0.04,
            -0.09,
          ),
        )}
        color="#e1bf82"
        lineWidth={3}
      />
      <Line points={peptide} color="#f0a35e" lineWidth={5} />
      <Label position={[1.8, 0.5, 0]}>PROTEIN CHAIN</Label>
      <Label position={[-1.7, -0.35, 0]}>mRNA</Label>
    </group>
  );
}

export default function LabWorkbench(p: Props) {
  const component = p.component,
    progress = ease(p.progress);
  const trace = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => {
        const t = i / 89;
        return vector(
          Math.sin(t * 25 + p.progress * 15) * 0.035,
          (t - 0.5) * 3.9,
          Math.cos(t * 25 + p.progress * 15) * 0.035,
        );
      }),
    [p.progress],
  );
  return (
    <group position={[0.8, 0.6, 0]}>
      {component === "Whole specimen" && (
        <group position={[0, -0.5, 0]}>
          <Cell
            cut={p.view === "Cutaway" || p.view === "DNA focus"}
            transparent={p.view === "Transparent" || p.view === "DNA focus"}
            integration={progress}
            quality={p.quality}
            onSelect={p.onSelect}
          />
          <Phage
            position={
              p.view === "Phage structure" ? [0, 0.3, 1.5] : [-0.62, 1.24, 0.22]
            }
            scale={0.7}
            open={p.view === "Phage structure"}
            onSelect={p.onSelect}
          />
        </group>
      )}
      {component === "Capsid" && (
        <group position={[0, -6.1, 0]} scale={1.6}>
          <Phage
            isolate="capsid"
            open={p.explode > 0.15 || p.progress > 0}
            explode={p.explode}
            pack={p.progress > 0 ? progress : 1}
            onSelect={p.onSelect}
          />
        </group>
      )}
      {component === "Tail" && (
        <group position={[0, -2.9, 0]} scale={1.65}>
          <Phage isolate="tail" explode={p.explode} onSelect={p.onSelect} />
          {p.progress > 0 && (
            <Line
              points={trace.map((v) =>
                vector(v.x, ((v.y + 2) / 3.9) * 2.45 + 0.7, v.z),
              )}
              color={palette.viralDna}
              lineWidth={2}
            />
          )}
        </group>
      )}
      {component === "Portal & neck" && (
        <group position={[0, -11.2, 0]} scale={3.5}>
          <Phage isolate="portal" explode={p.explode} onSelect={p.onSelect} />
          {p.progress > 0 && (
            <Line
              points={trace.map((v) =>
                vector(v.x * 0.35, 3.2 + v.y * 0.17, v.z * 0.35),
              )}
              color={palette.viralDna}
              lineWidth={2.5}
            />
          )}
        </group>
      )}
      {(component === "Tail tip" || component === "LamB receptor") && (
        <group>
          <group position={[0, -0.5, 0]} scale={1.2}>
            <Receptor explode={p.explode} />
          </group>
          <group position={[0, 2.2 - progress * 2.1, 0]} scale={1.8}>
            <Phage isolate="tip" attached={progress} onSelect={p.onSelect} />
          </group>
          {p.labels && (
            <>
              <Label position={[-1.5, 1.8, 0]}>gpJ TAIL TIP</Label>
              <Label position={[1.7, -0.7, 0]}>LamB TRIMER</Label>
            </>
          )}
        </group>
      )}
      {component === "Viral genome" && (
        <CircularGenome progress={p.progress} explode={p.explode} />
      )}
      {component === "Cell envelope" && (
        <Envelope explode={p.explode} progress={p.progress} labels={p.labels} />
      )}
      {(component === "Bacterial chromosome" || component === "Prophage") && (
        <group rotation={[0.15, 0.15, 0]} scale={1 + p.explode * 0.22}>
          <Dna
            integrated={
              component === "Prophage" ? interval(p.progress, 0, 0.45) : 0
            }
            replicated={
              component === "Bacterial chromosome"
                ? progress
                : interval(p.progress, 0.5, 1)
            }
            onSelect={p.onSelect}
          />
          {p.labels && (
            <Label position={[0, -1, 0]}>
              {component === "Prophage"
                ? "VIOLET SEGMENT = INTEGRATED LAMBDA DNA"
                : "NUCLEOID / SCHEMATIC CHROMOSOME"}
            </Label>
          )}
        </group>
      )}
      {component === "Ribosome" && (
        <Ribosome progress={p.progress} explode={p.explode} />
      )}
    </group>
  );
}
