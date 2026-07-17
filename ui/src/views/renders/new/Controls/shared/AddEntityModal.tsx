import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ToggleSwitch,
  Select,
  TextInput,
} from 'flowbite-react';
import { useSelector } from '@tanstack/react-store';
import { useAppForm } from '@/hooks/useAppForm';
import { z } from 'zod';
import type { InstanceType } from '@/components/form-controls/InstancesBuilderControl';
import type { EntityType, EntitySubType, AddEntityDropdownOption } from './AddEntityDropdown';
import { useAllResourceMetadataQuery } from '@/hooks/useResources';

export type AddEntityCreateConfig = {
  customName?: string;
  instances: InstanceType[];
  isConstantVolume: boolean;
  isVirtual: boolean;
  resourceId?: number;
};

export type AddEntityModalProps<T extends EntityType> = {
  entityType: T;
  subtype: EntitySubType<T>;
  option: AddEntityDropdownOption<T>;
  open: boolean;
  onClose: () => void;
  onCreate: (config: AddEntityCreateConfig) => void;
};

export function AddEntityModal<T extends EntityType>(props: AddEntityModalProps<T>) {
  const { entityType, option, open, onClose, onCreate } = props;

  const isGeometrics = entityType === 'geometrics';
  const isImageTexture = entityType === 'textures' && option.subtype === 'image';

  const { data: resources } = useAllResourceMetadataQuery();

  const form = useAppForm({
    defaultValues: {
      customName: '',
      // `[]` is inferred as `never[]` without the explicit cast
      instances: [] as InstanceType[],
      isConstantVolume: false,
      isVirtual: false,
      selectedResourceId: '',
    },
    validators: {
      onChange: z
        .object({
          customName: z.string(),
          instances: z.array(z.enum(['translate', 'rotate_x', 'rotate_y', 'rotate_z', 'scale'])),
          isConstantVolume: z.boolean(),
          isVirtual: z.boolean(),
          selectedResourceId: z.string(),
        })
        .superRefine((data, ctx) => {
          // an image texture is meaningless without a backing resource
          if (isImageTexture && data.selectedResourceId === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'A resource must be selected',
              path: ['selectedResourceId'],
            });
          }
        }),
    },
  });

  const isFormValid = useSelector(form.store, (state) => state.isValid);

  function handleCreate() {
    const values = form.state.values;
    onCreate({
      customName: values.customName.trim() || undefined,
      instances: values.instances,
      isConstantVolume: values.isConstantVolume,
      isVirtual: values.isVirtual,
      resourceId: values.selectedResourceId ? Number(values.selectedResourceId) : undefined,
    });
    form.reset();
    onClose();
  }

  function handleCancel() {
    form.reset();
    onClose();
  }

  // --- Disabled modal (unchanged logic) ---
  if (option.disabled) {
    return (
      <Modal dismissible show={open} onClose={handleCancel}>
        <ModalHeader>{option.label}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-yellow-400">{option.disabledReason}</p>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={handleCancel}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal dismissible show={open} onClose={handleCancel}>
      <ModalHeader>{option.label}</ModalHeader>
      <ModalBody>
        {/* name input */}
        <form.AppField name="customName">
          {(field) => (
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Name (optional)
              </label>
              <TextInput
                placeholder={`New ${option.label}`}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.AppField>

        {/* description */}
        {option.description && <p className="mb-4 text-sm text-gray-400">{option.description}</p>}

        {/* geometric-specific: instances and constant volume */}
        {isGeometrics && (
          <>
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
                    label="Create as Constant Volume?"
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
                    label="Create as Virtual?"
                  />
                </div>
              )}
            </form.AppField>
          </>
        )}

        {/* image texture: resource picker */}
        {entityType === 'textures' && option.subtype === 'image' && (
          <form.AppField name="selectedResourceId">
            {(field) => (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Select Resource
                </label>
                {resources && resources.length > 0 ? (
                  <Select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    sizing="sm"
                  >
                    <option value="">-- Choose a resource --</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.mime_type})
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p className="text-sm text-yellow-400">
                    No resources available. Upload one on the Resources page.
                  </p>
                )}
              </div>
            )}
          </form.AppField>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button color="default" onClick={handleCreate} disabled={!isFormValid}>
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
}
