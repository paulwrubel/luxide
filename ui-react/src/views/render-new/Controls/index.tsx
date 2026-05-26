import { useMemo } from 'react';
import { Tabs, TabItem, type TabsTheme } from 'flowbite-react';
import { ControlsCardCamera } from './cards/ControlsCardCamera';
import { ControlsCardParameters } from './cards/ControlsCardParameters';
import { ControlsCardGeometric } from './cards/ControlsCardGeometric';
import { ControlsCardMaterial } from './cards/ControlsCardMaterial';
import { ControlsCardTexture } from './cards/ControlsCardTexture';
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
import type { ThemingProps } from 'flowbite-react/types';

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

  const tabsTheme: ThemingProps<TabsTheme>['theme'] = {
    tablist: {
      variant: {
        pills: 'flex-nowrap space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400',
      },
      tabitem: {
        variant: {
          pills: {
            base: 'p-3',
            active: {
              on: 'rounded-lg bg-gray-800 text-white dark:bg-gray-800 dark:text-white',
            },
          },
        },
      },
    },
    tabpanel: 'border-t border-zinc-600 py-2',
  };

  return (
    <Tabs variant="pills" theme={tabsTheme}>
      <TabItem title="Parameters">
        <div className="flex flex-col items-stretch gap-4 p-2">
          <ControlsCardParameters form={form} />
        </div>
      </TabItem>

      <TabItem title="Camera">
        <div className="flex flex-col items-stretch gap-4 p-2">
          <ControlsCardCamera form={form} cameraName={activeScene.camera} />
        </div>
      </TabItem>

      <TabItem title="Geometrics">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {activeGeometricNames.map((geoName) => (
            <ControlsCardGeometric key={geoName} form={form} geometricName={geoName} />
          ))}
          <div className="flex w-full justify-end">
            <NewGeometricSpeedDial form={form} />
          </div>
        </div>
      </TabItem>

      <TabItem title="Materials">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {topLevelMaterialNames.map((matName) => (
            <ControlsCardMaterial key={matName} form={form} materialName={matName} />
          ))}
          <div className="flex w-full justify-end">
            <NewMaterialSpeedDial form={form} />
          </div>
        </div>
      </TabItem>

      <TabItem title="Textures">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {topLevelTextureNames.map((texName) => (
            <ControlsCardTexture key={texName} form={form} textureName={texName} />
          ))}
          <div className="flex w-full justify-end">
            <NewTextureSpeedDial form={form} />
          </div>
        </div>
      </TabItem>
    </Tabs>
  );
}
