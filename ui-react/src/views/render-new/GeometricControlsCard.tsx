import { useState } from 'react';
import { Card, Button } from 'flowbite-react';
import { ChevronDownIcon, ChevronUpIcon } from 'flowbite-react';
import { motion, AnimatePresence } from 'framer-motion';
import Separator from '../../components/Separator';
import NestedGeometricHeader from './NestedGeometricHeader';
import TextArrayInputControl from './ui/TextArrayInputControl';
import TextInputControl from './ui/TextInputControl';
import RangeControl from './ui/RangeControl';
import SelectControl from './ui/SelectControl';
import { getGeometricData, getGeometricDataSafe } from '../../utils/render/geometric';
import { fixReferences } from '../../utils/render/utils';
import type { RenderConfig } from '../../utils/render/config';
import type { RenderForm } from '../../hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function DeleteGeometricButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex w-full justify-end">
      <Button color="red" onClick={onClick} size="sm">
        <TrashIcon className="h-5 w-5" />
      </Button>
    </div>
  );
}

function GeometricMaterialSelect({
  form,
  name,
  items,
}: {
  form: RenderForm;
  name: string;
  items: { name: string; value: string }[];
}) {
  return (
    <SelectControl
      form={form}
      field={`geometrics.${name}.material`}
      label="Material"
      items={items}
    />
  );
}

interface GeometricControlsCardProps {
  form: RenderForm;
  geometricName: string;
}

export default function GeometricControlsCard({ form, geometricName }: GeometricControlsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const renderConfig = useStore(form.store, (state) => state.values);

  const { data: geometricData } = getGeometricDataSafe(renderConfig, geometricName);

  function handleDeleteGeometric(name: string) {
    const newGeometrics = { ...renderConfig.geometrics };
    delete newGeometrics[name];

    const newConfig: RenderConfig = {
      ...renderConfig,
      geometrics: newGeometrics,
    };

    const fixed = fixReferences(newConfig);
    form.setFieldValue('geometrics', fixed.geometrics);
    form.setFieldValue('scenes', fixed.scenes);
    form.setFieldValue('materials', fixed.materials);
    form.setFieldValue('textures', fixed.textures);
  }

  // Build material select items
  const materialItems = Object.keys(renderConfig.materials ?? {}).map((key) => ({
    name: key,
    value: key,
  }));

  // Controls for a specific geometric type
  function renderControls(name: string): React.ReactNode {
    const { data } = getGeometricData(renderConfig, name);

    switch (data.type) {
      case 'box':
        return (
          <>
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.a`}
              label="Corner 1"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.b`}
              label="Corner 2"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          </>
        );
      case 'list':
        return (
          <>
            {data.geometrics.map((subName: string, i: number) => (
              <div key={subName}>
                {i > 0 && <Separator />}
                <NestedGeometricHeader geometricName={subName} renderConfig={renderConfig} />
                {renderControls(subName)}
              </div>
            ))}
          </>
        );
      case 'rotate_x':
      case 'rotate_y':
      case 'rotate_z': {
        const rotateData = data;
        const hasDegrees = 'degrees' in rotateData;
        return (
          <>
            <RangeControl
              form={form}
              field={`geometrics.${name}.${hasDegrees ? 'degrees' : 'radians'}`}
              label={hasDegrees ? 'Degrees of Rotation' : 'Radians of Rotation'}
              min={0}
              max={hasDegrees ? 360 : 2 * Math.PI}
              step={hasDegrees ? 1.0 : 0.01}
            />
            <Separator />
            <NestedGeometricHeader
              geometricName={rotateData.geometric}
              renderConfig={renderConfig}
            />
            {renderControls(rotateData.geometric)}
          </>
        );
      }
      case 'translate': {
        const transData = data;
        return (
          <>
            <NestedGeometricHeader
              geometricName={transData.geometric}
              renderConfig={renderConfig}
            />
            {renderControls(transData.geometric)}
          </>
        );
      }
      case 'parallelogram':
        return (
          <>
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.lower_left`}
              label="Lower Left"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.u`}
              valueLabels={['x', 'y', 'z']}
              type="number"
              label="<em>u</em> Vector"
            />
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.v`}
              valueLabels={['x', 'y', 'z']}
              type="number"
              label="<em>v</em> Vector"
            />
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          </>
        );
      case 'sphere':
        return (
          <>
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.center`}
              label="Center"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextInputControl
              form={form}
              field={`geometrics.${name}.radius`}
              label="Radius"
              valueLabel="radius"
              type="number"
            />
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          </>
        );
      case 'triangle':
        return (
          <>
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.a`}
              label="Point A"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.b`}
              label="Point B"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <TextArrayInputControl
              form={form}
              field={`geometrics.${name}.c`}
              label="Point C"
              valueLabels={['x', 'y', 'z']}
              type="number"
            />
            <GeometricMaterialSelect form={form} name={name} items={materialItems} />
          </>
        );
      default:
        return <h6 className="text-sm">Unknown or unimplemented geometric: {data.type}</h6>;
    }
  }

  return (
    <Card className="flex max-w-full flex-col bg-zinc-800! text-zinc-200! [&>div]:p-0!">
      <button
        type="button"
        className="flex items-center justify-between p-4 pr-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-bold">{geometricName}</h2>
        <div className="flex flex-row items-center gap-2">
          <h3 className="text-lg font-light italic">{geometricData.type}</h3>
          {isExpanded ? (
            <ChevronUpIcon className="h-8 w-auto" />
          ) : (
            <ChevronDownIcon className="h-8 w-auto" />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Separator />
            <div className="flex w-full flex-col gap-2 p-4">
              {renderControls(geometricName)}
              <DeleteGeometricButton onClick={() => handleDeleteGeometric(geometricName)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
