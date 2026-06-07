import { Select } from 'flowbite-react';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { isAroundPoint } from '@/utils/render/utils';
import type { Around } from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';

export type AroundVariantControlsProps = {
  form: RenderForm;
  geometricName: string;
  around: Around;
};

export function AroundVariantControls(props: AroundVariantControlsProps) {
  const { form, geometricName, around } = props;

  return (
    <>
      <div className="mb-2">
        <label className="mb-1 block text-sm font-medium text-gray-300">Rotation Point</label>
        <Select
          value={typeof around === 'string' ? around : 'point'}
          onChange={(e) => {
            const variant = e.target.value;
            if (variant === 'center') {
              // superRefine schema prevents TS from narrowing the discriminated union here
              form.setFieldValue(`geometrics.${geometricName}.around`, 'center' as never);
            } else if (variant === 'origin') {
              // superRefine schema prevents TS from narrowing the discriminated union here
              form.setFieldValue(`geometrics.${geometricName}.around`, 'origin' as never);
            } else {
              // superRefine schema prevents TS from narrowing the discriminated union here
              form.setFieldValue(`geometrics.${geometricName}.around`, {
                point: [0, 0, 0],
              } as never);
            }
          }}
        >
          <option value="center">Center of geometry</option>
          <option value="origin">Origin (0, 0, 0)</option>
          <option value="point">Custom point</option>
        </Select>
      </div>
      {isAroundPoint(around) && (
        <TextArrayInputControl
          form={form}
          fieldName={`geometrics.${geometricName}.around.point`}
          label="Custom Rotation Point"
          valueLabels={['x', 'y', 'z']}
          type="number"
        />
      )}
    </>
  );
}
