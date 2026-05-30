import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import { HiArrowDownTray, HiClipboard, HiCheck } from 'react-icons/hi2';

export interface ConfigJSONModalProps {
  show: boolean;
  onClose: () => void;
  jsonString: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

export function ConfigJSONModal(props: ConfigJSONModalProps) {
  const { show, onClose, jsonString, copied, onCopy, onDownload } = props;

  return (
    <Modal show={show} onClose={onClose} size="xl" dismissible>
      <ModalHeader>Render Config JSON</ModalHeader>
      <ModalBody>
        <div className="relative">
          <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-800 p-4 text-sm text-zinc-200">
            <code>{jsonString}</code>
          </pre>
          <Button size="xs" color="gray" className="absolute top-2 right-2" onClick={onCopy}>
            {copied ? <HiCheck /> : <HiClipboard />}
          </Button>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="default" onClick={onDownload}>
          <HiArrowDownTray />
          Download
        </Button>
        <Button color="gray" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
