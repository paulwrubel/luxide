import { useMemo } from 'react';
import { StorageUsagePanel } from '@/components/StorageUsagePanel';
import { useResourceStorageUsageQuery } from '@/hooks/useResourceStorageUsage';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';
import { useAuth } from '@/providers/Auth';
import { useUserQuery } from '@/hooks/useUser';

export function ResourceStorageUsagePanel() {
  const { user } = useAuth();
  const { targetUserID } = useAdminUserOverride();
  const { data: targetUser } = useUserQuery(targetUserID!, { enabled: targetUserID !== undefined });
  const { data, isSuccess, isPending, isError, error } = useResourceStorageUsageQuery();

  const maxBytes = useMemo(() => {
    if (targetUserID === undefined) {
      return user?.max_resource_storage_bytes ?? undefined;
    }
    return targetUser?.max_resource_storage_bytes ?? undefined;
  }, [targetUserID, user?.max_resource_storage_bytes, targetUser?.max_resource_storage_bytes]);

  return (
    <StorageUsagePanel
      title="Resource Storage Usage"
      label="total resource storage used"
      bytes={data?.bytes ?? 0}
      maxBytes={maxBytes}
      isSuccess={isSuccess}
      isPending={isPending}
      isError={isError}
      error={error}
    />
  );
}
