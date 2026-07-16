import { useState, useRef } from 'react';
import { Button, Label, Modal, ModalHeader, ModalBody, ModalFooter, Alert } from 'flowbite-react';
import { useAppForm } from '@/hooks/useAppForm';
import { z } from 'zod';
import { useCreateResourceMutation } from '@/hooks/useResourceMutations';
import type { ResourceType } from '@/utils/api';

export type UploadResourceModalProps = {
  show: boolean;
  onClose: () => void;
};

export function UploadResourceModal(props: UploadResourceModalProps) {
  const { show, onClose } = props;

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadResource, isPending } = useCreateResourceMutation();

  const form = useAppForm({
    defaultValues: {
      name: '',
      resource_type: 'texture_image' as ResourceType,
    },
    validators: {
      onChange: z.object({
        name: z.string().min(1, 'Name is required'),
        resource_type: z.enum(['texture_image']),
      }),
    },
  });

  function getMimeType(): string {
    if (file) {
      return file.type || 'application/octet-stream';
    }
    return 'application/octet-stream';
  }

  function handleSubmit() {
    setFileError(null);

    if (!file) {
      setFileError('Please select a file to upload.');
      return;
    }

    const values = form.state.values;
    const formData = new FormData();
    formData.append('name', values.name.trim());
    formData.append('resource_type', values.resource_type);
    formData.append('mime_type', getMimeType());
    formData.append('file', file);

    uploadResource(formData, {
      onSuccess: () => {
        form.reset();
        setFile(null);
        setFileError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onClose();
      },
      onError: (uploadError) => {
        setFileError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
      },
    });
  }

  function handleClose() {
    form.reset();
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  }

  return (
    <Modal show={show} onClose={handleClose}>
      <ModalHeader>Upload Resource</ModalHeader>
      <ModalBody>
        <div className="flex flex-col gap-4 text-zinc-300">
          {fileError && <Alert color="red">{fileError}</Alert>}
          <form.AppField name="name">
            {(field) => <field.FormTextField valueLabel="Name" required />}
          </form.AppField>
          <form.AppField name="resource_type">
            {(field) => (
              <field.SelectControl
                label="Resource Type"
                items={[{ label: 'Texture Image', value: 'texture_image' }]}
              />
            )}
          </form.AppField>
          <div className="flex flex-col gap-2">
            <Label className="text-zinc-300">Image File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-200 hover:file:bg-zinc-600"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setFileError(null);
              }}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Uploading...' : 'Upload'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
