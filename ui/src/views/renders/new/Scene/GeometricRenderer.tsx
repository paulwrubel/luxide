import * as THREE from 'three';
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

    case 'scale': {
      const pivot = getAroundPoint(data.around, config, data.geometric);
      return (
        <group rotation={rotation}>
          <group position={pivot}>
            <group scale={[data.scale[0], data.scale[1], data.scale[2]]}>
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
              <bufferAttribute attach="attributes-uv" args={[geom.uvs, 2]} />
              <bufferAttribute attach="index" args={[geom.indices, 1]} />
            </bufferGeometry>
            <MaterialResolver
              config={config}
              materialName={data.material}
              side={data.is_culled ? THREE.FrontSide : THREE.DoubleSide}
              shadowSide={data.is_culled ? undefined : THREE.BackSide}
            />
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

    case 'disk': {
      const innerRadius = data.inner_radius ?? 0;

      // orient the disk using the normal
      const normalVec = new THREE.Vector3(
        data.normal[0],
        data.normal[1],
        data.normal[2],
      ).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalVec);
      const rot = new THREE.Euler().setFromQuaternion(quat);

      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh
            position={[data.center[0], data.center[1], data.center[2]]}
            rotation={[rot.x, rot.y, rot.z]}
            castShadow={!emissiveInfo}
            receiveShadow
          >
            <ringGeometry args={[innerRadius, data.radius, 64]} />
            <MaterialResolver
              config={config}
              materialName={data.material}
              side={data.is_culled ? THREE.FrontSide : THREE.DoubleSide}
              shadowSide={data.is_culled ? undefined : THREE.BackSide}
            />
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

    case 'cylinder': {
      const aVec = new THREE.Vector3(data.a[0], data.a[1], data.a[2]);
      const bVec = new THREE.Vector3(data.b[0], data.b[1], data.b[2]);
      const axis = bVec.clone().sub(aVec).normalize();
      const height = aVec.distanceTo(bVec);
      const aInfinite = data.a_end === 'infinite';
      const bInfinite = data.b_end === 'infinite';

      let displayHeight: number;
      let center: THREE.Vector3;

      const infiniteProxyLength = 10_000;

      if (aInfinite && bInfinite) {
        // both infinite — center at midpoint, large proxy height
        displayHeight = infiniteProxyLength;
        center = aVec.clone().add(bVec).multiplyScalar(0.5);
      } else if (aInfinite) {
        // a is infinite, b is finite — extend from b toward a
        displayHeight = infiniteProxyLength;
        center = bVec.clone().addScaledVector(axis, -displayHeight / 2);
      } else if (bInfinite) {
        // b is infinite, a is finite — extend from a toward b
        displayHeight = infiniteProxyLength;
        center = aVec.clone().addScaledVector(axis, displayHeight / 2);
      } else {
        // both finite — use actual height and midpoint
        displayHeight = height;
        center = aVec.clone().add(bVec).multiplyScalar(0.5);
      }

      const isInfinite = aInfinite || bInfinite;

      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
      const rot = new THREE.Euler().setFromQuaternion(quat);

      // three.js CylinderGeometry uses a single openEnded boolean for both ends,
      // so the preview approximates: if either end isn't capped, both lack caps.
      const openEnded = data.a_end !== 'capped' || data.b_end !== 'capped';

      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh
            position={[center.x, center.y, center.z]}
            rotation={[rot.x, rot.y, rot.z]}
            frustumCulled={!isInfinite}
            castShadow={!emissiveInfo}
            receiveShadow
          >
            <cylinderGeometry args={[data.radius, data.radius, displayHeight, 64, 1, openEnded]} />
            <MaterialResolver
              config={config}
              materialName={data.material}
              side={THREE.DoubleSide}
              shadowSide={THREE.BackSide}
            />
          </mesh>
          {emissiveInfo && (
            <pointLight
              color={emissiveInfo.color}
              intensity={emissiveInfo.intensity}
              position={[center.x, center.y, center.z]}
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
              <bufferAttribute attach="attributes-uv" args={[geom.uvs, 2]} />
              <bufferAttribute attach="index" args={[geom.indices, 1]} />
            </bufferGeometry>
            <MaterialResolver
              config={config}
              materialName={data.material}
              side={data.is_culled ? THREE.FrontSide : THREE.DoubleSide}
              shadowSide={data.is_culled ? undefined : THREE.BackSide}
            />
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

    case 'plane': {
      const normalVec = new THREE.Vector3(
        data.normal[0],
        data.normal[1],
        data.normal[2],
      ).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalVec);
      const rot = new THREE.Euler().setFromQuaternion(quat);

      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <group rotation={rotation}>
          <mesh
            position={[data.point[0], data.point[1], data.point[2]]}
            rotation={[rot.x, rot.y, rot.z]}
            frustumCulled={false}
            castShadow={!emissiveInfo}
            receiveShadow
          >
            <planeGeometry args={[1_000, 1_000]} />
            <MaterialResolver
              config={config}
              materialName={data.material}
              side={data.is_culled ? THREE.FrontSide : THREE.DoubleSide}
              shadowSide={data.is_culled ? undefined : THREE.BackSide}
            />
          </mesh>
          {emissiveInfo && (
            <pointLight
              color={emissiveInfo.color}
              intensity={emissiveInfo.intensity}
              position={getCenterPoint(config, data)}
              castShadow
            />
          )}
        </group>
      );
    }

    case 'bilinear_patch': {
      const emissiveInfo = getEmissiveInfo(config, data.material);

      // build subdivided bilinear patch mesh (8x8 grid)
      const divs = 8;
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      const uvs: number[] = [];

      // helper: evaluate bilinear patch P(u,v)
      const evalPatch = (u: number, v: number): [number, number, number] => {
        const w00 = (1 - u) * (1 - v);
        const w10 = u * (1 - v);
        const w01 = (1 - u) * v;
        const w11 = u * v;
        return [
          w00 * data.p00[0] + w10 * data.p10[0] + w01 * data.p01[0] + w11 * data.p11[0],
          w00 * data.p00[1] + w10 * data.p10[1] + w01 * data.p01[1] + w11 * data.p11[1],
          w00 * data.p00[2] + w10 * data.p10[2] + w01 * data.p01[2] + w11 * data.p11[2],
        ];
      };

      // generate vertices and normals (divs+1 x divs+1 grid)
      for (let j = 0; j <= divs; j++) {
        const v = j / divs;
        for (let i = 0; i <= divs; i++) {
          const u = i / divs;
          positions.push(...evalPatch(u, v));

          // compute normal from partial derivatives
          const eps = 0.001;
          const du_u = Math.min(u + eps, 1.0);
          const dv_v = Math.min(v + eps, 1.0);
          const du = evalPatch(du_u, v);
          const dv = evalPatch(u, dv_v);
          const p = [
            positions[positions.length - 3],
            positions[positions.length - 2],
            positions[positions.length - 1],
          ];

          const dp_du = [du[0] - p[0], du[1] - p[1], du[2] - p[2]];
          const dp_dv = [dv[0] - p[0], dv[1] - p[1], dv[2] - p[2]];

          // cross product dp_du x dp_dv
          const nx = dp_du[1] * dp_dv[2] - dp_du[2] * dp_dv[1];
          const ny = dp_du[2] * dp_dv[0] - dp_du[0] * dp_dv[2];
          const nz = dp_du[0] * dp_dv[1] - dp_du[1] * dp_dv[0];
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          normals.push(nx / len, ny / len, nz / len);
          uvs.push(u, v);
        }
      }

      // generate triangle indices (two per grid cell)
      for (let j = 0; j < divs; j++) {
        for (let i = 0; i < divs; i++) {
          const a = j * (divs + 1) + i;
          const b = a + 1;
          const c = a + (divs + 1);
          const d = c + 1;
          indices.push(a, b, d);
          indices.push(a, d, c);
        }
      }

      return (
        <>
          <mesh rotation={rotation} castShadow={!emissiveInfo} receiveShadow>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(positions), 3]}
              />
              <bufferAttribute attach="attributes-normal" args={[new Float32Array(normals), 3]} />
              <bufferAttribute attach="attributes-uv" args={[new Float32Array(uvs), 2]} />
              <bufferAttribute attach="index" args={[new Uint16Array(indices), 1]} />
            </bufferGeometry>
            <MaterialResolver
              config={config}
              materialName={data.material}
              side={THREE.DoubleSide}
              shadowSide={THREE.BackSide}
            />
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
