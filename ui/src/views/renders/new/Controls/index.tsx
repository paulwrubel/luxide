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
                {
                  subtype: 'box',
                  label: 'Box',
                  description: 'Axis-aligned box defined by two opposite corners.',
                },
                {
                  subtype: 'sphere',
                  label: 'Sphere',
                  description: 'Sphere defined by center and radius.',
                },
                {
                  subtype: 'triangle',
                  label: 'Triangle',
                  description: 'Triangle defined by three vertices.',
                },
                {
                  subtype: 'parallelogram',
                  label: 'Parallelogram',
                  description: 'Parallelogram defined by origin and two edge vectors.',
                },
                {
                  subtype: 'obj_model',
                  label: 'OBJ Model',
                  description: 'Import a 3D model from an OBJ file.',
                  disabled: true,
                  disabledReason:
                    'OBJ model creation requires file upload support, which is not yet implemented in the UI.',
                },
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
                {
                  subtype: 'lambertian',
                  label: 'Lambertian Material',
                  description:
                    'Diffuse material that scatters light equally in all directions (ideal matte).',
                },
                {
                  subtype: 'specular',
                  label: 'Specular Material',
                  description: 'Glossy material with adjustable roughness for reflections.',
                },
                {
                  subtype: 'dielectric',
                  label: 'Dielectric Material',
                  description: 'Transparent material with refraction (glass, water).',
                  disabled: true,
                  disabledReason: 'Dielectric materials are not yet supported in the 3D preview.',
                },
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
              options={[
                {
                  subtype: 'color',
                  label: 'Color Texture',
                  description: 'Solid color defined by RGB values.',
                },
                {
                  subtype: 'checker',
                  label: 'Checker Texture',
                  description: 'Procedural checker pattern with two sub-textures.',
                  disabled: true,
                  disabledReason: 'Checker textures are not yet supported in the 3D preview.',
                },
                {
                  subtype: 'image',
                  label: 'Image Texture',
                  description: 'Load a texture from an image file.',
                  disabled: true,
                  disabledReason:
                    'Image texture creation requires file upload support, which is not yet implemented in the UI.',
                },
              ]}
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
