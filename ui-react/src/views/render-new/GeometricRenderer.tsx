import { getGeometricDataSafe } from '../../utils/render/geometric';
import { toRadians } from '../../utils/render/utils';
import { createParallelogramMesh, createTriangleMesh } from '../../utils/three';
import { MaterialResolver } from './MaterialResolver';
import type { RenderConfig } from '../../utils/render/config';

interface GeometricRendererProps {
  config: RenderConfig;
  name: string;
}

export function GeometricRenderer(props: GeometricRendererProps) {
  const { config, name } = props;

  const { data } = getGeometricDataSafe(config, name);

  switch (data.type) {
    case 'box': {
      const width = Math.abs(data.a[0] - data.b[0]);
      const height = Math.abs(data.a[1] - data.b[1]);
      const depth = Math.abs(data.a[2] - data.b[2]);
      const position: [number, number, number] = [
        (data.a[0] + data.b[0]) / 2,
        (data.a[1] + data.b[1]) / 2,
        (data.a[2] + data.b[2]) / 2,
      ];
      return (
        <mesh position={position} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <MaterialResolver config={config} materialRef={data.material} geometricName={name} />
        </mesh>
      );
    }

    case 'sphere':
      return (
        <mesh position={data.center} castShadow receiveShadow>
          <sphereGeometry args={[data.radius]} />
          <MaterialResolver config={config} materialRef={data.material} geometricName={name} />
        </mesh>
      );

    case 'list':
      return (
        <>
          {data.geometrics.map((subName: string) => (
            <GeometricRenderer key={subName} config={config} name={subName} />
          ))}
        </>
      );

    case 'rotate_x':
      return (
        <group rotation-x={toRadians(data)}>
          <GeometricRenderer config={config} name={data.geometric} />
        </group>
      );

    case 'rotate_y':
      return (
        <group rotation-y={toRadians(data)}>
          <GeometricRenderer config={config} name={data.geometric} />
        </group>
      );

    case 'rotate_z':
      return (
        <group rotation-z={toRadians(data)}>
          <GeometricRenderer config={config} name={data.geometric} />
        </group>
      );

    case 'translate':
      return (
        <group position={data.translation}>
          <GeometricRenderer config={config} name={data.geometric} />
        </group>
      );

    case 'parallelogram': {
      const mesh = createParallelogramMesh(data);
      return (
        <primitive object={mesh} castShadow receiveShadow>
          <MaterialResolver config={config} materialRef={data.material} geometricName={name} />
        </primitive>
      );
    }

    case 'triangle': {
      const mesh = createTriangleMesh(data);
      return (
        <primitive object={mesh} castShadow receiveShadow>
          <MaterialResolver config={config} materialRef={data.material} geometricName={name} />
        </primitive>
      );
    }

    case 'obj_model':
    case 'constant_volume':
      // TODO: not yet implemented
      return null;

    default:
      return null;
  }
}
