import { useAppForm } from '@/hooks/useAppForm';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, ToggleSwitch } from 'flowbite-react';
import type { InstanceType } from '@/components/form-controls/InstancesBuilderControl';

export type WrapGeometricConfig = {
  instances: InstanceType[];
  isConstantVolume: boolean;
  isVirtual: boolean;
};

export type WrapGeometricModalProps = {
  geometricName: string;
  open: boolean;
  onClose: () => void;
  onWrap: (config: WrapGeometricConfig) => void;
};

export function WrapGeometricModal(props: WrapGeometricModalProps) {
  const { geometricName, open, onClose, onWrap } = props;

  // without the cast, TypeScript infers [] as never[]; the form field needs InstanceType[]
  const form = useAppForm({
    defaultValues: {
      instances: [] as InstanceType[],
      isConstantVolume: false,
      isVirtual: false,
    },
  });

  function handleWrap() {
    const values = form.state.values;
    onWrap({
      instances: values.instances,
      isConstantVolume: values.isConstantVolume,
      isVirtual: values.isVirtual,
    });
    form.reset();
    onClose();
  }

  function handleCancel() {
    form.reset();
    onClose();
  }

  return (
    <Modal dismissible show={open} onClose={handleCancel}>
      <ModalHeader>Wrap {geometricName}</ModalHeader>
      <ModalBody>
        {/* stacked instances builder */}
        <form.AppField name="instances">
          {(field) => <field.InstancesBuilderControl />}
        </form.AppField>

        {/* constant volume toggle */}
        <form.AppField name="isConstantVolume">
          {(field) => (
            <div className="mb-3 flex items-center gap-3">
              <ToggleSwitch
                checked={field.state.value}
                onChange={(checked) => field.handleChange(checked)}
                label="Wrap as Constant Volume?"
              />
            </div>
          )}
        </form.AppField>

        {/* virtual toggle */}
        <form.AppField name="isVirtual">
          {(field) => (
            <div className="mb-3 flex items-center gap-3">
              <ToggleSwitch
                checked={field.state.value}
                onChange={(checked) => field.handleChange(checked)}
                label="Wrap as Virtual?"
              />
            </div>
          )}
        </form.AppField>
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button color="default" onClick={handleWrap}>
          Wrap
        </Button>
      </ModalFooter>
    </Modal>
  );
}
