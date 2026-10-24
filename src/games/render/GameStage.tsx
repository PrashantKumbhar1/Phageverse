import { useMobileLayout } from "../shared/useMobileLayout";
import { useTheme } from "../../theme";
import { Component, Suspense, useMemo, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  Line,
  OrbitControls,
  Html,
  PerformanceMonitor,
} from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Instances, Dna } from "../../scenes/Biology";
import { membraneTexture, vector, random } from "../../scenes/geometry";

const parts: THREE.BufferGeometry[] = [];
parts.push(new THREE.IcosahedronGeometry(0.62, 1).translate(0, 3.82, 0));
parts.push(
  new THREE.CylinderGeometry(0.09, 0.075, 2.65, 12).translate(0, 1.8, 0),
);
for (let i = 0; i < 24; i++)
  parts.push(
    new THREE.TorusGeometry(0.1, 0.025, 5, 10)
      .rotateX(Math.PI / 2)
      .translate(0, 0.6 + i * 0.108, 0),
  );
for (let i = 0; i < 3; i++) {
  const a = (i * Math.PI * 2) / 3;
  parts.push(
    new THREE.CylinderGeometry(0.025, 0.035, 0.55, 5)
      .rotateZ(0.23)
      .rotateY(a)
      .translate(Math.cos(a) * 0.08, 0.3, Math.sin(a) * 0.08),
  );
}
parts.push(
  new THREE.TorusGeometry(0.16, 0.04, 6, 12)
    .rotateX(Math.PI / 2)
    .translate(0, 3.17, 0),
);
// One shared draw geometry for the small population particles; detailed hero uses Phage.
const phageGeometry = mergeGeometries(
  parts.map((p) => (p.index ? p.toNonIndexed() : p)),
);
parts.forEach((p) => p.dispose());
const capsule = new THREE.CapsuleGeometry(0.7, 1.7, 8, 20);
capsule.rotateZ(Math.PI / 2);
const surfaceTexture = membraneTexture();
const inert = () => {};
export function MicroPhage({
  scale = 0.3,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  empty = false,
}: {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  empty?: boolean;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={phageGeometry}>
        <meshPhysicalMaterial
          color={empty ? "#c8bca2" : "#bf7b38"}
          roughness={0.47}
          metalness={0.12}
          clearcoat={0.2}
        />
      </mesh>
      <mesh position={[0, 3.82, 0]} scale={1.005}>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshBasicMaterial
          wireframe
          color="#754923"
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}
export function Bacterium({
  position = [0, 0, 0],
  scale = 1,
  compatible = true,
  state = "healthy",
  progress = 0,
  onClick = inert,
  inside = false,
}: {
  position?: [number, number, number];
  scale?: number;
  compatible?: boolean;
  state?: string;
  progress?: number;
  onClick?: () => void;
  inside?: boolean;
}) {
  const bumps = useMemo(
    () =>
      Array.from({ length: 65 }, (_, i) => {
        const a = random(i + 1) * Math.PI * 2,
          x = (random(i + 50) - 0.5) * 2.4;
        return {
          position: vector(x, Math.sin(a) * 0.69, Math.cos(a) * 0.69),
          scale: vector(0.035, 0.045, 0.035),
        };
      }),
    [],
  );
  const color = !compatible
    ? "#ab9e89"
    : state === "infected"
      ? "#688f89"
      : state === "lysogen"
        ? "#6e9d93"
        : "#478c88";
  if (state === "lysed")
    return (
      <group position={position}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(i * 1.25) * (1 + progress),
              -0.3,
              Math.sin(i * 1.25) * (1 + progress),
            ]}
            rotation={[i, i, 0]}
          >
            <sphereGeometry args={[0.12, 6, 5]} />
            <meshStandardMaterial
              color="#799b8c"
              transparent
              opacity={Math.max(0, 0.5 - progress * 0.1)}
            />
          </mesh>
        ))}
      </group>
    );
  return (
    <group
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh geometry={capsule}>
        <meshPhysicalMaterial
          color={color}
          roughness={0.5}
          metalness={0.02}
          bumpMap={surfaceTexture}
          bumpScale={0.045}
          transparent
          opacity={inside ? 0.19 : 1}
          depthWrite={!inside}
          clearcoat={0.18}
        />
      </mesh>
      <Instances
        items={bumps}
        color={compatible ? "#79aaa0" : "#c1b59d"}
        opacity={inside ? 0.2 : 1}
      />
      {(state === "lysogen" || inside) && (
        <group scale={0.45}>
          <Dna integrated={state === "lysogen" ? 1 : 0} onSelect={inert} />
        </group>
      )}
      {state === "infected" && inside && (
        <group>
          {Array.from(
            { length: Math.min(3, Math.max(1, Math.floor(progress / 2))) },
            (_, i) => (
              <group key={i} scale={0.18} position={[(i - 1) * 0.4, 0.1, 0]}>
                {progress < 6 ? (
                  <Dna viral onSelect={inert} />
                ) : (
                  <MicroPhage scale={0.6} position={[0, -1.2, 0]} />
                )}
              </group>
            ),
          )}
        </group>
      )}
      <group position={[0, 0, 0.74]} rotation={[Math.PI / 2, 0, 0]}>
        {Array.from({ length: compatible ? 3 : 4 }, (_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i * Math.PI * 2) / (compatible ? 3 : 4)) * 0.11,
              0,
              Math.sin((i * Math.PI * 2) / (compatible ? 3 : 4)) * 0.11,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.09, 0.025, 6, 12]} />
            <meshStandardMaterial
              color={compatible ? "#e8dfb2" : "#736955"}
              roughness={0.55}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
