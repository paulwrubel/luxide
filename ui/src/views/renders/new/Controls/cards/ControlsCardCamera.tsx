import { AccordionRow } from '../AccordionRow';
import { WarningIconUnaffectedPreview } from '../icons/WarningIconUnaffectedPreview';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { renameCamera } from '@/utils/render/utils';
import type { RenderForm, RenderFormPath } from '@/hooks/useRenderForm';
import type { DeepKeys } from '@tanstack/react-form';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import { useSelector } from '@tanstack/react-store';

export type ControlsCardCameraProps = {
  form: RenderForm;
  cameraName: string;
};

export function ControlsCardCamera(props: ControlsCardCameraProps) {
  const { form, cameraName } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  function handleRename(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === cameraName) {
      return;
    }

    const renamed = renameCamera(renderConfig, cameraName, trimmed);

    form.setFieldValue('cameras', renamed.cameras);
    form.setFieldValue('scenes', renamed.scenes);
  }

  const formPath: RenderFormPath = `cameras.${cameraName}`;

  return (
    <AccordionRow leftLabel={cameraName} onRename={handleRename} startExpanded>
      <div className="flex flex-col gap-2 p-4">
        <form.AppField name={`${formPath}.vertical_field_of_view_degrees`}>
          {(field) => (
            <field.RangeControl label="Vertical FOV (degrees)" min={10.0} max={170.0} step={1.0} />
          )}
        </form.AppField>
        <TextArrayInputControl
          form={form}
          fieldName={`${formPath}.eye_location` as DeepKeys<NormalizedRenderConfig>}
          label="Eye"
          valueLabels={['x', 'y', 'z']}
          type="number"
        />
        <TextArrayInputControl
          form={form}
          fieldName={`${formPath}.target_location` as DeepKeys<NormalizedRenderConfig>}
          label="Target"
          valueLabels={['x', 'y', 'z']}
          type="number"
        />
        <TextArrayInputControl
          form={form}
          fieldName={`${formPath}.view_up` as DeepKeys<NormalizedRenderConfig>}
          label="View Up"
          valueLabels={['x', 'y', 'z']}
          type="number"
        />
        <form.AppField name={`${formPath}.defocus_angle_degrees`}>
          {(field) => (
            <field.RangeControl
              label="Defocus Angle (degrees)"
              min={0.0}
              max={180.0}
              step={1.0}
              labelPrefix={<WarningIconUnaffectedPreview />}
            />
          )}
        </form.AppField>
      </div>
    </AccordionRow>
  );
}
