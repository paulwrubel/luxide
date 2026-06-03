import { Card, Button, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import { HiDocumentText, HiArrowUpTray, HiDocumentDuplicate } from 'react-icons/hi2';
import type { DeepPartial } from 'flowbite-react/types';
import type { CardTheme } from 'flowbite-react';

export type SourceChoiceProps = {
  onSelectTemplate: () => void;
  onSelectImportJSON: () => void;
  onSelectCloneExisting: () => void;
  onCancel: () => void;
};

export function SourceChoice(props: SourceChoiceProps) {
  const { onSelectTemplate, onSelectImportJSON, onSelectCloneExisting, onCancel } = props;

  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'bg-zinc-950 dark:bg-zinc-950 border-2 border-zinc-50 dark:border-zinc-50',
      children: 'p-0',
    },
  };

  const buttonClassName =
    'flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-wrap text-zinc-200 hover:bg-zinc-900 hover:rounded-lg';

  return (
    <>
      <ModalHeader>New Render</ModalHeader>
      <ModalBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card theme={cardTheme}>
            <button type="button" onClick={onSelectTemplate} className={buttonClassName}>
              <HiDocumentText className="h-8 w-8" />
              <span className="text-base font-normal">Template</span>
              <span className="text-sm text-zinc-400">Start from a built-in template</span>
            </button>
          </Card>
          <Card theme={cardTheme}>
            <button type="button" onClick={onSelectImportJSON} className={buttonClassName}>
              <HiArrowUpTray className="h-8 w-8" />
              <span className="text-base font-normal">Import JSON</span>
              <span className="text-sm text-zinc-400">Paste or upload a config file</span>
            </button>
          </Card>
          <Card theme={cardTheme}>
            <button type="button" onClick={onSelectCloneExisting} className={buttonClassName}>
              <HiDocumentDuplicate className="h-8 w-8" />
              <span className="text-base font-normal">Clone Existing</span>
              <span className="text-sm text-zinc-400">Start from an existing render's config</span>
            </button>
          </Card>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onCancel}>
          Cancel
        </Button>
      </ModalFooter>
    </>
  );
}
