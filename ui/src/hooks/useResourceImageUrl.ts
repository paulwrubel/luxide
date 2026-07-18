import { useEffect, useMemo } from 'react';
import { useResourceDataQuery } from './useResourceData';

export function useResourceImageUrl(resourceId: number | undefined): string | null {
  const { data: blob } = useResourceDataQuery(resourceId ?? 0, {
    enabled: resourceId !== undefined,
  });

  const url = useMemo(() => {
    if (blob === null || blob === undefined) {
      return null;
    }
    return URL.createObjectURL(blob);
  }, [blob]);

  useEffect(() => {
    if (url === null) {
      return;
    }
    // revoke the object URL when it is replaced or unmounted to avoid leaking memory
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return resourceId !== undefined ? url : null;
}
