import LabWorkbench from "./scenes/LabWorkbench";
import type { LabComponent } from "./data/labComponents";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  Line,
  Html,
} from "@react-three/drei";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { Cell, Phage, Dna, Selection, Asset } from "./scenes/Biology";
import { random, vector, tailPoint } from "./scenes/geometry";
import { lifecyclePose, ease, interval } from "./simulation/poses";
import type { Pathway } from "./simulation";

export type SceneProps = {
  theme: "light" | "dark";
  labComponent: LabComponent;
  labExplode: number;
  labProgress: number;
  time: number;
  path: Pathway;
  home: boolean;
  lab: boolean;
  view: string;
  camera: string;
  quality: string;
  selected: string;
  onSelect: (name: string) => void;
  reduced: boolean;
  intro: number;
  playing: boolean;
  labels: boolean;
  ambientPaused: boolean;
};

function FluidAtmosphere({
  reduced,
  active,
  low,
}: {
  reduced: boolean;
  active: boolean;
  low: boolean;
}) {
  const particles = useRef<THREE.Points>(null);
  const points = useMemo(() => {
    const data = new Float32Array((low ? 100 : 330) * 3);
    for (let i = 0; i < data.length; i += 3) {
      data[i] = (random(i + 300) - 0.5) * 30;
      data[i + 1] = (random(i + 700) - 0.5) * 22;
      data[i + 2] = (random(i + 800) - 0.5) * 24 - 5;
    }
    return data;
  }, [low]);
  useFrame((_, delta) => {
    if (particles.current && active && !reduced) {
      particles.current.rotation.y += delta * 0.004;
      particles.current.position.y =
        Math.sin(performance.now() * 0.00004) * 0.08;
    }
  });
  return (
    <group>
      <points ref={particles}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{ uColor: { value: new THREE.Color("#829778") } }}
          vertexShader={`varying float vDepth;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vDepth=-mv.z;gl_PointSize=clamp(28./max(1.,-mv.z),1.,5.);gl_Position=projectionMatrix*mv;}`}
          fragmentShader={`uniform vec3 uColor;varying float vDepth;void main(){float r=length(gl_PointCoord-.5);float a=(1.-smoothstep(.08,.5,r))*.3*(1.-smoothstep(6.,35.,vDepth));gl_FragColor=vec4(uColor,a);}`}
        />
      </points>
      {Array.from({ length: low ? 3 : 7 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (random(i + 40) - 0.3) * 22,
            (random(i + 70) - 0.5) * 10,
            -9 - random(i + 90) * 7,
          ]}
          rotation={[i, 0.2 * i, 0.5 * i]}
          scale={[0.8 + random(i + 200) * 1.6, 0.22, 0.25]}
        >
          <capsuleGeometry args={[1, 2.5, 6, 14]} />
          <meshStandardMaterial
            color="#849981"
            roughness={0.95}
            transparent
            opacity={0.16}
          />
        </mesh>
      ))}
    </group>
  );
}

function GenomeDelivery({
  progress,
  onSelect,
}: {
  progress: number;
  onSelect: (name: string) => void;
}) {
  const points = useMemo(() => {
    const path = Array.from({ length: 65 }, (_, i) =>
      tailPoint(1 - i / 64)
        .multiplyScalar(0.7)
        .add(vector(-0.62, 1.24, 0.22)),
    );
    const end = [
      vector(-0.62, 1.29, 0.22),
      vector(-0.63, 0.95, 0.19),
      vector(-0.35, 0.55, 0.15),
      vector(0.3, 0.25, 0.28),
      vector(0.7, 0.2, 0),
    ];
    return [
      vector(-0.62, 3.91, 0.22),
      ...path,
      ...new THREE.CatmullRomCurve3(end).getPoints(50),
    ];
  }, []);
  const start = Math.floor(progress * 36),
    end = Math.max(start + 2, Math.floor(progress * points.length));
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect("Viral genome");
      }}
    >
      <Line points={points.slice(start, end)} color="#efbd93" lineWidth={2.5} />
      {Array.from({ length: 7 }, (_, i) => {
        const index = Math.min(
          points.length - 1,
          Math.floor(((progress * 0.9 + i * 0.035) % 1) * points.length),
        );
        return (
          <mesh key={i} position={points[index]} scale={0.021}>
            <sphereGeometry args={[1, 6, 5]} />
            <meshBasicMaterial color="#ffe2b3" />
          </mesh>
        );
      })}
    </group>
  );
}

