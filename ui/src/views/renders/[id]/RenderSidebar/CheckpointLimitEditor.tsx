import { Button, Spinner, TextInput, Label } from 'flowbite-react';

export type CheckpointLimitEditorProps = {
  newCheckpointLimit: number;
  setNewCheckpointLimit: (value: number) => void;
  isUpdatingCheckpoints: boolean;
  totalCheckpoints: number;
  onUpdate: () => void;
};

export function CheckpointLimitEditor(props: CheckpointLimitEditorProps) {
  return (
    <>
      <Label>
        <span className="mb-1 block">Checkpoint Limit</span>
        <TextInput
          type="number"
          required
          className="w-full"
          value={props.newCheckpointLimit}
          onChange={(e) => props.setNewCheckpointLimit(Number(e.target.value))}
        />
      </Label>

      <Button
        color="default"
        outline
        onClick={props.onUpdate}
        disabled={
          props.isUpdatingCheckpoints ||
          !Number.isInteger(props.newCheckpointLimit) ||
          props.newCheckpointLimit <= props.totalCheckpoints
        }
      >
        {props.isUpdatingCheckpoints ? (
          <span className="flex items-center justify-center">
            <Spinner size="sm" className="mr-2" />
            Updating...
          </span>
        ) : (
          'Update'
        )}
      </Button>
    </>
  );
}
