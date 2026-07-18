import { useResourceImageUrl } from '@/hooks/useResourceImageUrl';

export type ResourceImagePreviewProps = {
  resourceId: number | undefined;
};

export function ResourceImagePreview(props: ResourceImagePreviewProps) {
  const { resourceId } = props;

  const url = useResourceImageUrl(resourceId);

  if (resourceId === undefined) {
    return null;
  }

  if (url === null) {
    return (
      <div className="h-32 w-full animate-pulse rounded-md border border-zinc-700 bg-zinc-800" />
    );
  }

  return (
    <img
      src={url}
      alt="Texture image preview"
      className="h-32 w-full rounded-md border border-zinc-700 bg-zinc-900/50 object-contain"
    />
  );
}