function Progeny({
  time,
  lysis,
  onSelect,
  low,
}: {
  time: number;
  lysis: number;
  onSelect: (name: string) => void;
  low: boolean;
}) {
  return (
    <group>
      {Array.from({ length: low ? 8 : 15 }, (_, i) => {
        const assembly = interval(time, 60 + i * 0.22, 67 + i * 0.22),
          release = interval(lysis, i * 0.018, 0.6 + i * 0.02);
        const x = (random(i + 30) - 0.5) * 3.8,
          y = (random(i + 70) - 0.5) * 0.92,
          z = (random(i + 120) - 0.5) * 1.05;
        const direction = vector(
            x * 0.7 + 0.4,
            (random(i + 270) - 0.35) * 3,
            (random(i + 320) - 0.3) * 3,
          ),
          p = vector(x, y, z).addScaledVector(direction, release * 2);
        return (
          <Phage
            key={i}
            position={[p.x, p.y, p.z]}
            rotation={[
              random(i + 100) * 1.4 + release * 0.4,
              random(i + 150) * 6,
              random(i + 190) * 2 - 0.5,
            ]}
            scale={0.125}
            assembly={assembly}
            open={assembly < 0.94}
            pack={interval(assembly, 0.1, 0.8)}
            onSelect={onSelect}
            detail={false}
          />
        );
      })}
    </group>
  );
}

