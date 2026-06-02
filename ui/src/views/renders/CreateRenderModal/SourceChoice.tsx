import { Card, Button, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import { HiDocumentText, HiArrowUpTray } from 'react-icons/hi2';
import type { DeepPartial } from 'flowbite-react/types';
import type { CardTheme } from 'flowbite-react';

export type SourceChoiceProps = {
  onSelectTemplate: () => void;
  onSelectImportJSON: () => void;
  onCancel: () => void;
};

export function SourceChoice(props: SourceChoiceProps) {
  const { onSelectTemplate, onSelectImportJSON, onCancel } = props;

  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'bg-zinc-950 dark:bg-zinc-950 border-2 border-zinc-50 dark:border-zinc-50',
      children: 'p-0',
    },
  };

  const buttonClassName =
    'flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-zinc-200 hover:bg-zinc-900 hover:rounded-lg';

  return (
    <>
      <ModalHeader>New Render</ModalHeader>
      <ModalBody>
        <div className="flex gap-4">
          <Card theme={cardTheme} className="flex-1">
            <button type="button" onClick={onSelectTemplate} className={buttonClassName}>
              <HiDocumentText className="h-8 w-8" />
              <span className="text-base font-normal">Template</span>
              <span className="text-sm text-zinc-400">Start from a built-in template</span>
            </button>
          </Card>
          <Card theme={cardTheme} className="flex-1">
            <button type="button" onClick={onSelectImportJSON} className={buttonClassName}>
              <HiArrowUpTray className="h-8 w-8" />
              <span className="text-base font-normal">Import JSON</span>
              <span className="text-sm text-zinc-400">Paste or upload a config file</span>
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
