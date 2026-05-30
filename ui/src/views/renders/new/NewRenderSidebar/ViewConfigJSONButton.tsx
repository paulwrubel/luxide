import { Button } from 'flowbite-react';
import { HiEye } from 'react-icons/hi2';

export interface ViewConfigJSONButtonProps {
  onClick: () => void;
}

export const ViewConfigJSONButton = ({ onClick }: ViewConfigJSONButtonProps) => {
  return (
    <Button size="sm" color="gray" onClick={onClick}>
      <HiEye />
      View JSON
    </Button>
  );
};
