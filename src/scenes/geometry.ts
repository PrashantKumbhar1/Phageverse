import * as THREE from "three";

export const random = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
export type Instance = {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  quaternion?: THREE.Quaternion;
  color?: string;
};
export const vector = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function membraneTexture() {
  const size = 256,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n =
        Math.sin(x * 0.43 + Math.sin(y * 0.2) * 2) * Math.cos(y * 0.39) +
        Math.sin(x * 1.7 + y * 0.83) * 0.3;
      const value = Math.round(132 + n * 25 + random(x + y * size) * 20);
      const i = (x + y * size) * 4;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 3);
  texture.needsUpdate = true;
  return texture;
}
export function tube(
  points: THREE.Vector3[],
  radius: number,
  segments = 100,
  sides = 7,
) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    segments,
    radius,
    sides,
    false,
  );
}
export function tailPoint(t: number, bend = 0.17) {
  return vector(
    Math.sin(t * Math.PI) * bend,
    0.7 + t * 2.45,
    Math.sin(t * Math.PI * 1.2) * bend * 0.3,
  );
}
export function chromosomePoint(t: number, copy = 0) {
  const a = t * Math.PI * 2;
  return vector(
    Math.cos(a) * 1.96 + Math.sin(a * 5) * 0.12,
    Math.sin(a * 3) * 0.28 + copy,
    Math.sin(a) * 0.55 + Math.cos(a * 4) * 0.1,
  );
}
export function helixPoints(viral = false) {
  return [0, 1].map((side) =>
    Array.from({ length: 300 }, (_, i) => {
      const t = i / 299,
        center = chromosomePoint(t);
      if (viral) center.multiplyScalar(0.34);
      const a = t * Math.PI * (viral ? 32 : 82) + side * Math.PI;
      return center.add(vector(0, Math.cos(a) * 0.055, Math.sin(a) * 0.055));
    }),
  );
}
