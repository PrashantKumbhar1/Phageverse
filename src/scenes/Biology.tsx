import {
  useMemo,
  useLayoutEffect,
  useRef,
  useContext,
  createContext,
  useEffect,
} from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import OptionalPhage from "../OptionalPhage";
import { ease, interval } from "../simulation/poses";
import {
  random,
  vector,
  tailPoint,
  tube,
  helixPoints,
  chromosomePoint,
  membraneTexture,
  type Instance,
} from "./geometry";

export const Selection = createContext("");
export const Asset = createContext<string | null>(null);
const beadGeometry = new THREE.IcosahedronGeometry(1, 1);
const ringGeometry = new THREE.TorusGeometry(1, 0.21, 5, 12);
const yAxis = vector(0, 1, 0),
  zAxis = vector(0, 0, 1);
type Select = (name: string) => void;

export function Instances({
  items,
  geometry = beadGeometry,
  color,
  opacity = 1,
  roughness = 0.6,
}: {
  items: Instance[];
  geometry?: THREE.BufferGeometry;
  color: string;
  opacity?: number;
  roughness?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.08 }),
    [],
  );
  useEffect(() => {
    material.color.set(color);
    material.roughness = roughness;
    const changed = material.transparent !== opacity < 1;
    material.transparent = opacity < 1;
    material.opacity = opacity;
    material.depthWrite = opacity > 0.4;
    if (changed) material.needsUpdate = true;
  }, [material, color, roughness, opacity]);
  useEffect(() => () => material.dispose(), [material]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D();
    items.forEach((item, i) => {
      object.position.copy(item.position);
      object.scale.copy(item.scale);
      object.quaternion.copy(item.quaternion || new THREE.Quaternion());
      object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix);
      if (item.color) ref.current!.setColorAt(i, new THREE.Color(item.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      material={material}
      dispose={null}
    ></instancedMesh>
  );
}

export function Dna({
  viral = false,
  integrated = 0,
  opacity = 1,
  onSelect,
  replicated = 0,
}: {
  viral?: boolean;
  integrated?: number;
  opacity?: number;
  onSelect: Select;
  replicated?: number;
}) {
  const selected = useContext(Selection);
  const strands = useMemo(() => helixPoints(viral), [viral]);
  const bonds = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => [
        strands[0][i * 6],
        strands[1][i * 6],
      ]).flat(),
    [strands],
  );
  const integratedPoints = useMemo(
    () => Array.from({ length: 70 }, (_, i) => chromosomePoint(0.09 + i / 299)),
    [],
  );
  const highlight =
    selected === (viral ? "Viral genome" : "Bacterial chromosome");
  const segment = integratedPoints.slice(
    0,
    Math.max(2, Math.floor(integrated * 70)),
  );
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect(viral ? "Viral genome" : "Bacterial chromosome");
      }}
    >
      {[0, ...(replicated > 0.01 ? [1] : [])].map((copy) => (
        <group
          key={copy}
          position={[
            0,
            copy ? replicated * 0.33 : 0,
            copy ? replicated * 0.24 : 0,
          ]}
        >
          {strands.map((points, i) => (
            <Line
              key={i}
              points={points}
              color={
                highlight
                  ? "#f4e6be"
                  : viral
                    ? "#d4a1ee"
                    : i
                      ? "#86d4b5"
                      : "#58a990"
              }
              lineWidth={viral ? 2.1 : 1.8}
              transparent
              opacity={opacity}
            />
          ))}
          <Line
            segments
            points={bonds}
            color={viral ? "#b784cf" : "#61ae94"}
            lineWidth={0.8}
            transparent
            opacity={opacity * 0.7}
          />
          {integrated > 0.01 && (
            <Line
              points={segment}
              color={selected === "Prophage" ? "#ffe8be" : "#e7a4f2"}
              lineWidth={5}
              transparent
              opacity={opacity}
              onClick={(e) => {
                e.stopPropagation();
                onSelect("Prophage");
              }}
            />
          )}
        </group>
      ))}
    </group>
  );
}

