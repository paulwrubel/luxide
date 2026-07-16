import {
  Alert,
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react';
import { useAllResourceMetadataQuery } from '@/hooks/useResources';
import { useDeleteResourceMutation } from '@/hooks/useResourceMutations';
import { formatResourceType } from '@/utils/api';

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function ResourcesTable() {
  const { data: resources, isPending, isError, error } = useAllResourceMetadataQuery();
  const { mutate: deleteResource, isPending: isDeleting } = useDeleteResourceMutation();

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-zinc-300">Your Resources</h2>
      {isPending && (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      )}
      {isError && <Alert color="red">Error loading resources: {error?.message}</Alert>}
      {!isPending && !isError && resources && (
        <div className="overflow-x-auto rounded-lg border border-zinc-700">
          <Table theme={{ root: { base: 'w-full text-left text-sm text-zinc-300' } }}>
            <TableHead>
              <TableRow>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>MIME Type</TableHeadCell>
                <TableHeadCell>Size</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium text-white">{resource.name}</TableCell>
                  <TableCell>{formatResourceType(resource.resource_type)}</TableCell>
                  <TableCell>{resource.mime_type}</TableCell>
                  <TableCell>{formatBytes(resource.byte_size)}</TableCell>
                  <TableCell>{new Date(resource.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      color="red"
                      size="xs"
                      disabled={isDeleting}
                      onClick={() => {
                        deleteResource(resource.id);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {!isPending && !isError && resources?.length === 0 && (
        <p className="m-4 text-center text-zinc-400">
          No resources found. Upload one to get started.
        </p>
      )}
    </section>
  );
}
