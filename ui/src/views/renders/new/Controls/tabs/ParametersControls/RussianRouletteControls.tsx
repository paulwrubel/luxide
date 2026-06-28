import { useState } from 'react';
import { ToggleSwitch } from 'flowbite-react';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { AnimatedSeparator } from '@/components/AnimatedSeparator';
import { ExpandableSection } from '@/components/ExpandableSection';
import { WarningIconAdvancedProperty } from '../../shared/icons/WarningIconAdvancedProperty';
import { useSelector } from '@tanstack/react-store';
import type { RenderForm } from '@/hooks/useRenderForm';

export type RussianRouletteControlsProps = {
  form: RenderForm;
};

export function RussianRouletteControls(props: RussianRouletteControlsProps) {
  const { form } = props;

  const parameters = useSelector(form.store, (state) => state.values.parameters);
  const rouletteAfter = parameters.bounces?.use_russian_roulette_after ?? 3;

  const [rouletteAfterLocal, setRouletteAfterLocal] = useState(rouletteAfter);

  const isRussianRouletteEnabled = parameters.bounces?.use_russian_roulette_after !== undefined;

  function handleToggle(checked: boolean) {
    if (checked) {
      form.setFieldValue('parameters.bounces.use_russian_roulette_after', rouletteAfterLocal);
    } else {
      setRouletteAfterLocal(rouletteAfter);
      form.setFieldValue('parameters.bounces.use_russian_roulette_after', undefined);
    }
  }

  return (
    <>
      <AnimatedSeparator visible={isRussianRouletteEnabled} />
      <div className="flex w-full items-center justify-between py-2">
        <h6 className="overflow-hidden font-normal">
          <span className="flex items-center gap-2">
            Use Russian Roulette?
            <WarningIconAdvancedProperty />
          </span>
        </h6>
        <ToggleSwitch checked={isRussianRouletteEnabled} onChange={handleToggle} />
      </div>
      <ExpandableSection
        expanded={isRussianRouletteEnabled}
        onExpandEnd={() => {
          form.validate('change');
        }}
      >
        <div className="py-2">
          <TextInputControl
            form={form}
            fieldName="parameters.bounces.use_russian_roulette_after"
            label="Minimum Bounces Before Activation"
            labelSpacePercentage={70}
            valueLabel="bounces"
            type="number"
            labelSuffix={<WarningIconAdvancedProperty />}
          />
        </div>
      </ExpandableSection>
      <AnimatedSeparator visible={isRussianRouletteEnabled} />
    </>
  );
}