function PackedGenome({
  amount = 1,
  onSelect,
}: {
  amount?: number;
  onSelect: Select;
}) {
  const points = useMemo(
    () =>
      Array.from({ length: 520 }, (_, i) => {
        const t = i / 519,
          y = (t - 0.5) * 0.93,
          r = Math.sqrt(Math.max(0.01, 0.255 - y * y)) * 0.96;
        const a = t * Math.PI * 2 * 23;
        return vector(Math.cos(a) * r, y, Math.sin(a) * r);
      }),
    [],
  );
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect("Viral genome");
      }}
    >
      <Line
        points={points.slice(
          0,
          Math.max(2, Math.floor(points.length * amount)),
        )}
        color="#d4a1ee"
        lineWidth={1.8}
      />
    </group>
  );
}

export function Phage({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  open = false,
  pack = 1,
  assembly = 1,
  attached = 0,
  onSelect,
  detail = true,
  isolate,
  explode = 0,
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  open?: boolean;
  pack?: number;
  assembly?: number;
  attached?: number;
  onSelect: Select;
  detail?: boolean;
  isolate?: "capsid" | "tail" | "tip" | "portal";
  explode?: number;
}) {
  const selected = useContext(Selection),
    asset = useContext(Asset);
  const capDetail = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.63, detail ? 4 : 2);
    const p = geo.getAttribute("position");
    const items: Instance[] = [];
    for (let i = 0; i < p.count; i += 3) {
      const center = vector()
        .add(vector().fromBufferAttribute(p, i))
        .add(vector().fromBufferAttribute(p, i + 1))
        .add(vector().fromBufferAttribute(p, i + 2))
        .multiplyScalar(1 / 3);
      const normal = center.clone().normalize();
      items.push({
        position: center.clone().multiplyScalar(1.015 + explode * 0.65),
        scale: vector(0.026, 0.026, 0.018),
        quaternion: new THREE.Quaternion().setFromUnitVectors(zAxis, normal),
        color: random(i) > 0.3 ? "#ffd2a0" : "#c77d43",
      });
    }
    geo.dispose();
    return items;
  }, [detail, explode]);
  const rings = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => {
        const t = i / 31,
          point = tailPoint(t).add(vector(0, (t - 0.5) * explode * 1.5, 0)),
          tangent = tailPoint(Math.min(1, t + 0.01))
            .sub(tailPoint(Math.max(0, t - 0.01)))
            .normalize();
        return {
          position: point,
          scale: vector(0.072, 0.072, 0.07),
          quaternion: new THREE.Quaternion().setFromUnitVectors(zAxis, tangent),
        };
      }),
    [explode],
  );
  const proteins = useMemo(
    () =>
      Array.from({ length: 32 * 6 }, (_, i) => {
        const row = Math.floor(i / 6),
          a = ((i % 6) * Math.PI) / 3 + row * 0.13,
          center = tailPoint(row / 31).add(
            vector(0, (row / 31 - 0.5) * explode * 1.5, 0),
          );
        return {
          position: center.add(
            vector(Math.cos(a) * 0.078, 0, Math.sin(a) * 0.078),
          ),
          scale: vector(0.029, 0.034, 0.029),
        };
      }),
    [explode],
  );
  const tailGeo = useMemo(
    () =>
      tube(
        Array.from({ length: 65 }, (_, i) => tailPoint(i / 64)),
        0.04,
        70,
        8,
      ),
    [],
  );
  useEffect(() => () => tailGeo.dispose(), [tailGeo]);
  const headShift = (1 - ease(assembly)) * 0.6,
    tailShift = (1 - ease(assembly)) * -0.35;
  const headColor = selected === "Capsid" ? "#e6d7b0" : "#e9a15d";
  const procedural = (
    <group>
      <group
        position={[0, 3.82 + headShift, 0]}
        visible={!isolate || isolate === "capsid"}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("Capsid");
        }}
      >
        <mesh>
          <icosahedronGeometry args={[0.625, 1]} />
          <meshPhysicalMaterial
            color={headColor}
            metalness={0.13}
            roughness={0.47}
            clearcoat={0.12}
            transparent
            opacity={open ? 0.16 : 1}
            depthWrite={!open}
            flatShading
            side={THREE.DoubleSide}
          />
        </mesh>
        {!open && (
          <mesh scale={1.002}>
            <icosahedronGeometry args={[0.625, 1]} />
            <meshBasicMaterial
              color="#84502c"
              wireframe
              transparent
              opacity={0.3}
            />
          </mesh>
        )}
        <Instances
          items={capDetail}
          color={selected === "Capsid" ? "#ecd7a9" : "#f0ba78"}
          opacity={open ? 0.22 : 1}
        />
        {open && pack > 0.001 && (
          <PackedGenome amount={pack} onSelect={onSelect} />
        )}
      </group>
      <group
        position={[0, tailShift, 0]}
        visible={!isolate || isolate === "tail" || isolate === "portal"}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("Tail");
        }}
      >
        <group visible={isolate !== "portal"}>
          <mesh geometry={tailGeo}>
            <meshStandardMaterial color="#ac6c3d" roughness={0.55} />
          </mesh>
          <Instances
            items={rings}
            geometry={ringGeometry}
            color={selected === "Tail" ? "#ead3a0" : "#dfb270"}
            roughness={0.45}
          />
          {detail && (
            <Instances
              items={proteins}
              color={selected === "Tail" ? "#ead3a0" : "#ffcc8c"}
            />
          )}
        </group>
        <group position={[0, 3.13, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              position={[0, i * (0.055 + explode * 0.12), 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <torusGeometry args={[0.115 - i * 0.016, 0.027, 6, 16]} />
              <meshStandardMaterial
                color="#e9ae68"
                metalness={0.2}
                roughness={0.4}
              />
            </mesh>
          ))}
        </group>
      </group>
      <group
        visible={!isolate || isolate === "tip"}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("Tail tip");
        }}
      >
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh
                position={[0.075, 0.59, 0]}
                rotation={[0, 0, -0.17 - attached * 0.2]}
              >
                <capsuleGeometry args={[0.045, 0.26, 4, 7]} />
                <meshStandardMaterial
                  color={selected === "Tail tip" ? "#f0d0a0" : "#e5a16a"}
                  roughness={0.55}
                />
              </mesh>
              <Line
                points={[
                  [0.075, 0.45, 0],
                  [0.035 + attached * 0.06, 0.23, 0],
                  [attached * 0.12, 0.06, 0],
                ]}
                color="#f0bd83"
                lineWidth={detail ? 3 : 1.5}
              />
            </group>
          );
        })}
        <mesh
          position={[0, 0.045, 0]}
          scale={[0.075 + attached * 0.05, 0.045, 0.075 + attached * 0.05]}
        >
          <sphereGeometry args={[1, 10, 6]} />
          <meshStandardMaterial color="#f1bb83" roughness={0.55} />
        </mesh>
      </group>
    </group>
  );
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {asset && !open && assembly === 1 && !isolate && explode === 0 ? (
        <group position={[0, 1.7, 0]} scale={1.55}>
          <OptionalPhage
            url={asset}
            fallback={
              <group position={[0, -1.7 / 1.55, 0]} scale={1 / 1.55}>
                {procedural}
              </group>
            }
            onSelect={onSelect}
          />
        </group>
      ) : (
        procedural
      )}
    </group>
  );
}

