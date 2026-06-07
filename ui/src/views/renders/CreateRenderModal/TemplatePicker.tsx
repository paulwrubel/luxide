import { useState } from 'react';
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

  return (
    <>
      <ModalHeader>Choose a Template</ModalHeader>
      <ModalBody>
        <div className="flex flex-wrap items-start gap-4">
          {TEMPLATES.map((template) => {
            // const isSelected = selectedId === template.id;

            return (
              <Card
                key={template.id}
                theme={cardTheme}
                className={
                  'w-60 cursor-pointer border-solid border-zinc-400 bg-zinc-800 hover:bg-zinc-900'
                }
                imgAlt={template.thumbnail ? template.name : undefined}
                imgSrc={template.thumbnail}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(template.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(template.id);
                  }
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-end gap-1 p-4 text-wrap text-zinc-200">
                  <span className="text-base font-normal">{template.name}</span>
                  <span className="text-sm text-zinc-400">{template.description}</span>
                </div>
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
                  Selected: <em>{selectedTemplate.name}</em>
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
