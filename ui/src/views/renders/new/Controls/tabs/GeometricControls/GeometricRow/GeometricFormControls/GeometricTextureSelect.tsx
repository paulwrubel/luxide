import type { RenderForm } from '@/hooks/useRenderForm';

export type GeometricTextureSelectProps = {
  form: RenderForm;
  name: string;
  items: { label: string; value: string }[];
  tooltip?: React.ReactNode;
};

export function GeometricTextureSelect(props: GeometricTextureSelectProps) {
  const { form, name, items, tooltip } = props;

  return (
    <form.AppField name={`geometrics.${name}.reflectance_texture`}>
      {(field) => (
        <field.SelectControl label="Reflectance Texture" items={items} tooltip={tooltip} />
      )}
    </form.AppField>
  );
}
