import { ControlsCard } from '../ControlsCard';
import { NestedGeometricHeader } from './NestedGeometricHeader';
import { TextArrayInputControl } from '../form-controls/TextArrayInputControl';
import { TextInputControl } from '../form-controls/TextInputControl';
import { RangeControl } from '../form-controls/RangeControl';
import { SelectControl } from '../form-controls/SelectControl';
import { getGeometricData, getGeometricDataSafe } from '@/utils/render/geometric';
import { fixReferences } from '@/utils/render/utils';
import type { RenderConfig } from '@/utils/render/config';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';
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
    <SelectControl
      form={form}
      fieldName={`geometrics.${name}.material`}
      label="Material"
      items={items}
    />
  );
}

interface ControlsCardGeometricProps {
  form: RenderForm;
  geometricName: string;
}

export function ControlsCardGeometric(props: ControlsCardGeometricProps) {
  const { form, geometricName } = props;

  const renderConfig = useStore(form.store, (state) => state.values);

  const { data: geometricData } = getGeometricDataSafe(renderConfig, geometricName);

  function handleDeleteGeometric(name: string) {
    const newGeometrics = { ...renderConfig.geometrics };
    delete newGeometrics[name];

    const newConfig: RenderConfig = {
      ...renderConfig,
      geometrics: newGeometrics,
    };

    const fixed = fixReferences(newConfig);
    form.setFieldValue('geometrics', fixed.geometrics);
    form.setFieldValue('scenes', fixed.scenes);
    form.setFieldValue('materials', fixed.materials);
    form.setFieldValue('textures', fixed.textures);
  }

  // Build material select items
  const materialItems = Object.keys(renderConfig.materials ?? {}).map((key) => ({
    name: key,
    value: key,
  }));

  // Controls for a specific geometric type
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
        const rotateData = data;
        const hasDegrees = 'degrees' in rotateData;
        return (
          <>
            <RangeControl
              form={form}
              fieldName={`geometrics.${name}.${hasDegrees ? 'degrees' : 'radians'}`}
              label={hasDegrees ? 'Degrees of Rotation' : 'Radians of Rotation'}
              min={0}
              max={hasDegrees ? 360 : 2 * Math.PI}
              step={hasDegrees ? 1.0 : 0.01}
            />
            <NestedGeometricHeader
              geometricName={rotateData.geometric}
              renderConfig={renderConfig}
            />
            <Separator />
            {renderControls(rotateData.geometric)}
          </>
        );
      }
      case 'translate': {
        const transData = data;
        return (
          <>
            <NestedGeometricHeader
              geometricName={transData.geometric}
              renderConfig={renderConfig}
            />
            {renderControls(transData.geometric)}
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
              label="<em>u</em> Vector"
            />
            <TextArrayInputControl
              form={form}
              fieldName={`geometrics.${name}.v`}
              valueLabels={['x', 'y', 'z']}
              type="number"
              label="<em>v</em> Vector"
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
      default:
        return <h6 className="text-sm">Unknown or unimplemented geometric: {data.type}</h6>;
    }
  }

  return (
    <ControlsCard
      leftLabel={geometricName}
      rightLabel={geometricData.type}
      rightLabelStyle="light"
      onDelete={() => handleDeleteGeometric(geometricName)}
    >
      <div className="flex w-full flex-col gap-2 p-4">{renderControls(geometricName)}</div>
    </ControlsCard>
  );
}
