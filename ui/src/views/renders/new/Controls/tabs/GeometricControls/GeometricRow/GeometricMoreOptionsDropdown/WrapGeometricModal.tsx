import { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ToggleSwitch,
  Select,
} from 'flowbite-react';
import { HiPlus, HiXMark } from 'react-icons/hi2';

export type InstanceType = 'translate' | 'rotate_x' | 'rotate_y' | 'rotate_z' | 'scale';

const INSTANCE_LABELS: Record<InstanceType, string> = {
  rotate_x: 'Rotate X',
  rotate_y: 'Rotate Y',
  rotate_z: 'Rotate Z',
  scale: 'Scale',
  translate: 'Translate',
};

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

  const [instances, setInstances] = useState<InstanceType[]>([]);
  const [pendingInstanceType, setPendingInstanceType] = useState<InstanceType>('translate');
  const [isConstantVolume, setIsConstantVolume] = useState(false);
  const [isVirtual, setIsVirtual] = useState(false);

  function handleWrap() {
    onWrap({
      instances,
      isConstantVolume,
      isVirtual,
    });
    // reset state
    setInstances([]);
    setPendingInstanceType('translate');
    setIsConstantVolume(false);
    setIsVirtual(false);
    onClose();
  }

  function handleCancel() {
    setInstances([]);
    setPendingInstanceType('translate');
    setIsConstantVolume(false);
    setIsVirtual(false);
    onClose();
  }

  return (
    <Modal dismissible show={open} onClose={handleCancel}>
      <ModalHeader>Wrap {geometricName}</ModalHeader>
      <ModalBody>
        {/* stacked instances builder */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-300">Instances</label>
          {instances.length > 0 ? (
            <div className="mb-2 space-y-1">
              {instances.map((inst, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded bg-zinc-800 px-2 py-1 text-sm"
                >
                  <span className="text-gray-300">
                    [{i + 1}] {INSTANCE_LABELS[inst]}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInstances(instances.filter((_, j) => j !== i));
                    }}
                    className="text-gray-500 hover:text-red-400"
                    aria-label={`Remove ${INSTANCE_LABELS[inst]}`}
                  >
                    <HiXMark className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-2 text-xs text-gray-500">No transforms applied.</p>
          )}
          <div className="flex gap-2">
            <Select
              value={pendingInstanceType}
              onChange={(e) => {
                // flowbite-react Select onChange yields a generic HTMLSelectElement
                // event whose value is string; the options are all valid InstanceType values
                setPendingInstanceType(e.target.value as InstanceType);
              }}
              sizing="sm"
            >
              <option value="rotate_x">Rotate X</option>
              <option value="rotate_y">Rotate Y</option>
              <option value="rotate_z">Rotate Z</option>
              <option value="scale">Scale</option>
              <option value="translate">Translate</option>
            </Select>
            <Button
              color="light"
              size="xs"
              onClick={() => {
                setInstances([...instances, pendingInstanceType]);
              }}
            >
              <HiPlus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>

        {/* constant volume toggle */}
        <div className="mb-3 flex items-center gap-3">
          <ToggleSwitch
            checked={isConstantVolume}
            onChange={setIsConstantVolume}
            label="Wrap as Constant Volume?"
          />
        </div>

        {/* virtual toggle */}
        <div className="mb-3 flex items-center gap-3">
          <ToggleSwitch checked={isVirtual} onChange={setIsVirtual} label="Wrap as Virtual?" />
        </div>
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
