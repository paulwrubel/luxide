import { useState } from 'react';
import { useUpdateUserRole } from '@/hooks/useAdminMutations';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import type { Role, User } from '@/utils/api';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useAuth } from '@/providers/auth';
import { StorageUsagePanel } from './StorageUsagePanel';
import { UsersTable } from './UsersTable';
import { RoleChangeModal } from './RoleChangeModal';

export function AdminPage() {
  const { user: currentUser } = useAuth();

  const usersQuery = useAllUsers();
  const usageQuery = useStorageUsage();
  const { mutate: updateUserRole, isPending: updateUserRoleIsPending } = useUpdateUserRole();

  const [confirmTarget, setConfirmTarget] = useState<{ user: User; newRole: Role } | null>(null);

  const handleConfirmRoleChange = () => {
    if (!confirmTarget) {
      return;
    }
    updateUserRole({ userID: confirmTarget.user.id, role: confirmTarget.newRole });
    setConfirmTarget(null);
  };

  return (
    <div className="flex w-full flex-col gap-6 overflow-y-auto p-12">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>

      <StorageUsagePanel
        isPending={usageQuery.isPending}
        isError={usageQuery.isError}
        error={usageQuery.error}
        storageUsage={usageQuery.data}
      />

      <UsersTable
        users={usersQuery.data}
        isPending={usersQuery.isPending}
        isError={usersQuery.isError}
        error={usersQuery.error}
        onRoleToggle={(user, newRole) => setConfirmTarget({ user, newRole })}
        currentUserId={currentUser!.id}
      />

      <RoleChangeModal
        confirmTarget={confirmTarget}
        isPending={updateUserRoleIsPending}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmRoleChange}
      />
    </div>
  );
}
