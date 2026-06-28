import { AccordionRow } from '../AccordionRow';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import type { RenderForm, RenderFormPath } from '@/hooks/useRenderForm';
import type { DeepKeys } from '@tanstack/react-form';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import { InfoIconAdditionalInfo } from '@/views/renders/new/Controls/icons/InfoIconAdditionalInfo';
import { useSelector } from '@tanstack/react-store';

export type ControlsCardSceneProps = {
  form: RenderForm;
};

export function ControlsCardScene(props: ControlsCardSceneProps) {
  const { form } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);
  const activeSceneName = renderConfig.active_scene;

  const formPath: RenderFormPath = `scenes.${activeSceneName}`;

  return (
    <AccordionRow leftLabel="Scene" leftLabelStyle="light" startExpanded>
      <div className="flex flex-col gap-2 p-4">
        <form.AppField name={`${formPath}.use_bvh`}>
          {(field) => <field.ToggleControl label="Use BVH" />}
        </form.AppField>
        <TextArrayInputControl
          form={form}
          fieldName={`${formPath}.background_color` as DeepKeys<NormalizedRenderConfig>}
          label="Background Color"
          valueLabels={['red', 'green', 'blue']}
          type="number"
          unenforcedStep={0.01}
          labelSuffix={
            <InfoIconAdditionalInfo
              info={[
                'Color values are typically between 0 and 1. For example, pure white would be [1, 1, 1].',
                'Values can be set outside of this range, and will be affected by the "Use Scaling Truncation" parameter.',
                'This color is only visible in areas where no geometry is present behind the transparent background.',
              ]}
            />
          }
        />
      </div>
    </AccordionRow>
  );
}
