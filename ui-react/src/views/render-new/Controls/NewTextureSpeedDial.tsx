import { Dropdown, DropdownItem } from 'flowbite-react';
import { defaultTextureForType, type TextureData } from '@/utils/render/texture';
import { capitalize, getNextUniqueName } from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';
import { HiPlus } from 'react-icons/hi2';

type TextureType = Exclude<TextureData['type'], 'checker' | 'image'>;

interface NewTextureSpeedDialProps {
  form: RenderForm;
}

export function NewTextureSpeedDial(props: NewTextureSpeedDialProps) {
  const { form } = props;

  const formValues = useStore(form.store, (state) => state.values);

  function handleNewTexture(type: TextureType) {
    const newTexture = defaultTextureForType(type);
    const nextName = getNextUniqueName(formValues.textures ?? {}, `New ${capitalize(type)}`);

    form.setFieldValue('textures', {
      ...formValues.textures,
      [nextName]: newTexture,
    });
  }

  return (
    <Dropdown label={<HiPlus className="h-6 w-6" />} arrowIcon={false} color="light" size="sm">
      <DropdownItem disabled>
        <div className="flex items-center gap-2">
          <HiPlus className="h-4 w-4" />
          Checker Texture
        </div>
      </DropdownItem>
      <DropdownItem disabled>
        <div className="flex items-center gap-2">
          <HiPlus className="h-4 w-4" />
          Image Texture
        </div>
      </DropdownItem>
      <DropdownItem onClick={() => handleNewTexture('color')}>
        <div className="flex items-center gap-2">
          <HiPlus className="h-4 w-4" />
          Color Texture
        </div>
      </DropdownItem>
    </Dropdown>
  );
}
