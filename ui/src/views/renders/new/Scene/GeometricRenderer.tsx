import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import {
  getAroundPoint,
  getCenterPoint,
  getGeometricDataSafe,
  assertExhaustive,
} from '@/utils/render/geometric';
import { toRadians } from '@/utils/render/utils';
import { ParallelogramBufferGeometry } from './ParallelogramBufferGeometry';
import { TriangleBufferGeometry } from './TriangleBufferGeometry';
import { BilinearPatchBufferGeometry } from './BilinearPatchBufferGeometry';
import { MaterialResolver } from './MaterialResolver';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import { getMaterialDataSafe } from '@/utils/render/material';
import { getTextureDataSafe } from '@/utils/render/texture';
import { useGizmo } from '@/providers/Gizmo';

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

  const { activeGizmos, onQuaternionChange } = useGizmo();

  const { data } = getGeometricDataSafe(config, name);

  // only used in the rotate_quaternion case — harmless for other types
  const quatGroupRef = useRef<THREE.Group>(null);

  const handleQuaternionObjectChange = useCallback(() => {
    if (!quatGroupRef.current) {
      return;
    }
    const q = quatGroupRef.current.quaternion;
    onQuaternionChange(name, [q.w, q.x, q.y, q.z]);
  }, [name, onQuaternionChange]);

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

    case 'rotate_quaternion': {
      const [w, x, y, z] = data.quaternion;
      const len = Math.hypot(w, x, y, z);
      const [nw, nx, ny, nz] = len > 0 ? [w / len, x / len, y / len, z / len] : [1, 0, 0, 0];
      const pivot = getAroundPoint(data.around, config, data.geometric);
      const isActive = activeGizmos.has(name);
      return (
        <group rotation={rotation}>
          <group position={pivot}>
            <group ref={quatGroupRef} quaternion={[nx, ny, nz, nw]}>
              <group position={[-pivot[0], -pivot[1], -pivot[2]]}>
                <GeometricRenderer config={config} name={data.geometric} />
              </group>
            </group>
          </group>
          {isActive && (
            <TransformControls
              object={quatGroupRef as React.RefObject<THREE.Object3D>}
              mode="rotate"
              onObjectChange={handleQuaternionObjectChange}
            />
          )}
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
      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh rotation={rotation} castShadow={!emissiveInfo} receiveShadow>
            <ParallelogramBufferGeometry data={data} />
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
      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh rotation={rotation} castShadow={!emissiveInfo} receiveShadow>
            <TriangleBufferGeometry data={data} />
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
        </group>
      );
    }

    case 'bilinear_patch': {
      const emissiveInfo = getEmissiveInfo(config, data.material);

      return (
        <>
          <mesh rotation={rotation} castShadow={!emissiveInfo} receiveShadow>
            <BilinearPatchBufferGeometry data={data} />
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

    case 'virtual':
      return <GeometricRenderer config={config} name={data.geometric} rotation={rotation} />;

    case 'obj_model':
    case 'constant_volume':
      // todo: not yet implemented
      return null;
  }
  assertExhaustive(data);
}
