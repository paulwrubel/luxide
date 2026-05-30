import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import { HiArrowDownTray, HiClipboard, HiCheck } from 'react-icons/hi2';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/hljs';

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
          <SyntaxHighlighter
            language="json"
            style={nightOwl}
            customStyle={{
              borderRadius: '0.5rem',
              maxHeight: '24rem',
              overflow: 'auto',
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
            }}
          >
            {jsonString}
          </SyntaxHighlighter>
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
