import { useMemo } from 'react';
import { Tabs, TabItem } from 'flowbite-react';
import { CameraControlsCard } from './CameraControlsCard';
import { ParametersControlsCard } from './ParametersControlsCard';
import { GeometricControlsCard } from './GeometricControlsCard';
import { MaterialControlsCard } from './MaterialControlsCard';
import { TextureControlsCard } from './TextureControlsCard';
import { NewGeometricSpeedDial } from './NewGeometricSpeedDial';
import { NewMaterialSpeedDial } from './NewMaterialSpeedDial';
import { NewTextureSpeedDial } from './NewTextureSpeedDial';
import { getSceneData } from '../../../utils/render/scene';
import {
  removeDefaults,
  getTopLevelMaterialNames,
  getTopLevelTextureNames,
} from '../../../utils/render/utils';
import type { RenderForm } from '../../../hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';

interface ControlsProps {
  form: RenderForm;
}

export function Controls(props: ControlsProps) {
  const { form } = props;

  const renderConfig = useStore(form.store, (state) => state.values);

  const activeScene = useMemo(
    () => getSceneData(renderConfig, renderConfig.active_scene),
    [renderConfig],
  );

  const activeGeometricNames = useMemo(
    () => removeDefaults(activeScene.geometrics),
    [activeScene.geometrics],
  );

  const topLevelMaterialNames = useMemo(
    () => removeDefaults(getTopLevelMaterialNames(renderConfig)),
    [renderConfig],
  );

  const topLevelTextureNames = useMemo(
    () => removeDefaults(getTopLevelTextureNames(renderConfig)),
    [renderConfig],
  );

  return (
    <Tabs
      variant="pills"
      className="[&_[aria-selected=true]]:!bg-gray-800 [&_[aria-selected=true]]:!text-white [&_[role=tablist]]:flex-nowrap [&_[role=tabpanel]]:border-t [&_[role=tabpanel]]:border-zinc-600"
    >
      <TabItem title="Parameters">
        <div className="flex flex-col items-stretch gap-4 p-2">
          <ParametersControlsCard form={form} />
        </div>
      </TabItem>

      <TabItem title="Camera">
        <div className="flex flex-col items-stretch gap-4 p-2">
          <CameraControlsCard form={form} camera={activeScene.camera} />
        </div>
      </TabItem>

      <TabItem title="Geometrics">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {activeGeometricNames.map((geoName) => (
            <GeometricControlsCard key={geoName} form={form} geometricName={geoName} />
          ))}
          <div className="flex w-full justify-end">
            <NewGeometricSpeedDial form={form} />
          </div>
        </div>
      </TabItem>

      <TabItem title="Materials">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {topLevelMaterialNames.map((matName) => (
            <MaterialControlsCard key={matName} form={form} materialName={matName} />
          ))}
          <div className="flex w-full justify-end">
            <NewMaterialSpeedDial form={form} />
          </div>
        </div>
      </TabItem>

      <TabItem title="Textures">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {topLevelTextureNames.map((texName) => (
            <TextureControlsCard key={texName} form={form} textureName={texName} />
          ))}
          <div className="flex w-full justify-end">
            <NewTextureSpeedDial form={form} />
          </div>
        </div>
      </TabItem>
    </Tabs>
  );
}