function World(props: SceneProps) {
  const pose = lifecyclePose(props.time, props.path),
    low = props.quality === "Performance";
  const cut = props.lab
    ? ["Cutaway", "DNA focus"].includes(props.view)
    : !props.home && pose.stage >= 2;
  const transparent =
      props.lab && ["Transparent", "DNA focus"].includes(props.view),
    inspection = props.lab && props.view === "Phage structure";
  const approach = props.home ? ease(props.intro) * 0.65 : pose.approach;
  const phagePosition: [number, number, number] = inspection
    ? [0, 0.3, 1.8]
    : [
        -0.62 + (1 - approach) * 1.25,
        1.24 + (1 - approach) * 1.9,
        0.22 + (1 - approach) * 0.35,
      ];
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (root.current && props.home && !props.reduced && !props.ambientPaused) {
      root.current.position.y =
        -0.45 + Math.sin(clock.elapsedTime * 0.23) * 0.045;
      root.current.rotation.y =
        -0.35 + Math.sin(clock.elapsedTime * 0.09) * 0.025;
    }
  });
  return (
    <Selection.Provider value={props.selected}>
      <fog
        attach="fog"
        args={[props.theme === "light" ? "#e0e7db" : "#09191d", 13, 38]}
      />
      <ambientLight
        intensity={props.theme === "light" ? 0.8 : 0.36}
        color="#8fa8ac"
      />
      <directionalLight position={[-3, 7, 6]} intensity={3.4} color="#d2e4df" />
      <directionalLight position={[4, 1, -5]} intensity={3.2} color="#6fabb5" />
      <pointLight
        position={[-4, -1, 4]}
        intensity={13}
        color="#ce936c"
        distance={18}
        decay={2}
      />
      <Environment resolution={128}>
        <Lightformer
          position={[1, 6, 0]}
          scale={[7, 3, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          intensity={2.6}
          color="#c4e5e0"
        />
        <Lightformer
          position={[-5, 0, 3]}
          scale={[3, 6, 1]}
          intensity={1.3}
          color="#e5af88"
        />
        <Lightformer
          position={[4, 2, -5]}
          scale={[6, 5, 1]}
          intensity={3}
          color="#6395a6"
        />
      </Environment>
      <FluidAtmosphere
        reduced={props.reduced}
        active={(props.home && !props.ambientPaused) || props.playing}
        low={low}
      />
      {props.lab ? (
        <LabWorkbench
          component={props.labComponent}
          explode={props.labExplode}
          progress={props.labProgress}
          view={props.view}
          quality={props.quality}
          onSelect={props.onSelect}
          labels={props.labels}
        />
      ) : (
        <group
          ref={root}
          position={props.home ? [2, -0.45, 0] : [0.8, -0.25, 0]}
          rotation={props.home ? [0.07, -0.35, -0.22] : [0, -0.2, -0.06]}
        >
          {!inspection && (
            <Cell
              cut={cut}
              transparent={transparent}
              lysis={props.lab ? 0 : pose.lysis}
              integration={pose.integration}
              division={props.lab ? 0 : pose.division}
              quality={props.quality}
              onSelect={props.onSelect}
            />
          )}
          <Phage
            position={phagePosition}
            scale={inspection ? 0.97 : 0.7}
            rotation={[0, 0, inspection ? -0.15 : (1 - approach) * -0.12]}
            attached={pose.attachment}
            open={inspection || pose.stage === 2}
            pack={pose.stage === 2 ? 1 - pose.injection : 1}
            onSelect={props.onSelect}
            detail={!low}
          />
          {!props.home && !props.lab && pose.stage === 2 && (
            <GenomeDelivery
              progress={pose.injection}
              onSelect={props.onSelect}
            />
          )}
          {!props.home && !inspection && pose.stage >= 2 && pose.stage < 5 && (
            <group
              position={[0.65 * (1 - pose.integration), 0.1, 0]}
              scale={Math.max(
                0.001,
                pose.circularization * (1 - pose.integration),
              )}
            >
              <Dna viral onSelect={props.onSelect} />
            </group>
          )}
          {!props.home &&
            !props.lab &&
            props.path === "lytic" &&
            pose.stage === 4 &&
            Array.from({ length: 5 }, (_, i) => (
              <group
                key={i}
                position={[(i - 2) * 0.7, ((i % 2) - 0.5) * 0.5, 0.15]}
                scale={
                  interval(pose.replication, i * 0.1, 0.45 + i * 0.1) * 0.45
                }
              >
                <Dna viral onSelect={props.onSelect} />
              </group>
            ))}
          {!props.home &&
            !props.lab &&
            props.path === "lytic" &&
            pose.stage >= 5 && (
              <Progeny
                time={props.time}
                lysis={pose.lysis}
                onSelect={props.onSelect}
                low={low}
              />
            )}
          {props.labels && !props.home && (
            <>
              <Html
                position={
                  inspection
                    ? [0.65, 4.1, 1.8]
                    : [
                        phagePosition[0] + 0.65,
                        phagePosition[1] + 2.55,
                        phagePosition[2],
                      ]
                }
                distanceFactor={10}
                center
              >
                <button
                  className="world-label"
                  onClick={() => props.onSelect("Capsid")}
                >
                  <span />
                  PROTEIN CAPSID
                </button>
              </Html>
              {!inspection && (
                <Html position={[2.3, -1.35, 0.5]} distanceFactor={10} center>
                  <button
                    className="world-label warm"
                    onClick={() =>
                      props.onSelect(
                        cut ? "Bacterial chromosome" : "Cell envelope",
                      )
                    }
                  >
                    <span />
                    {cut ? "HOST CHROMOSOME" : "CELL ENVELOPE"}
                  </button>
                </Html>
              )}
            </>
          )}
        </group>
      )}
      <CameraDirector {...props} />
      {props.camera === "Explore" && (
        <OrbitControls
          makeDefault
          target={
            props.lab ? [0.8, 0.6, 0] : inspection ? [0, 2, 1.8] : [0.8, 0.7, 0]
          }
          minDistance={3}
          maxDistance={19}
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.6}
          zoomSpeed={0.7}
        />
      )}
    </Selection.Provider>
  );
}

