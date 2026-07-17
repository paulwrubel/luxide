import { useMemo } from 'react';
import { createParallelogramGeometry } from '@/utils/three';
import type { GeometricParallelogram } from '@/utils/render/geometric';

export type ParallelogramBufferGeometryProps = {
  data: GeometricParallelogram;
};

export function ParallelogramBufferGeometry(props: ParallelogramBufferGeometryProps) {
  const { data } = props;

  // memoize so bufferAttribute args stay referentially stable across
  // unrelated re-renders; changed args force R3F to reconstruct attributes
  const geom = useMemo(() => createParallelogramGeometry(data), [data]);

  return (
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[geom.vertices, 3]} />
      <bufferAttribute attach="attributes-normal" args={[geom.normals, 3]} />
      <bufferAttribute attach="attributes-uv" args={[geom.uvs, 2]} />
      <bufferAttribute attach="index" args={[geom.indices, 1]} />
    </bufferGeometry>
  );
}