export function Medium({ extent = 22 }: { extent?: number }) {
  const { theme } = useTheme();
  const particles = useMemo(() => {
    const p = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      p[i * 3] = (random(i + 600) - 0.5) * extent;
      p[i * 3 + 1] = random(i + 900) * 8 - 2;
      p[i * 3 + 2] = (random(i + 1200) - 0.5) * extent;
    }
    return p;
  }, [extent]);
  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={theme === "light" ? "#819d8b" : "#718b7c"}
          size={0.035}
          transparent
          opacity={0.48}
          sizeAttenuation
        />
      </points>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color={theme === "light" ? "#d4dfcf" : "#132b2c"}
          roughness={1}
        />
      </mesh>
    </>
  );
}
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="game-render-error">
        <h3>The 3D view could not start.</h3>
        <p>
          Try reloading with WebGL enabled, or use a browser with hardware
          acceleration.
        </p>
        <button onClick={() => location.reload()}>Reload application</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function GameStage({
  children,
  preview = false,
  position = [8, 7, 12],
  orbit = false,
}: {
  children: ReactNode;
  preview?: boolean;
  position?: [number, number, number];
  orbit?: boolean;
}) {
  const { theme } = useTheme();
  const mobile = useMobileLayout();
  const [pixelRatio, PixelRatio] = useState(window.innerWidth < 700 ? 1 : 1.45);
  const backdrop = theme === "light" ? "#e0e7db" : "#0c2024";
  return (
    <Boundary>
      <Canvas
        dpr={[1, pixelRatio]}
        frameloop={preview ? "demand" : "always"}
        camera={{ position, fov: mobile ? 56 : 42, near: 0.1, far: 120 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        fallback={
          <div className="game-render-error">
            This experience needs WebGL. Enable hardware acceleration and
            reload.
          </div>
        }
      >
        <color attach="background" args={[backdrop]} />
        <fog attach="fog" args={[backdrop, 24, 65]} />
        <ambientLight intensity={theme === "light" ? 1.1 : 0.5} />
        <PerformanceMonitor
          onDecline={() => PixelRatio(1)}
          onFallback={() => PixelRatio(1)}
          flipflops={2}
        />
        <directionalLight
          position={[-5, 10, 7]}
          intensity={3.1}
          color="#fff4de"
        />
        <directionalLight
          position={[6, 4, -8]}
          intensity={1.6}
          color="#aac6bb"
        />
        <Suspense fallback={null}>
          <Environment resolution={64}>
            <Lightformer
              position={[0, 6, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[12, 12, 1]}
              intensity={2}
            />
            <Lightformer
              position={[-6, 2, 3]}
              rotation={[0, Math.PI / 2, 0]}
              scale={[6, 8, 1]}
              intensity={1}
            />
          </Environment>
        </Suspense>
        {children}
        {orbit && (
          <OrbitControls
            makeDefault
            enableDamping
            minDistance={3}
            maxDistance={35}
            maxPolarAngle={Math.PI * 0.48}
            target={[0, 0, 0]}
          />
        )}
      </Canvas>
    </Boundary>
  );
}
export function Preview({ kind }: { kind: number }) {
  return (
    <GameStage preview position={kind === 2 ? [11, 12, 13] : [5, 3.5, 8]}>
      <Medium />
      {kind === 0 ? (
        <>
          <Bacterium scale={1.4} position={[0, 0, -1]} />
          <MicroPhage
            scale={0.65}
            position={[0, 0.2, 1.3]}
            rotation={[Math.PI / 2, 0, -0.1]}
          />
        </>
      ) : kind === 1 ? (
        <>
          <Bacterium scale={1.8} inside />
          <group scale={1.1}>
            <Dna integrated={0.7} onSelect={inert} />
          </group>
          <Line
            points={[
              [-2, 1, 0],
              [-1, 1.4, 0],
              [0, 1.1, 0],
              [1, 1.3, 0],
            ]}
            color="#9b69ac"
            lineWidth={3}
          />
        </>
      ) : (
        <>
          {Array.from({ length: 12 }, (_, i) => (
            <Bacterium
              key={i}
              scale={0.6}
              position={[((i % 4) - 1.5) * 3, 0, (Math.floor(i / 4) - 1) * 3]}
              compatible={i % 3 !== 0}
              state={i % 4 === 0 ? "lysogen" : "healthy"}
            />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <MicroPhage
              key={i}
              scale={0.23}
              position={[((i % 4) - 1.5) * 2, 1, ((i % 3) - 1) * 2]}
            />
          ))}
        </>
      )}
    </GameStage>
  );
}
