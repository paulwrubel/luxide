import { useState, useRef } from 'react';
import {
  Button,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  Alert,
} from 'flowbite-react';
import { useCreateResourceMutation } from '@/hooks/useResourceMutations';

export type UploadResourceModalProps = {
  show: boolean;
  onClose: () => void;
};

export function UploadResourceModal(props: UploadResourceModalProps) {
  const { show, onClose } = props;

  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadResource, isPending } = useCreateResourceMutation();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setError(null);
  }

  function getMimeType(): string {
    if (file) {
      return file.type || 'application/octet-stream';
    }
    return 'application/octet-stream';
  }

  function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError('Please enter a name for the resource.');
      return;
    }

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('resource_type', 'texture_map');
    formData.append('mime_type', getMimeType());
    formData.append('file', file);

    uploadResource(formData, {
      onSuccess: () => {
        setName('');
        setFile(null);
        setError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onClose();
      },
      onError: (uploadError) => {
        setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
      },
    });
  }

  function handleClose() {
    setName('');
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  }

  return (
    <Modal show={show} onClose={handleClose}>
      <ModalHeader>Upload Resource</ModalHeader>
      <ModalBody>
        <div className="flex flex-col gap-4">
          {error && <Alert color="red">{error}</Alert>}
          <div className="flex flex-col gap-2">
            <Label htmlFor="resource-name" className="text-zinc-300">
              Name
            </Label>
            <TextInput
              id="resource-name"
              placeholder="My Texture"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="resource-file" className="text-zinc-300">
              Image File
            </Label>
            <input
              ref={fileInputRef}
              id="resource-file"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-200 hover:file:bg-zinc-600"
              onChange={handleFileChange}
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
