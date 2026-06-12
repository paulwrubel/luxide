import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { Separator } from '@/components/Separator';
import { getGeometricData } from '@/utils/render/geometric';
import { AroundVariantControls } from './AroundVariantControls';
import { NestedGeometricHeader } from './NestedGeometricHeader';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { GeometricMaterialSelect } from './GeometricMaterialSelect';

export type GeometricRenderControlsProps = {
  form: RenderForm;
  name: string;
  showMaterialSelect?: boolean;
};

export function GeometricRenderControls(props: GeometricRenderControlsProps) {
  const { form, name, showMaterialSelect = true } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const { data } = getGeometricData(renderConfig, name);

  // build material select items
  const materialItems = Object.keys(renderConfig.materials ?? {}).map((key) => ({
    label: key,
    value: key,
  }));

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
          {showMaterialSelect && (
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          )}
        </>
      );
    case 'list':
      return (
        <>
          {data.geometrics.map((subName: string, i: number) => (
            <div key={subName}>
              {i > 0 && <Separator />}
              <NestedGeometricHeader geometricName={subName} renderConfig={renderConfig} />
              <GeometricRenderControls form={form} name={subName} showMaterialSelect={showMaterialSelect} />
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
          <AroundVariantControls form={form} geometricName={name} />
          <NestedGeometricHeader
            geometricName={embedddedGeometricName}
            renderConfig={renderConfig}
          />
          <Separator />
          <GeometricRenderControls form={form} name={embedddedGeometricName} showMaterialSelect={showMaterialSelect} />
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
          <GeometricRenderControls form={form} name={embedddedGeometricName} showMaterialSelect={showMaterialSelect} />
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
          {showMaterialSelect && (
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          )}
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
          {showMaterialSelect && (
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          )}
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
          {showMaterialSelect && (
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          )}
        </>
      );
    case 'constant_volume': {
      const { geometric: embedddedGeometricName } = data;

      return (
        <>
          <form.AppField name={`geometrics.${name}.density`}>
            {(field) => <field.RangeControl label="Density" min={0} max={1} step={0.01} />}
          </form.AppField>
          {showMaterialSelect && (
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          )}
          <NestedGeometricHeader
            geometricName={embedddedGeometricName}
            renderConfig={renderConfig}
          />
          <Separator />
          <GeometricRenderControls form={form} name={embedddedGeometricName} showMaterialSelect={showMaterialSelect} />
        </>
      );
    }
    case 'virtual': {
      const { geometric: embedddedGeometricName } = data;

      return (
        <>
          <NestedGeometricHeader
            geometricName={embedddedGeometricName}
            renderConfig={renderConfig}
          />
          <Separator />
          <GeometricRenderControls form={form} name={embedddedGeometricName} showMaterialSelect={false} />
        </>
      );
    }
    default:
      return <h6 className="text-sm">Unknown or unimplemented geometric: {data.type} (sorry!)</h6>;
  }
}
