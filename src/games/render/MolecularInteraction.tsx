import { useRef } from "react";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { Phage } from "../../scenes/Biology";
import GenomeThread from "./GenomeThread";
import { type IntruderSession, type Cargo } from "../core/intruder";
export default function MolecularInteraction({
  session: s,
  onMove,
  onDrop,
  onInspect,
  onDrag,
}: {
  session: IntruderSession;
  onMove: (x: number, z: number) => void;
  onDrop: () => void;
  onInspect: () => void;
  onDrag: (dragging: boolean) => void;
}) {
  const drag = useRef(false),
    plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.66)),
    point = useRef(new THREE.Vector3());
  const visible =
    s.branch ||
    (s.route === "lysogenic" && !s.integrated) ||
    (s.route === "lytic" && (!s.replication || (s.time >= 30 && !s.assembled)));
  const targets = s.branch
    ? [
        {
          x: -1.5,
          z: -0.4,
          name: "LYTIC / production region",
          color: "#bc915e",
        },
        {
          x: 1.5,
          z: -0.4,
          name: "LYSOGENIC / chromosome region",
          color: "#9b7eab",
        },
      ]
    : s.route === "lysogenic"
      ? [
          {
            x: 0.15,
            z: 0.05,
            name: "attB · align the notches",
            color: "#9273a3",
          },
        ]
      : !s.replication
        ? [{ x: -1.3, z: 0.65, name: "Replication region", color: "#a68a60" }]
        : [
            {
              x: 1.1,
              z: -0.1,
              name: "Packaged head · tail socket",
              color: "#b5874b",
            },
          ];
  if (!visible) return null;
  return (
    <group>
      {!s.branch &&
        s.route === "lytic" &&
        s.replication &&
        !s.assembled &&
        s.time >= 30 && (
          <group position={[1.1, -0.5, -0.1]} scale={0.27}>
            <Phage isolate="capsid" open pack={1} onSelect={onInspect} />
          </group>
        )}
      {targets.map((t) => (
        <group key={t.name} position={[t.x, 0.53, t.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4, 0.022, 8, 40]} />
            <meshStandardMaterial color={t.color} roughness={0.6} />
          </mesh>
          <Line
            points={[
              [0, 0, 0.38],
              [0, 0, 0.15],
            ]}
            color={t.color}
            lineWidth={3}
          />
          <Html position={[0, 0.45, 0]} center>
            <span className="molecular-label">{t.name}</span>
          </Html>
        </group>
      ))}
      <group
        position={[s.position[0], 0.55, s.position[1]]}
        rotation={[0, s.twist, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          drag.current = true;
          onDrag(true);
          (e.target as Element).setPointerCapture(e.pointerId);
          onInspect();
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          e.stopPropagation();
          if (e.ray.intersectPlane(plane.current, point.current))
            onMove(point.current.x / 1.2, point.current.z / 1.2);
        }}
        onPointerUp={(e) => {
          if (!drag.current) return;
          e.stopPropagation();
          drag.current = false;
          onDrag(false);
          (e.target as Element).releasePointerCapture(e.pointerId);
          onDrop();
        }}
        onPointerCancel={() => {
          drag.current = false;
          onDrag(false);
        }}
      >
        {s.cargo === "genome" ? (
          <group scale={0.58} rotation={[Math.PI / 2, 0, 0]}>
            <GenomeThread
              progress={Math.min(1, s.time / 8)}
              onSelect={onInspect}
            />
          </group>
        ) : (
          <group
            position={[-0.5, 0, 0]}
            scale={0.3}
            rotation={[0, 0, -Math.PI / 2]}
          >
            <Phage isolate="tail" onSelect={onInspect} />
          </group>
        )}
        <mesh>
          <sphereGeometry args={[s.cargo === "genome" ? 0.42 : 0.55, 12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.06, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.055, 0.16, 6]} />
          <meshStandardMaterial color="#a478b8" />
        </mesh>
      </group>
      <Html position={[-2.1, 1.3, 0.3]}>
        <span className="molecular-hint">
          DRAG {s.cargo === "genome" ? "VIRAL DNA" : "THE TAIL"}
          <small>Position, align, release.</small>
        </span>
      </Html>
    </group>
  );
}
