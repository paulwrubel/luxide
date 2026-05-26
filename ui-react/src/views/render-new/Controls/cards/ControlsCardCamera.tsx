import { ControlsCard } from './ControlsCard';
import { WarningIconUnaffectedPreview } from '../icons/WarningIconUnaffectedPreview';
import { RangeControl } from './form-controls/RangeControl';
import { TextArrayInputControl } from './form-controls/TextArrayInputControl';
import type { RenderForm, RenderFormPath } from '../../../../hooks/useRenderForm';
import type { DeepKeys } from '@tanstack/react-form';
import type { NormalizedRenderConfig } from '../../../../utils/render/config';

interface ControlsCardCameraProps {
  form: RenderForm;
  cameraName: string;
}

export function ControlsCardCamera(props: ControlsCardCameraProps) {
  const { form, cameraName } = props;

  const formPath: RenderFormPath = `cameras.${cameraName}`;

  return (
    <ControlsCard leftLabel={cameraName} startExpanded>
      <div className="flex flex-col gap-2 p-4">
        <RangeControl
          form={form}
          fieldName={`${formPath}.vertical_field_of_view_degrees`}
          label="Vertical FOV (degrees)"
          min={10.0}
          max={170.0}
          step={1.0}
        />
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
        <RangeControl
          form={form}
          fieldName={`${formPath}.defocus_angle_degrees`}
          label="Defocus Angle (degrees)"
          min={0.0}
          max={180.0}
          step={1.0}
          labelPrefix={<WarningIconUnaffectedPreview />}
        />
      </div>
    </ControlsCard>
  );
}
