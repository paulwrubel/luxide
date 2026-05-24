import ControlsCard from '../../components/ControlsCard';
import WarningIconUnaffectedPreview from '../../components/icons/WarningIconUnaffectedPreview';
import RangeControl from '../../components/ui/RangeControl';
import TextArrayInputControl from '../../components/ui/TextArrayInputControl';
import { getCameraData } from '../../utils/render/camera';
import type { RenderConfig } from '../../utils/render/config';

interface CameraControlsCardProps {
  form: any;
  camera: string;
}

export default function CameraControlsCard({
  form,
  camera,
}: CameraControlsCardProps) {
  const renderConfig = form.state.values as RenderConfig;
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
