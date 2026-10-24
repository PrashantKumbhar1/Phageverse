import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
/** Linear double-stranded DNA closes into a ring; geometry is illustrative. */
export default function GenomeThread({
  progress,
  onSelect,
}: {
  progress: number;
  onSelect: () => void;
}) {
  const strands = useMemo(
    () =>
      [0, 1].map((side) =>
        Array.from({ length: 150 }, (_, i) => {
          const t = i / 149,
            a = t * Math.PI * 2,
            p = new THREE.Vector3((t - 0.5) * 2.4, 0, 0).lerp(
              new THREE.Vector3(Math.cos(a) * 0.65, Math.sin(a) * 0.65, 0),
              Math.max(0, Math.min(1, progress)),
            );
          return p.add(
            new THREE.Vector3(
              0,
              Math.cos(t * 60 + side * Math.PI) * 0.04,
              Math.sin(t * 60 + side * Math.PI) * 0.04,
            ),
          );
        }),
      ),
    [progress],
  );
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {strands.map((p, i) => (
        <Line
          key={i}
          points={p}
          color={i ? "#c08bd3" : "#9263a9"}
          lineWidth={3}
        />
      ))}
      <Line
        segments
        points={Array.from({ length: 30 }, (_, i) => [
          strands[0][i * 5],
          strands[1][i * 5],
        ]).flat()}
        color="#ba99c9"
        lineWidth={1}
      />
    </group>
  );
}
