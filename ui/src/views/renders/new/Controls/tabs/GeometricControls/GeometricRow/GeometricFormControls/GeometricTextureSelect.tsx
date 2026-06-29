import type { RenderForm } from '@/hooks/useRenderForm';

export type GeometricTextureSelectProps = {
  form: RenderForm;
  name: string;
  items: { label: string; value: string }[];
};

export function GeometricTextureSelect(props: GeometricTextureSelectProps) {
  const { form, name, items } = props;

  return (
    <form.AppField name={`geometrics.${name}.reflectance_texture`}>
      {(field) => <field.SelectControl label="Reflectance Texture" items={items} />}
    </form.AppField>
  );
}
