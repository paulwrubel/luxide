import { ControlsCard } from './ControlsCard';
import { WarningIconUnaffectedPreview } from '../icons/WarningIconUnaffectedPreview';
import { RangeControl } from '../ui/RangeControl';
import { TextArrayInputControl } from '../ui/TextArrayInputControl';
import { getCameraData } from '../../../utils/render/camera';
import type { RenderForm } from '../../../hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';

interface CameraControlsCardProps {
  form: RenderForm;
  camera: string;
}

export function CameraControlsCard(props: CameraControlsCardProps) {
  const { form, camera } = props;

  const renderConfig = useStore(form.store, (state) => state.values);
  const { path } = getCameraData(renderConfig, camera);

  return (
    <ControlsCard
      leftLabel={typeof camera === 'string' ? camera : 'inline'}
      leftLabelStyle={typeof camera === 'string' ? 'bold' : 'light'}
      startExpanded
    >
      <div className="flex flex-col gap-2 p-4">
        <RangeControl
          form={form}
          field={`${path}.vertical_field_of_view_degrees`}
          label="Vertical FOV (degrees)"
          min={10.0}
          max={170.0}
          step={1.0}
        />
        <TextArrayInputControl
          form={form}
          field={`${path}.eye_location`}
          label="Eye"
          valueLabels={['x', 'y', 'z']}
          type="number"
        />
        <TextArrayInputControl
          form={form}
          field={`${path}.target_location`}
          label="Target"
          valueLabels={['x', 'y', 'z']}
          type="number"
        />
        <TextArrayInputControl
          form={form}
          field={`${path}.view_up`}
          label="View Up"
          valueLabels={['x', 'y', 'z']}
          type="number"
        />
        <RangeControl
          form={form}
          field={`${path}.defocus_angle_degrees`}
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
