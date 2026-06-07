import { ControlsCard } from '../ControlsCard';
import { NestedGeometricHeader } from './NestedGeometricHeader';
import { AroundVariantControls } from './AroundVariantControls';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { getGeometricData, getGeometricDataSafe } from '@/utils/render/geometric';
import { fixReferences, renameGeometric } from '@/utils/render/utils';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { Separator } from '@/components/Separator';

function GeometricMaterialSelect({
  form,
  name,
  items,
}: {
  form: RenderForm;
  name: string;
  items: { name: string; value: string }[];
}) {
  return (
    <form.AppField name={`geometrics.${name}.material`}>
      {(field) => <field.SelectControl label="Material" items={items} />}
    </form.AppField>
  );
}

interface ControlsCardGeometricProps {
  form: RenderForm;
  geometricName: string;
}

export function ControlsCardGeometric(props: ControlsCardGeometricProps) {
  const { form, geometricName } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const { data: geometricData } = getGeometricDataSafe(renderConfig, geometricName);

  function handleRename(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === geometricName) {
      return;
    }

    const renamed = renameGeometric(renderConfig, geometricName, trimmed);

    form.setFieldValue('textures', renamed.textures);
    form.setFieldValue('materials', renamed.materials);
    form.setFieldValue('geometrics', renamed.geometrics);
    form.setFieldValue('scenes', renamed.scenes);
  }

  function handleDeleteGeometric(name: string) {
    const newGeometrics = { ...renderConfig.geometrics };
    delete newGeometrics[name];

    const newConfig: NormalizedRenderConfig = {
      ...renderConfig,
      geometrics: newGeometrics,
    };

    const fixed = fixReferences(newConfig);
    form.setFieldValue('geometrics', fixed.geometrics);
    form.setFieldValue('scenes', fixed.scenes);
    form.setFieldValue('materials', fixed.materials);
    form.setFieldValue('textures', fixed.textures);
  }

  // build material select items
  const materialItems = Object.keys(renderConfig.materials ?? {}).map((key) => ({
    name: key,
    value: key,
  }));

  // controls for a specific geometric type
  function renderControls(name: string): React.ReactNode {
    const { data } = getGeometricData(renderConfig, name);

    switch (data.type) {
      case 'box':
        return (
          <>
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.a`}
              label="Corner 1"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.b`}
              label="Corner 2"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          </>
        );
      case 'list':
        return (
          <>
            {data.geometrics.map((subName: string, i: number) => (
              <div key={subName}>
                {i > 0 && <Separator />}
                <NestedGeometricHeader geometricName={subName} renderConfig={renderConfig} />
                {renderControls(subName)}
              </div>
            ))}
          </>
        );
      case 'rotate_x':
      case 'rotate_y':
      case 'rotate_z': {
        const { geometric: embedddedGeometricName } = data;

        const hasDegrees = 'degrees' in data;
        return (
          <>
            <form.AppField name={`geometrics.${name}.${hasDegrees ? 'degrees' : 'radians'}`}>
              {(field) => (
                <field.RangeControl
                  label={hasDegrees ? 'Degrees of Rotation' : 'Radians of Rotation'}
                  min={0}
                  max={hasDegrees ? 360 : 2 * Math.PI}
                  step={hasDegrees ? 1.0 : 0.01}
                />
              )}
            </form.AppField>
            <AroundVariantControls
              form={form}
              geometricName={name}
              around={data.around}
            />
            <NestedGeometricHeader
              geometricName={embedddedGeometricName}
              renderConfig={renderConfig}
            />
            <Separator />
            {renderControls(embedddedGeometricName)}
          </>
        );
      }
      case 'translate': {
        const { geometric: embedddedGeometricName } = data;

        return (
          <>
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.translation`}
              label="Translation"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <NestedGeometricHeader
              geometricName={embedddedGeometricName}
              renderConfig={renderConfig}
            />
            <Separator />
            {renderControls(embedddedGeometricName)}
          </>
        );
      }
      case 'parallelogram':
        return (
          <>
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.lower_left`}
              label="Lower Left"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.u`}
              valueLabels={['x', 'y', 'z']}
              type="number"
              label={
                <>
                  <em>u</em> Vector
                </>
              }
            />
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.v`}
              valueLabels={['x', 'y', 'z']}
              type="number"
              label={
                <>
                  <em>v</em> Vector
                </>
              }
            />
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          </>
        );
      case 'sphere':
        return (
          <>
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.center`}
              label="Center"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextInputControl
              form={form}
              fieldName={`geometrics.${name}.radius`}
              label="Radius"
              valueLabel="radius"
              type="number"
            />
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          </>
        );
      case 'triangle':
        return (
          <>
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.a`}
              label="Point A"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.b`}
              label="Point B"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.c`}
              label="Point C"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          </>
        );
      case 'constant_volume': {
        const { geometric: embedddedGeometricName } = data;

        return (
          <>
            <form.AppField name={`geometrics.${name}.density`}>
              {(field) => <field.RangeControl label="Density" min={0} max={1} step={0.01} />}
            </form.AppField>
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
            <NestedGeometricHeader
              geometricName={embedddedGeometricName}
              renderConfig={renderConfig}
            />
            <Separator />
            {renderControls(embedddedGeometricName)}
          </>
        );
      }
      default:
        return (
          <h6 className="text-sm">Unknown or unimplemented geometric: {data.type} (sorry!)</h6>
        );
    }
  }

  return (
    <ControlsCard
      leftLabel={geometricName}
      onRename={handleRename}
      rightLabel={geometricData.type}
      rightLabelStyle="light"
      onDelete={() => handleDeleteGeometric(geometricName)}
    >
      <div className="flex w-full flex-col gap-2 p-4">{renderControls(geometricName)}</div>
    </ControlsCard>
  );
}
