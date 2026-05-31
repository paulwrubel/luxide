import { useState, useRef, useCallback } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import { HiFolderOpen } from 'react-icons/hi2';
import type { RenderConfig } from '@/utils/render/config';
import { RenderConfigSchema, normalizeRenderConfig } from '@/utils/render/config';
import { RenderConfigEditor } from './RenderConfigEditor';

interface ImportConfigModalProps {
  show: boolean;
  onClose: () => void;
  onImportSuccess: (config: RenderConfig) => void;
}

export function ImportConfigModal(props: ImportConfigModalProps) {
  const { show, onClose, onImportSuccess } = props;

  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(reader.result as string);
      setError(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleImportConfig = useCallback(async () => {
    if (!jsonText.trim()) {
      setError('Please enter or import a JSON configuration.');
      return;
    }
    setIsValidating(true);
    setError(null);
    try {
      const parsed = JSON.parse(jsonText);
      const normalized = normalizeRenderConfig(parsed);
      const result = RenderConfigSchema.safeParse(normalized);
      if (!result.success) {
        setError('Configuration has validation errors — see inline markers above.');
        return;
      }
      onImportSuccess(result.data);
      onClose();
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('Invalid JSON: ' + e.message);
      } else {
        setError('Unexpected error: ' + String(e));
      }
    } finally {
      setIsValidating(false);
    }
  }, [jsonText, onImportSuccess, onClose]);

  return (
    <Modal show={show} onClose={onClose} size="xl" dismissible>
      <ModalHeader>Import Render Config</ModalHeader>
      <ModalBody>
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button size="sm" color="gray" onClick={() => fileInputRef.current?.click()}>
              <HiFolderOpen />
              Import File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.jsonc"
              onChange={handleFileChange}
              hidden
            />
          </div>
          <RenderConfigEditor
            value={jsonText}
            onChange={(value) => {
              setJsonText(value);
              setError(null);
            }}
          />
          {error && (
            <div className="rounded-lg bg-red-900/30 p-3 text-sm whitespace-pre-wrap text-red-300">
              {error}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="default" onClick={handleImportConfig} disabled={isValidating}>
          Import Config
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
