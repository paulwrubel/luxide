import { useMemo } from 'react';
import { Tabs, TabItem, type TabsTheme } from 'flowbite-react';
import { ControlsCardCamera } from './cards/ControlsCardCamera';
import { ControlsCardParameters } from './cards/ControlsCardParameters';
import { ControlsCardGeometric } from './cards/ControlsCardGeometric';
import { ControlsCardMaterial } from './cards/ControlsCardMaterial';
import { ControlsCardTexture } from './cards/ControlsCardTexture';
import { AddEntityDropdown } from './AddEntityDropdown';
import { defaultGeometricForType, type GeometricData } from '@/utils/render/geometric';
import { defaultMaterialForType, type MaterialData } from '@/utils/render/material';
import { defaultTextureForType, type TextureData } from '@/utils/render/texture';
import { getSceneData } from '@/utils/render/scene';
import {
  removeDefaults,
  getTopLevelMaterialNames,
  getTopLevelTextureNames,
} from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import type { DeepPartial } from 'flowbite-react/types';

interface ControlsProps {
  form: RenderForm;
}

export function Controls(props: ControlsProps) {
  const { form } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

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

  const tabsTheme: DeepPartial<TabsTheme> = {
    tablist: {
      variant: {
        pills:
          'sticky top-0 z-10 bg-zinc-900 flex-nowrap space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400  py-2 border-b border-zinc-600',
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
    tabpanel: 'pt-0',
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
            <AddEntityDropdown
              form={form}
              options={[
                { subtype: 'box', label: 'Box' },
                { subtype: 'list', label: 'List' },
                { subtype: 'rotate_x', label: 'Instance | Rotate X' },
                { subtype: 'rotate_y', label: 'Instance | Rotate Y' },
                { subtype: 'rotate_z', label: 'Instance | Rotate Z' },
                { subtype: 'translate', label: 'Instance | Translate' },
                { subtype: 'parallelogram', label: 'Parallelogram' },
                { subtype: 'sphere', label: 'Sphere' },
                { subtype: 'triangle', label: 'Triangle' },
                { subtype: 'constant_volume', label: 'Constant Volume' },
              ]}
              type="geometrics"
              getDefault={(type) =>
                defaultGeometricForType(type as Exclude<GeometricData['type'], 'obj_model'>)
              }
              onCreated={(name) => {
                const activeSceneData = renderConfig.scenes?.[renderConfig.active_scene];
                if (!activeSceneData) return;
                const scenesPatch = {
                  ...renderConfig.scenes,
                  [renderConfig.active_scene]: {
                    ...activeSceneData,
                    geometrics: [...activeSceneData.geometrics, name],
                  },
                };
                form.setFieldValue('scenes', scenesPatch);
              }}
            />
          </div>
        </div>
      </TabItem>

      <TabItem title="Materials">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {topLevelMaterialNames.map((matName) => (
            <ControlsCardMaterial key={matName} form={form} materialName={matName} />
          ))}
          <div className="flex w-full justify-end">
            <AddEntityDropdown
              form={form}
              options={[
                { subtype: 'lambertian', label: 'Lambertian Material' },
                { subtype: 'specular', label: 'Specular Material' },
              ]}
              type="materials"
              getDefault={(type) => defaultMaterialForType(type as MaterialData['type'])}
            />
          </div>
        </div>
      </TabItem>

      <TabItem title="Textures">
        <div className="flex flex-col items-stretch gap-4 p-2">
          {topLevelTextureNames.map((texName) => (
            <ControlsCardTexture key={texName} form={form} textureName={texName} />
          ))}
          <div className="flex w-full justify-end">
            <AddEntityDropdown
              form={form}
              options={[{ subtype: 'color', label: 'Color Texture' }]}
              type="textures"
              getDefault={(type) =>
                defaultTextureForType(type as Exclude<TextureData['type'], 'image'>)
              }
            />
          </div>
        </div>
      </TabItem>
    </Tabs>
  );
}
