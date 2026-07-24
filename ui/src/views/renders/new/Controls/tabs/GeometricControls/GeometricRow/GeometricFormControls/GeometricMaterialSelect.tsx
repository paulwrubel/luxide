import type { RenderForm } from '@/hooks/useRenderForm';

export type GeometricMaterialSelectProps = {
  form: RenderForm;
  name: string;
  items: { label: string; value: string }[];
  tooltip?: React.ReactNode;
};

export function GeometricMaterialSelect(props: GeometricMaterialSelectProps) {
  const { form, name, items, tooltip } = props;

  return (
    <form.AppField name={`geometrics.${name}.material`}>
      {(field) => <field.SelectControl label="Material" items={items} tooltip={tooltip} />}
    </form.AppField>
  );
}
