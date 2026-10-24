import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
type Props = {
  url: string;
  fallback: ReactNode;
  onSelect: (name: string) => void;
};
class AssetBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function Imported({
  url,
  onSelect,
}: {
  url: string;
  onSelect: (name: string) => void;
}) {
  const { scene } = useGLTF(url);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.9 / Math.max(0.001, size.y);
    const group = new THREE.Group();
    clone.position.sub(center);
    group.add(clone);
    group.scale.setScalar(scale);
    group.position.y = 0.65;
    return group;
  }, [scene]);
  return (
    <primitive
      object={object}
      onClick={(e: { stopPropagation: () => void; object: THREE.Object3D }) => {
        e.stopPropagation();
        const names: Record<string, string> = {
          capsid: "Capsid",
          tail: "Tail",
          tail_tip: "Tail tip",
          viral_genome: "Viral genome",
        };
        const key = e.object.name.toLowerCase();
        onSelect(names[key] || "Capsid");
      }}
    />
  );
}
export default function OptionalPhage({ url, fallback, onSelect }: Props) {
  return (
    <AssetBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Imported url={url} onSelect={onSelect} />
      </Suspense>
    </AssetBoundary>
  );
}
