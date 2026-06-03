import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'flowbite-react';
import { SourceChoice } from './SourceChoice';
import { TemplatePicker } from './TemplatePicker';
import { ImportConfigBody } from './ImportConfigModal/ImportConfigBody';
import { ExistingRenderPicker } from './ExistingRenderPicker';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import type { Template } from '@/utils/render/templates';

type Stage = 'source-choice' | 'template-picker' | 'import-json' | 'render-picker';

export type CreateRenderModalProps = {
  show: boolean;
  onClose: () => void;
};

export function CreateRenderModal(props: CreateRenderModalProps) {
  const { show, onClose } = props;

  const [stage, setStage] = useState<Stage>('source-choice');
  const navigate = useNavigate();

  function handleClose() {
    setStage('source-choice');
    onClose();
  }

  const handleTemplateSelect = (template: Template) => {
    const config = template.config;
    navigate('/renders/new', { state: { importedConfig: config } });
    onClose();
  };

  const handleImportSuccess = (config: NormalizedRenderConfig) => {
    navigate('/renders/new', { state: { importedConfig: config } });
    onClose();
  };

  const handleExistingRenderSelect = (config: NormalizedRenderConfig) => {
    const modifiedConfig = { ...config, name: `${config.name} (copy)` };
    navigate('/renders/new', { state: { importedConfig: modifiedConfig } });
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose} size="xl" dismissible>
      {stage === 'source-choice' && (
        <SourceChoice
          onSelectTemplate={() => setStage('template-picker')}
          onSelectImportJSON={() => setStage('import-json')}
          onSelectCloneExisting={() => setStage('render-picker')}
          onCancel={handleClose}
        />
      )}
      {stage === 'template-picker' && (
        <TemplatePicker onSelect={handleTemplateSelect} onBack={() => setStage('source-choice')} />
      )}
      {stage === 'import-json' && (
        <ImportConfigBody
          onImportSuccess={handleImportSuccess}
          onCancel={() => setStage('source-choice')}
        />
      )}
      {stage === 'render-picker' && (
        <ExistingRenderPicker
          onSelect={handleExistingRenderSelect}
          onBack={() => setStage('source-choice')}
        />
      )}
    </Modal>
  );
}
