import { ExpandableSection } from '@/components/ExpandableSection';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { isAroundPoint } from '@/utils/render/utils';
import type { Around } from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';
import { AnimatedSeparator } from '@/components/AnimatedSeparator';

export type AroundVariantControlsProps = {
  form: RenderForm;
  geometricName: string;
};

export function AroundVariantControls(props: AroundVariantControlsProps) {
  const { form, geometricName } = props;

  return (
    <form.AppField name={`geometrics.${geometricName}.around`}>
      {(field) => {
        const isPoint = isAroundPoint((field.state.value as Around | undefined) ?? 'origin');

        return (
          <>
            <AnimatedSeparator visible={isPoint} />
            <field.SelectControl
              label="Rotation Point"
              items={[
                { label: 'Geometric Center', value: 'center' },
                { label: 'World Origin', value: 'origin' },
                { label: 'Custom Point', value: 'point' },
              ]}
              onChange={(value) => {
                if (value === 'center' || value === 'origin') {
                  // superRefine schema prevents TS from narrowing the discriminated union here
                  field.handleChange(value as never);
                } else {
                  // superRefine schema prevents TS from narrowing the discriminated union here
                  field.handleChange({ point: [0, 0, 0] } as never);
                }
              }}
              mapValue={(v) => {
                if (typeof v === 'string') {
                  return v;
                }
                return 'point';
              }}
            />
            <ExpandableSection
              expanded={isPoint}
              onExpandEnd={() => {
                form.validate('change');
              }}
            >
              <div className="py-2">
                <TextArrayInputControl
                  form={form}
                  fieldName={`geometrics.${geometricName}.around.point`}
                  label="Custom Rotation Point"
                  valueLabels={['x', 'y', 'z']}
                  type="number"
                />
              </div>
            </ExpandableSection>
            <AnimatedSeparator visible={isPoint} />
          </>
        );
      }}
    </form.AppField>
  );
}
