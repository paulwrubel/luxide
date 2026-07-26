import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { getGeometricData, assertExhaustive } from '@/utils/render/geometric';
import { AroundVariantControls } from './AroundVariantControls';
import { GeometricMaterialSelect } from './GeometricMaterialSelect';
import { GeometricTextureSelect } from './GeometricTextureSelect';
import { ListControls } from './ListControls';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { ToggleSwitch } from 'flowbite-react';
import { useGizmo } from '@/providers/Gizmo';
import { RENDER_FIELD_COPY } from '@/data/renderFieldCopy';

export type GeometricFormControlsProps = {
  form: RenderForm;
  name: string;
};

export function GeometricFormControls(props: GeometricFormControlsProps) {
  const { form, name } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const { data } = getGeometricData(renderConfig, name);

  const { activeGizmos, toggleGizmo } = useGizmo();

  // build material select items
  const materialItems = Object.keys(renderConfig.materials ?? {}).map((key) => ({
    label: key,
    value: key,
  }));

  const textureItems = Object.keys(renderConfig.textures ?? {}).map((key) => ({
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
            tooltip={RENDER_FIELD_COPY.geometrics.box.corner1.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.b`}
            label="Corner 2"
            tooltip={RENDER_FIELD_COPY.geometrics.box.corner2.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <GeometricMaterialSelect
            form={form}
            name={name}
            items={materialItems}
            tooltip={RENDER_FIELD_COPY.geometrics._shared.material.description}
          />
        </>
      );
    case 'sphere':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.center`}
            label="Center"
            tooltip={RENDER_FIELD_COPY.geometrics.sphere.center.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextInputControl
            form={form}
            fieldName={`geometrics.${name}.radius`}
            label="Radius"
            tooltip={RENDER_FIELD_COPY.geometrics.sphere.radius.description}
            valueLabel="radius"
            type="number"
          />
          <GeometricMaterialSelect
            form={form}
            name={name}
            items={materialItems}
            tooltip={RENDER_FIELD_COPY.geometrics._shared.material.description}
          />
        </>
      );
    case 'triangle':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.a`}
            label="Point A"
            tooltip={RENDER_FIELD_COPY.geometrics.triangle.pointA.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.b`}
            label="Point B"
            tooltip={RENDER_FIELD_COPY.geometrics.triangle.pointB.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.c`}
            label="Point C"
            tooltip={RENDER_FIELD_COPY.geometrics.triangle.pointC.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <GeometricMaterialSelect
            form={form}
            name={name}
            items={materialItems}
            tooltip={RENDER_FIELD_COPY.geometrics._shared.material.description}
          />
        </>
      );
    case 'parallelogram':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.lower_left`}
            label="Lower Left"
            tooltip={RENDER_FIELD_COPY.geometrics.parallelogram.lowerLeft.description}
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
            tooltip={RENDER_FIELD_COPY.geometrics.parallelogram.uVector.description}
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
            tooltip={RENDER_FIELD_COPY.geometrics.parallelogram.vVector.description}
          />
          <GeometricMaterialSelect
            form={form}
            name={name}
            items={materialItems}
            tooltip={RENDER_FIELD_COPY.geometrics._shared.material.description}
          />
        </>
      );
    case 'plane':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.point`}
            label="Point"
            tooltip={RENDER_FIELD_COPY.geometrics.plane.point.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.normal`}
            label="Normal"
            tooltip={RENDER_FIELD_COPY.geometrics.plane.normal.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <GeometricMaterialSelect
            form={form}
            name={name}
            items={materialItems}
            tooltip={RENDER_FIELD_COPY.geometrics._shared.material.description}
          />
        </>
      );
    case 'disk':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.center`}
            label="Center"
            tooltip={RENDER_FIELD_COPY.geometrics.disk.center.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.normal`}
            label="Normal"
            tooltip={RENDER_FIELD_COPY.geometrics.disk.normal.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextInputControl
            form={form}
            fieldName={`geometrics.${name}.radius`}
            label="Radius"
            tooltip={RENDER_FIELD_COPY.geometrics.disk.radius.description}
            valueLabel="radius"
            type="number"
          />
          <TextInputControl
            form={form}
            fieldName={`geometrics.${name}.inner_radius`}
            label="Inner Radius"
            tooltip={RENDER_FIELD_COPY.geometrics.disk.innerRadius.description}
            valueLabel="inner_radius"
            type="number"
          />
          <GeometricMaterialSelect
            form={form}
            name={name}
            items={materialItems}
            tooltip={RENDER_FIELD_COPY.geometrics._shared.material.description}
          />
        </>
      );
    case 'cylinder':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.a`}
            label="Endpoint A"
            tooltip={RENDER_FIELD_COPY.geometrics.cylinder.endpointA.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <form.AppField name={`geometrics.${name}.a_end`}>
            {(field) => (
              <field.SelectControl
                label="End A"
                tooltip={RENDER_FIELD_COPY.geometrics.cylinder.endA.description}
                items={[
                  { label: 'Capped', value: 'capped' },
                  { label: 'Open', value: 'open' },
                  { label: 'Infinite', value: 'infinite' },
                ]}
              />
            )}
          </form.AppField>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.b`}
            label="Endpoint B"
            tooltip={RENDER_FIELD_COPY.geometrics.cylinder.endpointB.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <form.AppField name={`geometrics.${name}.b_end`}>
            {(field) => (
              <field.SelectControl
                label="End B"
                tooltip={RENDER_FIELD_COPY.geometrics.cylinder.endB.description}
                items={[
                  { label: 'Capped', value: 'capped' },
                  { label: 'Open', value: 'open' },
                  { label: 'Infinite', value: 'infinite' },
                ]}
              />
            )}
          </form.AppField>
          <TextInputControl
            form={form}
            fieldName={`geometrics.${name}.radius`}
            label="Radius"
            tooltip={RENDER_FIELD_COPY.geometrics.cylinder.radius.description}
            valueLabel="radius"
            type="number"
          />
          <GeometricMaterialSelect
            form={form}
            name={name}
            items={materialItems}
            tooltip={RENDER_FIELD_COPY.geometrics._shared.material.description}
          />
        </>
      );
    case 'bilinear_patch':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.p00`}
            label="P00"
            labelSpacePercentage={20}
            tooltip={RENDER_FIELD_COPY.geometrics.bilinear_patch.bilinearCorner.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.p10`}
            label="P10"
            labelSpacePercentage={20}
            tooltip={RENDER_FIELD_COPY.geometrics.bilinear_patch.bilinearCorner.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.p01`}
            label="P01"
            labelSpacePercentage={20}
            tooltip={RENDER_FIELD_COPY.geometrics.bilinear_patch.bilinearCorner.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.p11`}
            label="P11"
            labelSpacePercentage={20}
            tooltip={RENDER_FIELD_COPY.geometrics.bilinear_patch.bilinearCorner.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <GeometricMaterialSelect
            form={form}
            name={name}
            items={materialItems}
            tooltip={RENDER_FIELD_COPY.geometrics._shared.material.description}
          />
        </>
      );
    case 'rotate_x':
    case 'rotate_y':
    case 'rotate_z': {
      const hasDegrees = 'degrees' in data;
      return (
        <>
          <form.AppField name={`geometrics.${name}.${hasDegrees ? 'degrees' : 'radians'}`}>
            {(field) => (
              <field.RangeControl
                label={hasDegrees ? 'Degrees of Rotation' : 'Radians of Rotation'}
                tooltip={
                  hasDegrees
                    ? RENDER_FIELD_COPY.geometrics.rotate.degreesOfRotation.description
                    : RENDER_FIELD_COPY.geometrics.rotate.radiansOfRotation.description
                }
                min={0}
                max={hasDegrees ? 360 : 2 * Math.PI}
                step={hasDegrees ? 1.0 : 0.01}
              />
            )}
          </form.AppField>
          <AroundVariantControls form={form} geometricName={name} pivotLabel="Rotation Point" />
        </>
      );
    }
    case 'rotate_quaternion': {
      const isGizmoActive = activeGizmos.has(name);

      return (
        <>
          <div className="flex max-w-full flex-col">
            <div className="flex w-full items-center justify-between py-2">
              <h6 className="overflow-hidden font-normal">Show Interactive Rotation Gizmo</h6>
              <ToggleSwitch checked={isGizmoActive} onChange={() => toggleGizmo(name)} />
            </div>
          </div>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.quaternion`}
            label="Quaternion"
            tooltip={RENDER_FIELD_COPY.geometrics.rotate_quaternion.quaternion.description}
            labelSpacePercentage={25}
            valueLabels={['w', 'x', 'y', 'z']}
            type="number"
            unenforcedStep={0.1}
          />
          <AroundVariantControls form={form} geometricName={name} pivotLabel="Rotation Point" />
        </>
      );
    }
    case 'scale':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.scale`}
            label="Scale"
            tooltip={RENDER_FIELD_COPY.geometrics.scale.scale.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
          <AroundVariantControls form={form} geometricName={name} pivotLabel="Scale Point" />
        </>
      );
    case 'translate':
      return (
        <>
          <TextArrayInputControl
            form={form}
            fieldName={`geometrics.${name}.translation`}
            label="Translation"
            tooltip={RENDER_FIELD_COPY.geometrics.translate.translation.description}
            valueLabels={['x', 'y', 'z']}
            type="number"
          />
        </>
      );
    case 'constant_volume':
      return (
        <>
          <form.AppField name={`geometrics.${name}.density`}>
            {(field) => (
              <field.RangeControl
                label="Density"
                tooltip={RENDER_FIELD_COPY.geometrics.constant_volume.density.description}
                min={0}
                max={1}
                step={0.01}
              />
            )}
          </form.AppField>
          <GeometricTextureSelect
            form={form}
            name={name}
            items={textureItems}
            tooltip={RENDER_FIELD_COPY.geometrics.constant_volume.reflectanceTexture.description}
          />
        </>
      );
    case 'virtual':
      return <p className="text-sm text-zinc-500">Virtual wrapper — transparent in rendering.</p>;
    case 'list':
      return <ListControls form={form} name={name} />;
    case 'obj_model':
      return <p className="text-sm text-zinc-500">OBJ model — imported from file.</p>;
  }
  assertExhaustive(data);
}
