import { Dropdown, DropdownItem } from 'flowbite-react';
import {
  defaultTextureForType,
  type TextureData,
} from '../../utils/render/texture';
import { capitalize, getNextUniqueName } from '../../utils/render/utils';
import type { RenderConfig } from '../../utils/render/config';
import { useStore } from '@tanstack/react-form';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

type TextureType = Exclude<TextureData['type'], 'checker' | 'image'>;

interface NewTextureSpeedDialProps {
  form: any;
}

export default function NewTextureSpeedDial({ form }: NewTextureSpeedDialProps) {
  const formValues = useStore(form.store, (state: any) => state.values) as RenderConfig;

  function handleNewTexture(type: TextureType) {
    const newTexture = defaultTextureForType(type as any);
    const nextName = getNextUniqueName(
      formValues.textures ?? {},
      `New ${capitalize(type)}`
    );

    form.setFieldValue('textures', {
      ...formValues.textures,
      [nextName]: newTexture,
    });
  }

  return (
    <Dropdown
      label={<PlusIcon className="h-6 w-6" />}
      arrowIcon={false}
      color="light"
      size="sm"
    >
      <DropdownItem disabled>
        <div className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Checker Texture
        </div>
      </DropdownItem>
      <DropdownItem disabled>
        <div className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Image Texture
        </div>
      </DropdownItem>
      <DropdownItem onClick={() => handleNewTexture('color')}>
        <div className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Color Texture
        </div>
      </DropdownItem>
    </Dropdown>
  );
}
