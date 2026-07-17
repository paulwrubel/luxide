import { useMemo } from 'react';
import { createTriangleGeometry } from '@/utils/three';
import type { GeometricTriangle } from '@/utils/render/geometric';

export type TriangleBufferGeometryProps = {
  data: GeometricTriangle;
};

export function TriangleBufferGeometry(props: TriangleBufferGeometryProps) {
  const { data } = props;

  // memoize so bufferAttribute args stay referentially stable across
  // unrelated re-renders; changed args force R3F to reconstruct attributes
  const geom = useMemo(() => createTriangleGeometry(data), [data]);

  return (
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[geom.vertices, 3]} />
      <bufferAttribute attach="attributes-normal" args={[geom.normals, 3]} />
      <bufferAttribute attach="attributes-uv" args={[geom.uvs, 2]} />
      <bufferAttribute attach="index" args={[geom.indices, 1]} />
    </bufferGeometry>
  );
}
