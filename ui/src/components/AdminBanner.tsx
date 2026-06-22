import { useAuth } from '@/providers/Auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';
import { useAllUsersQuery } from '@/hooks/useAllUsers';
import { Badge, Tooltip } from 'flowbite-react';
import { HiXMark } from 'react-icons/hi2';

export function AdminBanner() {
  const { targetUserID, clearTargetUserID } = useAdminUserOverride();
  const { user: currentUser } = useAuth();

  const isAdmin = currentUser?.role === 'admin';

  // only fetch users when impersonating AND the current user is an admin
  const { data: allUsers } = useAllUsersQuery({ enabled: isAdmin && targetUserID !== undefined });

  // don't render if not impersonating or not an admin
  if (targetUserID === undefined || !isAdmin) {
    return null;
  }

  const targetUser = allUsers?.find((u) => u.id === targetUserID);
  const displayName = targetUser?.username ?? `#${targetUserID}`;

  return (
    <Badge size="sm" color="red" className="rounded-full p-2 dark:hover:bg-red-200!">
      <span className="flex items-center gap-2">
        <span className="select-none">
          viewing as <em>{displayName}</em>
        </span>
        <Tooltip content="Switch back to my renders">
          <button
            type="button"
            onClick={clearTargetUserID}
            className="flex cursor-pointer items-center justify-center rounded p-0.5 text-red-900 hover:text-black"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </Tooltip>
      </span>
    </Badge>
  );
}