type Shot = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};
const wide: Shot = { position: [7, 4, 12], target: [0.9, 1, 0], fov: 39 };
const shots: Shot[] = [
  wide,
  { position: [2.9, 3.5, 6.4], target: [0.4, 1.75, 0.1], fov: 35 },
  { position: [2.2, 2.3, 5.5], target: [0.3, 1.05, 0.15], fov: 35 },
  wide,
  { position: [3.2, 2.8, 7], target: [1, 0.2, 0], fov: 37 },
  { position: [3.2, 2.5, 7.5], target: [1, 0.3, 0], fov: 38 },
  { position: [6, 4, 12], target: [1, 0.5, 0], fov: 42 },
];
function CameraDirector(props: SceneProps) {
  const { camera, invalidate, size } = useThree(),
    target = useRef(vector(0.8, 0.7, 0));
  useEffect(
    () => invalidate(),
    [
      props.time,
      props.camera,
      props.view,
      props.selected,
      props.home,
      props.intro,
      props.labels,
      props.labComponent,
      props.labExplode,
      props.labProgress,
      invalidate,
    ],
  );
  useFrame((_, delta) => {
    if (props.camera === "Explore") return;
    const pose = lifecyclePose(props.time, props.path),
      shot = shots[pose.stage];
    const position = vector(...shot.position),
      destination = vector(...shot.target);
    let fov = shot.fov;
    if (props.home) {
      position.set(
        7.2 - props.intro * 0.7,
        4.1 - props.intro * 0.6,
        15 - props.intro * 2,
      );
      destination.set(0.8, 1.15, 0);
      fov = 38;
    }
    if (props.lab) {
      position.set(6, 3.8, 10);
      destination.set(0.8, 0.7, 0);
      fov = 39;
      if (props.view === "Phage structure") {
        position.set(2.6, 3.4, 8);
        destination.set(0.7, 2.5, 1.8);
        fov = 36;
      }
      if (props.view === "DNA focus") {
        position.set(2.1, 1.8, 5.8);
        destination.set(0.8, 0.1, 0);
        fov = 37;
      }
    }
    if (props.lab && props.labComponent !== "Whole specimen") {
      position.set(4, 3, 8);
      destination.set(0.8, 0.6, 0);
      fov = 39;
    }
    if (!props.lab && props.selected === "LamB receptor") {
      position.set(1.2, 2.3, 3.7);
      destination.set(0.25, 1.15, 0.2);
      fov = 32;
    }
    if (props.path === "lysogenic" && pose.stage >= 5 && !props.lab) {
      position.set(6.5, 3.8, 11);
      destination.set(0.9, 0.2, 0);
    }
    if (size.width / size.height < 1) {
      position.z += props.home ? 4 : 3;
      destination.x = props.home ? 1.8 : 0.8;
      fov += 6;
    }
    const alpha = props.reduced
      ? 1
      : 1 - Math.exp(-Math.min(delta, 0.05) * 2.6);
    camera.position.lerp(position, alpha);
    target.current.lerp(destination, alpha);
    camera.lookAt(target.current);
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, fov, alpha);
    perspective.updateProjectionMatrix();
    if (
      camera.position.distanceTo(position) > 0.003 ||
      target.current.distanceTo(destination) > 0.003 ||
      Math.abs(perspective.fov - fov) > 0.01
    )
      invalidate();
  });
  return null;
}

class SceneBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="webgl-error">
        <strong>The microscope needs WebGL.</strong>
        <p>
          Your browser could not initialize the 3D view. Stage explanations and
          learning activities remain available.
        </p>
        <button onClick={() => this.setState({ error: false })}>
          Try the renderer again
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Scene(props: SceneProps) {
  const [asset, setAsset] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/model-config.json", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((config) => {
        const url = config?.lambda;
        if (
          typeof url === "string" &&
          url.startsWith("/") &&
          !url.startsWith("//") &&
          url.endsWith(".glb")
        )
          setAsset(url);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const autoLow =
      props.quality === "Auto" &&
      (window.innerWidth < 760 || navigator.hardwareConcurrency <= 4),
    quality = autoLow ? "Performance" : props.quality;
  const dpr =
    quality === "High"
      ? Math.min(2, window.devicePixelRatio)
      : quality === "Performance"
        ? 1
        : 1.45;
  return (
    <SceneBoundary>
      <Canvas
        frameloop={
          (props.home && !props.reduced && !props.ambientPaused) ||
          props.playing
            ? "always"
            : "demand"
        }
        dpr={[1, dpr]}
        camera={{ position: [7, 4, 13], fov: 39, near: 0.12, far: 70 }}
        gl={{
          antialias: quality !== "Performance",
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(props.theme === "light" ? "#e0e7db" : "#09191d", 0);
          gl.localClippingEnabled = true;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
        }}
        fallback={
          <div className="webgl-error">
            WebGL is unavailable. The learning activities still work.
          </div>
        }
      >
        <Suspense fallback={null}>
          <Asset.Provider value={asset}>
            <World {...props} quality={quality} />
          </Asset.Provider>
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
}
