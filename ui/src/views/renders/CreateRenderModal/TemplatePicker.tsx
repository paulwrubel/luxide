import { useState, type HTMLAttributes } from 'react';
import { Card, Button, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import { HiArrowLeft } from 'react-icons/hi2';
import type { DeepPartial } from 'flowbite-react/types';
import type { CardTheme } from 'flowbite-react';
import { Separator } from '@/components/Separator';
import type { Template } from '@/utils/render/templates';
import { TEMPLATES } from '@/utils/render/templates';

export type TemplatePickerProps = {
  onSelect: (template: Template) => void;
  onBack: () => void;
};

const cardTheme: DeepPartial<CardTheme> = {
  root: {
    base: 'bg-zinc-950 dark:bg-zinc-950 border-2 border-zinc-50 dark:border-zinc-50',
    children: 'p-0',
  },
};

export function TemplatePicker(props: TemplatePickerProps) {
  const { onSelect, onBack } = props;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTemplate = selectedId ? (TEMPLATES.find((t) => t.id === selectedId) ?? null) : null;

  const buttonClassName: HTMLAttributes<HTMLButtonElement>['className'] =
    'flex h-full w-full flex-col justify-end items-center gap-1 p-4 text-zinc-200 hover:bg-zinc-900 text-wrap hover:rounded-lg';

  return (
    <>
      <ModalHeader>Choose a Template</ModalHeader>
      <ModalBody>
        <div className="flex flex-wrap gap-4">
          {TEMPLATES.map((template) => {
            const isSelected = selectedId === template.id;

            return (
              <Card
                key={template.id}
                theme={cardTheme}
                className={isSelected ? 'w-60 border-solid border-zinc-400 bg-zinc-800' : 'w-60'}
                imgAlt={template.thumbnail ? template.name : undefined}
                imgSrc={template.thumbnail}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(template.id)}
                  className={buttonClassName}
                >
                  <span className="text-base font-normal">{template.name}</span>
                  <span className="text-sm text-zinc-400">{template.description}</span>
                </button>
              </Card>
            );
          })}
        </div>

        {selectedTemplate && (
          <div className="mt-6">
            <Separator />
            <div className="mt-4 flex gap-4">
              {selectedTemplate.thumbnail && (
                <img
                  src={selectedTemplate.thumbnail}
                  alt={selectedTemplate.name}
                  className="h-24 w-32 shrink-0 rounded-lg object-contain"
                />
              )}
              <div>
                <h3 className="text-sm font-medium text-zinc-200">
                  Preview: {selectedTemplate.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{selectedTemplate.description}</p>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter className="justify-between">
        <Button color="gray" onClick={onBack}>
          <HiArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {selectedTemplate && (
          <Button color="default" onClick={() => onSelect(selectedTemplate)}>
            Use This Template
          </Button>
        )}
      </ModalFooter>
    </>
  );
}
