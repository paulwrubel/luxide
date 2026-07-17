import { useMemo } from 'react';
import { createBilinearPatchGeometry } from '@/utils/three';
import type { GeometricBilinearPatch } from '@/utils/render/geometric';

export type BilinearPatchBufferGeometryProps = {
  data: GeometricBilinearPatch;
};

export function BilinearPatchBufferGeometry(props: BilinearPatchBufferGeometryProps) {
  const { data } = props;

  // memoize so bufferAttribute args stay referentially stable across
  // unrelated re-renders; changed args force R3F to reconstruct attributes
  const geom = useMemo(() => createBilinearPatchGeometry(data), [data]);

  return (
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[geom.vertices, 3]} />
      <bufferAttribute attach="attributes-normal" args={[geom.normals, 3]} />
      <bufferAttribute attach="attributes-uv" args={[geom.uvs, 2]} />
      <bufferAttribute attach="index" args={[geom.indices, 1]} />
    </bufferGeometry>
  );
}
