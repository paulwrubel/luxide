import { useMemo } from 'react';
import { Tabs } from 'flowbite-react';
import CameraControlsCard from './CameraControlsCard';
import ParametersControlsCard from './ParametersControlsCard';
import GeometricControlsCard from './GeometricControlsCard';
import MaterialControlsCard from './MaterialControlsCard';
import TextureControlsCard from './TextureControlsCard';
import NewGeometricSpeedDial from './NewGeometricSpeedDial';
import NewMaterialSpeedDial from './NewMaterialSpeedDial';
import NewTextureSpeedDial from './NewTextureSpeedDial';
import { getSceneData } from '../../utils/render/scene';
import {
  removeDefaults,
  getTopLevelMaterialNames,
  getTopLevelTextureNames,
} from '../../utils/render/utils';
import type { RenderConfig } from '../../utils/render/config';

interface ControlsProps {
  form: any; // TanStack Form instance
}

export default function Controls({ form }: ControlsProps) {
  const renderConfig = form.state.values as RenderConfig;

  const activeScene = useMemo(
    () => getSceneData(renderConfig, renderConfig.active_scene),
    [renderConfig]
  );

  const activeGeometricNames = useMemo(
    () => removeDefaults(activeScene.geometrics),
    [activeScene.geometrics]
  );

  const topLevelMaterialNames = useMemo(
    () => removeDefaults(getTopLevelMaterialNames(renderConfig)),
    [renderConfig]
  );

  const topLevelTextureNames = useMemo(
    () => removeDefaults(getTopLevelTextureNames(renderConfig)),
    [renderConfig]
  );

  return (
    <Tabs variant="pills" className="flex flex-col">
      <Tabs.Item title="Parameters">
        <div className="flex flex-col items-stretch gap-4 p-2">
          <ParametersControlsCard form={form} />
        </div>
      </Tabs.Item>

      <Tabs.Item title="Camera">
        <div className="flex flex-col items-stretch gap-4 p-2">
          <CameraControlsCard
            form={form}
            camera={activeScene.camera}
          />
        </div>
      </Tabs.Item>

      <Tabs.Item title="Geometrics">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {activeGeometricNames.map((geoName) => (
            <GeometricControlsCard
              key={geoName}
              form={form}
              geometricName={geoName}
            />
          ))}
          <div className="flex w-full justify-end">
            <NewGeometricSpeedDial form={form} />
          </div>
        </div>
      </Tabs.Item>

      <Tabs.Item title="Materials">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {topLevelMaterialNames.map((matName) => (
            <MaterialControlsCard
              key={matName}
              form={form}
              materialName={matName}
            />
          ))}
          <div className="flex w-full justify-end">
            <NewMaterialSpeedDial form={form} />
          </div>
        </div>
      </Tabs.Item>

      <Tabs.Item title="Textures">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {topLevelTextureNames.map((texName) => (
            <TextureControlsCard
              key={texName}
              form={form}
              textureName={texName}
            />
          ))}
          <div className="flex w-full justify-end">
            <NewTextureSpeedDial form={form} />
          </div>
        </div>
      </Tabs.Item>
    </Tabs>
  );
}
