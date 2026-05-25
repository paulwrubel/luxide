import FormTextInput from './FormTextInput';
import { getGridColumnsTemplateForPercentage } from './utils';

interface TextArrayInputControlProps {
  form: any;
  field: string;
  type?: 'text' | 'number';
  label: string;
  labelSpacePercentage?: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  valueLabels: string[];
  unenforcedStep?: number;
}

export default function TextArrayInputControl({
  form,
  field,
  type = 'text',
  label,
  labelSpacePercentage = 40,
  allowWrappingLabel,
  labelPrefix,
  labelSuffix,
  valueLabels,
  unenforcedStep,
}: TextArrayInputControlProps) {
  const gridStr = getGridColumnsTemplateForPercentage(labelSpacePercentage);

  return (
    <div className={`grid items-center ${gridStr}`}>
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
              <FormTextInput
                form={form}
                field={`${field}[${i}]`}
                type={type}
                valueLabel={valueLabel}
                unenforcedStep={unenforcedStep}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
