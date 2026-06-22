import { useState, useCallback } from 'react';
import { Button, type ButtonProps } from 'flowbite-react';
import { HiEye } from 'react-icons/hi2';
import { ConfigJSONModal } from './ConfigJSONModal';
import type { RawRenderConfig } from '@/utils/render/config';

export type ViewRenderJSONButtonProps = {
  config: RawRenderConfig;
  size?: ButtonProps['size'];
};

export function ViewRenderJSONButton(props: ViewRenderJSONButtonProps) {
  const { config, size = 'sm' } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const configJSON = JSON.stringify(config, null, 2);
  const configName = config.name || 'render-config';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(configJSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently ignore
    }
  }, [configJSON]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([configJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${configName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [configJSON, configName]);

  return (
    <>
      <Button color="gray" size={size} onClick={() => setIsModalVisible(true)}>
        <HiEye />
        View JSON
      </Button>
      <ConfigJSONModal
        show={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        jsonString={configJSON}
        copied={copied}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />
    </>
  );
}
