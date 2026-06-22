import { getAroundPoint, getGeometricDataSafe } from '@/utils/render/geometric';
import { toRadians } from '@/utils/render/utils';
import { createParallelogramGeometry, createTriangleGeometry } from '@/utils/three';
import { MaterialResolver } from './MaterialResolver';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import { getMaterialDataSafe } from '@/utils/render/material';
import { getTextureDataSafe } from '@/utils/render/texture';
import { getCenterPoint } from '@/utils/render/geometric';

type EmissiveInfo = { color: [number, number, number]; intensity: number };

function getEmissiveInfo(
  config: NormalizedRenderConfig,
  materialRef: string,
): EmissiveInfo | undefined {
  const { data: matData } = getMaterialDataSafe(config, materialRef);
  const { data: emitTex } = getTextureDataSafe(config, matData.emittance_texture);

  if (emitTex.type !== 'color') {
    return undefined;
  }
  const sum = emitTex.color.reduce((a: number, b: number) => a + b, 0);
  if (sum <= 0) {
    return undefined;
  }

  return {
    color: emitTex.color,
    intensity: Math.max(...emitTex.color),
  };
}

export type GeometricRendererProps = {
  config: NormalizedRenderConfig;
  name: string;
  rotation?: [number, number, number];
};

export function GeometricRenderer(props: GeometricRendererProps) {
  const { config, name, rotation = [0, 0, 0] } = props;

  const { data } = getGeometricDataSafe(config, name);

  switch (data.type) {
    case 'box': {
      const width = Math.abs(data.a[0] - data.b[0]);
      const height = Math.abs(data.a[1] - data.b[1]);
      const depth = Math.abs(data.a[2] - data.b[2]);

      const center = getCenterPoint(config, data);

      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh position={center} rotation={rotation} castShadow={!emissiveInfo} receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <MaterialResolver config={config} materialName={data.material} />
          </mesh>
          {emissiveInfo && (
            <pointLight
              color={emissiveInfo.color}
              intensity={emissiveInfo.intensity}
              position={center}
              castShadow
            />
          )}
        </>
      );
    }

    case 'sphere': {
      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh position={data.center} rotation={rotation} castShadow={!emissiveInfo} receiveShadow>
            <sphereGeometry args={[data.radius]} />
            <MaterialResolver config={config} materialName={data.material} />
          </mesh>
          {emissiveInfo && (
            <pointLight
              color={emissiveInfo.color}
              intensity={emissiveInfo.intensity}
              position={getCenterPoint(config, data)}
              castShadow
            />
          )}
        </>
      );
    }

    case 'list':
      return (
        <>
          {data.geometrics.map((subName: string) => (
            <GeometricRenderer key={subName} config={config} name={subName} rotation={rotation} />
          ))}
        </>
      );

    case 'rotate_x': {
      const angleRad = toRadians(data);
      const pivot = getAroundPoint(data.around, config, data.geometric);
      return (
        <group rotation={rotation}>
          <group position={pivot}>
            <group rotation={[angleRad, 0, 0]}>
              <group position={[-pivot[0], -pivot[1], -pivot[2]]}>
                <GeometricRenderer config={config} name={data.geometric} />
              </group>
            </group>
          </group>
        </group>
      );
    }

    case 'rotate_y': {
      const angleRad = toRadians(data);
      const pivot = getAroundPoint(data.around, config, data.geometric);
      return (
        <group rotation={rotation}>
          <group position={pivot}>
            <group rotation={[0, angleRad, 0]}>
              <group position={[-pivot[0], -pivot[1], -pivot[2]]}>
                <GeometricRenderer config={config} name={data.geometric} />
              </group>
            </group>
          </group>
        </group>
      );
    }

    case 'rotate_z': {
      const angleRad = toRadians(data);
      const pivot = getAroundPoint(data.around, config, data.geometric);
      return (
        <group rotation={rotation}>
          <group position={pivot}>
            <group rotation={[0, 0, angleRad]}>
              <group position={[-pivot[0], -pivot[1], -pivot[2]]}>
                <GeometricRenderer config={config} name={data.geometric} />
              </group>
            </group>
          </group>
        </group>
      );
    }

    case 'translate':
      return (
        <group position={data.translation}>
          <GeometricRenderer config={config} name={data.geometric} rotation={rotation} />
        </group>
      );

    case 'parallelogram': {
      const geom = createParallelogramGeometry(data);

      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh rotation={rotation} castShadow={!emissiveInfo} receiveShadow>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[geom.vertices, 3]} />
              <bufferAttribute attach="attributes-normal" args={[geom.normals, 3]} />
              <bufferAttribute attach="index" args={[geom.indices, 1]} />
            </bufferGeometry>
            <MaterialResolver config={config} materialName={data.material} />
          </mesh>
          {emissiveInfo && (
            <pointLight
              color={emissiveInfo.color}
              intensity={emissiveInfo.intensity}
              position={getCenterPoint(config, data)}
              castShadow
            />
          )}
        </>
      );
    }

    case 'triangle': {
      const geom = createTriangleGeometry(data);

      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh rotation={rotation} castShadow={!emissiveInfo} receiveShadow>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[geom.vertices, 3]} />
              <bufferAttribute attach="attributes-normal" args={[geom.normals, 3]} />
              <bufferAttribute attach="index" args={[geom.indices, 1]} />
            </bufferGeometry>
            <MaterialResolver config={config} materialName={data.material} />
          </mesh>
          {emissiveInfo && (
            <pointLight
              color={emissiveInfo.color}
              intensity={emissiveInfo.intensity}
              position={getCenterPoint(config, data)}
              castShadow
            />
          )}
        </>
      );
    }

    case 'obj_model':
    case 'constant_volume':
      // todo: not yet implemented
      return null;

    default:
      return null;
  }
}
