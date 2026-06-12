import type { RenderForm } from '@/hooks/useRenderForm';

export type GeometricMaterialSelectProps = {
  form: RenderForm;
  name: string;
  items: { label: string; value: string }[];
};

export function GeometricMaterialSelect(props: GeometricMaterialSelectProps) {
  const { form, name, items } = props;

  return (
    <form.AppField name={`geometrics.${name}.material`}>
      {(field) => <field.SelectControl label="Material" items={items} />}
    </form.AppField>
  );
}