function CellSurface({
  geometry,
  texture,
  inner = false,
  cut = false,
  transparent = false,
  lysis = 0,
  selected = false,
}: {
  geometry: THREE.BufferGeometry;
  texture: THREE.Texture;
  inner?: boolean;
  cut?: boolean;
  transparent?: boolean;
  lysis?: number;
  selected?: boolean;
}) {
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: inner ? "#238582" : "#338f95",
      roughness: inner ? 0.7 : 0.53,
      metalness: 0.04,
      clearcoat: 0.08,
      bumpMap: texture,
      bumpScale: inner ? 0.018 : 0.055,
      transparent: true,
      opacity: transparent ? (inner ? 0.05 : 0.14) : 1,
      side: THREE.DoubleSide,
      depthWrite: !transparent,
    });
    m.userData.uniforms = {
      uCut: { value: cut ? 1 : 0 },
      uLysis: { value: lysis },
    };
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uCut = m.userData.uniforms.uCut;
      shader.uniforms.uLysis = m.userData.uniforms.uLysis;
      shader.vertexShader =
        "varying vec3 vCellPosition;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvCellPosition = position;",
      );
      shader.fragmentShader =
        "varying vec3 vCellPosition;\nuniform float uCut;\nuniform float uLysis;\n" +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
      if(uCut > .5 && vCellPosition.z > .04 && vCellPosition.y > -.48) discard;
      float tear = length((vCellPosition - vec3(1.1,.18,.7)) * vec3(.72,1.,.8));
      float irregular = sin(vCellPosition.x*17.0+vCellPosition.y*9.0)*.05 + sin(vCellPosition.z*24.0)*.04;
      if(uLysis > .001 && tear + irregular < uLysis*6.5) discard;
    `,
      );
      m.userData.shader = shader;
    };
    m.customProgramCacheKey = () => `cell-surface-v2-${inner}`;
    return m;
  }, [texture, inner]);
  useEffect(() => {
    material.opacity = transparent ? (inner ? 0.05 : 0.14) : 1;
    material.depthWrite = !transparent;
    material.color.set(selected ? "#b7b890" : inner ? "#238582" : "#338f95");
    material.userData.uniforms.uCut.value = cut ? 1 : 0;
    material.userData.uniforms.uLysis.value = lysis;
  }, [material, cut, lysis, transparent, selected, inner]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh geometry={geometry} material={material} scale={inner ? 0.953 : 1} />
  );
}

function Receptors({ onSelect }: { onSelect: Select }) {
  const receptors = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const x = (random(i + 70) - 0.5) * 3.1,
          a = random(i + 10) * Math.PI * 2;
        return {
          position: vector(x, Math.cos(a) * 1.18, Math.sin(a) * 1.18),
          quaternion: new THREE.Quaternion().setFromUnitVectors(
            yAxis,
            vector(0, Math.cos(a), Math.sin(a)),
          ),
          scale: vector(0.065, 0.1, 0.065),
        };
      }),
    [],
  );
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect("LamB receptor");
      }}
    >
      <Instances items={receptors} color="#6fcabd" />
      <group position={[-0.62, 1.19, 0.22]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[
              Math.cos(i * 2.094) * 0.08,
              0.025,
              Math.sin(i * 2.094) * 0.08,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.045, 0.017, 6, 12]} />
            <meshStandardMaterial color="#b4f1db" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Cell({
  cut,
  transparent = false,
  lysis = 0,
  division = 0,
  integration = 0,
  quality,
  onSelect,
}: {
  cut: boolean;
  transparent?: boolean;
  lysis?: number;
  division?: number;
  integration?: number;
  quality: string;
  onSelect: Select;
}) {
  const selected = useContext(Selection);
  const texture = useMemo(() => membraneTexture(), []);
  const geometry = useMemo(() => {
    const g = new THREE.CapsuleGeometry(
      1.18,
      3.35,
      14,
      quality === "Performance" ? 32 : 72,
    );
    g.rotateZ(Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const n =
        1 +
        0.012 * Math.sin(x * 8 + y * 7) * Math.cos(z * 11) +
        0.006 * Math.sin(x * 21 - z * 12);
      p.setXYZ(i, x, y * n, z * n);
    }
    g.computeVertexNormals();
    return g;
  }, [quality]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  const lip = useMemo(() => {
    const pts = [];
    const floor = Math.asin(-0.48 / 1.18);
    for (let i = 0; i <= 60; i++) {
      const a = floor + ((Math.PI / 2 - floor) * i) / 60;
      pts.push(vector(1.675 + Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0.045));
    }
    for (let i = 0; i <= 60; i++) {
      const a = Math.PI / 2 + ((Math.PI - floor - Math.PI / 2) * i) / 60;
      pts.push(vector(-1.675 + Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0.045));
    }
    return pts;
  }, []);
  const details = useMemo(
    () =>
      Array.from({ length: quality === "Performance" ? 230 : 1100 }, (_, i) => {
        const x = (random(i + 1) - 0.5) * 5.45,
          a = random(i + 900) * Math.PI * 2,
          r =
            Math.abs(x) > 1.675
              ? Math.sqrt(
                  Math.max(0.01, 1.18 ** 2 - (Math.abs(x) - 1.675) ** 2),
                )
              : 1.18;
        return {
          position: vector(x, Math.cos(a) * r, Math.sin(a) * r),
          scale: vector(0.015 + random(i + 200) * 0.025, 0.025, 0.025),
        };
      }),
    [quality],
  );
  const visibleDetails = useMemo(
    () =>
      details.filter(
        (b) =>
          (!cut || b.position.z <= 0.04 || b.position.y <= -0.48) &&
          (!lysis || b.position.distanceTo(vector(1.1, 0.18, 0.7)) > lysis * 7),
      ),
    [details, cut, lysis],
  );
  const ribosomes = useMemo(
    () =>
      Array.from({ length: 85 }, (_, i) => ({
        position: vector(
          (random(i + 300) - 0.5) * 4.6,
          (random(i + 700) - 0.5) * 1.5,
          (random(i + 800) - 0.5) * 1.3,
        ),
        scale: vector(0.034 + random(i + 200) * 0.028, 0.035, 0.045),
        color: i % 4 ? "#acb39b" : "#c8ad89",
      })),
    [],
  );
  const pili = useMemo(
    () =>
      Array.from({ length: quality === "Performance" ? 14 : 32 }, (_, i) => {
        const x = (random(i + 40) - 0.5) * 4.5,
          a = random(i + 140) * Math.PI * 2,
          r = 1.18;
        return Array.from({ length: 12 }, (_, j) => {
          const t = j / 11;
          return vector(
            x + Math.sin(t * 2 + i) * t * 0.3,
            Math.cos(a) * (r + t * 0.36),
            Math.sin(a) * (r + t * 0.36),
          );
        });
      }),
    [quality],
  );
  const centerScale = 1 - division * 0.5;
  const debris = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        position: vector(
          (random(i + 20) - 0.5) * 4,
          (random(i + 50) - 0.5) * 2,
          (random(i + 90) - 0.5) * 2,
        ).multiplyScalar(1 + lysis * 2),
        scale: vector(0.1, 0.045, 0.07),
        quaternion: new THREE.Quaternion().setFromEuler(
          new THREE.Euler(i, lysis * 3, i * 0.4),
        ),
      })),
    [lysis],
  );
  return (
    <group>
      <group scale={[centerScale, 1, 1]} position={[-division * 1.48, 0, 0]}>
        <group
          onClick={(e) => {
            e.stopPropagation();
            onSelect("Cell envelope");
          }}
        >
          <CellSurface
            geometry={geometry}
            texture={texture}
            cut={cut}
            transparent={transparent}
            lysis={lysis}
            selected={selected === "Cell envelope"}
          />
          <CellSurface
            geometry={geometry}
            texture={texture}
            inner
            cut={cut}
            transparent={transparent}
            lysis={lysis}
          />
          {!transparent && (
            <Instances
              items={visibleDetails}
              color="#5dafaa"
              opacity={1 - lysis * 0.8}
            />
          )}
          {!cut &&
            lysis < 0.1 &&
            pili.map((points, i) => (
              <Line
                key={i}
                points={points}
                color="#74b8b4"
                lineWidth={0.7}
                transparent
                opacity={0.55}
              />
            ))}
        </group>
        <group visible={lysis < 0.6}>
          <Receptors onSelect={onSelect} />
        </group>
        {(cut || transparent) && (
          <group>
            <mesh scale={[2.7, 0.98, 0.88]}>
              <sphereGeometry args={[1, 32, 20]} />
              <meshStandardMaterial
                color="#296978"
                transparent
                opacity={0.055 * (1 - lysis)}
                depthWrite={false}
              />
            </mesh>
            {cut && !transparent && lysis < 0.1 && (
              <Line
                points={lip}
                color="#c6b493"
                lineWidth={1.1}
                transparent
                opacity={0.32}
              />
            )}
            <group scale={0.95}>
              <Dna
                integrated={integration}
                opacity={1 - lysis}
                onSelect={onSelect}
                replicated={
                  interval(division, 0.05, 0.45) *
                  (1 - interval(division, 0.65, 0.95))
                }
              />
            </group>
            <Instances items={ribosomes} color="#b9b69d" opacity={1 - lysis} />
          </group>
        )}
      </group>
      {division > 0.001 && (
        <group
          position={[1.48 * division, 0, 0]}
          scale={[division * 0.5, division, division]}
        >
          <CellSurface
            geometry={geometry}
            texture={texture}
            cut={cut}
            transparent={transparent}
          />
          <CellSurface
            geometry={geometry}
            texture={texture}
            inner
            cut={cut}
            transparent={transparent}
          />
          {(cut || transparent) && (
            <Dna integrated={integration} onSelect={onSelect} />
          )}
        </group>
      )}
      {lysis > 0.01 && (
        <Instances
          items={debris}
          color="#4eacaf"
          opacity={Math.max(0, 1 - lysis)}
        />
      )}
    </group>
  );
}
