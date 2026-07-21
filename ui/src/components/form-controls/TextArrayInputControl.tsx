import { getGridColumnsStyle } from './utils';
import type { RenderForm, RenderFormPath } from '@/hooks/useRenderForm';

export type TextArrayInputControlProps = {
  form: RenderForm;
  fieldName: RenderFormPath;
  type?: 'text' | 'number';
  label: string | React.ReactNode;
  labelSpacePercentage?: number;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  valueLabels: string[];
  unenforcedStep?: number;
};

export function TextArrayInputControl(props: TextArrayInputControlProps) {
  const {
    form,
    fieldName,
    type = 'text',
    label,
    labelSpacePercentage = 40,
    allowWrappingLabel,
    labelPrefix,
    labelSuffix,
    valueLabels,
    unenforcedStep,
  } = props;

  const gridStyle = getGridColumnsStyle(labelSpacePercentage);

  return (
    <div className="grid items-center" style={gridStyle}>
      <h6 className="mt-3 overflow-hidden font-normal">
        <span
          className={`flex items-center gap-2 ${allowWrappingLabel ? 'whitespace-normal' : 'whitespace-nowrap'}`}
        >
          {labelPrefix}
          {label}
          {labelSuffix}
        </span>
      </h6>
      <div className="flex flex-col">
        <div className="items-flex-end flex gap-2">
          {valueLabels.map((valueLabel, i) => (
            <div key={i} className="flex w-full flex-col">
              <form.AppField
                // template literal indexers aren't tracked to DeepKeys paths
                name={`${fieldName}[${i}]` as RenderFormPath}
              >
                {(field) => (
                  <field.FormTextField
                    type={type}
                    valueLabel={valueLabel}
                    unenforcedStep={unenforcedStep}
                  />
                )}
              </form.AppField>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
