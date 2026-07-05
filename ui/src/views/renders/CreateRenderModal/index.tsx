import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'flowbite-react';
import { SourceChoice } from './SourceChoice';
import { TemplatePicker } from './TemplatePicker';
import { ImportConfigBody } from './ImportConfigModal/ImportConfigBody';
import { ExistingRenderPicker } from './ExistingRenderPicker';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import type { Template } from '@/utils/render/templates';
import { saveRenderDraft } from '@/hooks/useRenderForm';

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
    saveRenderDraft(config);
    navigate('/renders/new');
    onClose();
  };

  const handleImportSuccess = (config: NormalizedRenderConfig) => {
    saveRenderDraft(config);
    navigate('/renders/new');
    onClose();
  };

  const handleExistingRenderSelect = (config: NormalizedRenderConfig) => {
    const modifiedConfig = { ...config, name: `${config.name} (copy)` };
    saveRenderDraft(modifiedConfig);
    navigate('/renders/new');
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
