import { useState, useRef, useCallback } from 'react';
import { Button, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import { HiFolderOpen } from 'react-icons/hi2';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import { RenderConfigSchema, normalizeRenderConfig } from '@/utils/render/config';
import { withDefaultEntities } from '@/utils/render/templates';
import { RenderConfigEditor } from './RenderConfigEditor';

export type ImportConfigBodyProps = {
  onImportSuccess: (config: NormalizedRenderConfig) => void;
  onCancel?: () => void;
};

export function ImportConfigBody(props: ImportConfigBodyProps) {
  const { onImportSuccess, onCancel } = props;

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

      // ensure default entities are present so new materials referencing __white/__black work correctly
      const configWithDefaults = withDefaultEntities(normalized);

      const result = RenderConfigSchema.safeParse(configWithDefaults);
      if (!result.success) {
        setError('Configuration has validation errors — see inline markers above.');
        return;
      }
      onImportSuccess(result.data);
      onCancel?.();
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('Invalid JSON: ' + e.message);
      } else {
        setError('Unexpected error: ' + String(e));
      }
    } finally {
      setIsValidating(false);
    }
  }, [jsonText, onImportSuccess, onCancel]);

  return (
    <>
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
        {onCancel && (
          <Button color="gray" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </ModalFooter>
    </>
  );
}
