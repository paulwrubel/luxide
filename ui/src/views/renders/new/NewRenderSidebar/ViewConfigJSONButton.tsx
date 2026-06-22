import { Button } from 'flowbite-react';
import { HiEye } from 'react-icons/hi2';

export type ViewConfigJSONButtonProps = {
  onClick: () => void;
};

export function ViewConfigJSONButton(props: ViewConfigJSONButtonProps) {
  const { onClick } = props;

  return (
    <Button color="gray" onClick={onClick}>
      <HiEye />
      View JSON
    </Button>
  );
}
