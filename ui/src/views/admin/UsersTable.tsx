import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react';
import type { Role, User } from '@/utils/api';
import { useAllUsersQuery } from '@/hooks/useAllUsers';
import { useUpdateUserRoleMutation } from '@/hooks/useUserMutations';
import { useAuth } from '@/providers/auth';
import { RoleChangeModal } from './RoleChangeModal';
import { QuotaEditModal } from './QuotaEditModal';

function quotaDisplay(value: number | null): string {
  if (value === null) {
    return 'Unlimited';
  }
  return String(value);
}

export function UsersTable() {
  const { user: currentUser } = useAuth();

  const navigate = useNavigate();

  const { data: users, isPending, isError, error } = useAllUsersQuery();
  const { mutate: updateUserRole, isPending: updateUserRoleIsPending } =
    useUpdateUserRoleMutation();

  const [confirmTarget, setConfirmTarget] = useState<{ user: User; newRole: Role } | null>(null);
  const [quotaEditUser, setQuotaEditUser] = useState<User | null>(null);

  const handleConfirmRoleChange = () => {
    if (!confirmTarget) {
      return;
    }
    updateUserRole({ userID: confirmTarget.user.id, role: confirmTarget.newRole });
    setConfirmTarget(null);
  };

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-zinc-300">Users</h2>
      {isPending && (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      )}
      {isError && <Alert color="red">Error loading users: {error?.message}</Alert>}
      {!isPending && !isError && users && (
        <div className="overflow-x-auto rounded-lg border border-zinc-700">
          <Table theme={{ root: { base: 'w-full text-left text-sm text-zinc-300' } }}>
            <TableHead>
              <TableRow>
                <TableHeadCell>ID</TableHeadCell>
                <TableHeadCell>User</TableHeadCell>
                <TableHeadCell>Role</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Allowed Renders</TableHeadCell>
                <TableHeadCell>Allowed Checkpoints per Render</TableHeadCell>
                <TableHeadCell>Allowed Pixels per Render</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar img={user.avatar_url} size="sm" rounded />
                      <span className="font-medium text-white">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge color={user.role === 'admin' ? 'green' : 'gray'}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{quotaDisplay(user.max_renders)}</TableCell>
                  <TableCell>{quotaDisplay(user.max_checkpoints_per_render)}</TableCell>
                  <TableCell>{quotaDisplay(user.max_render_pixel_count)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        color="default"
                        size="xs"
                        onClick={() => navigate(`/renders?user_id=${user.id}`)}
                      >
                        View Renders
                      </Button>
                      <Button
                        color="default"
                        size="xs"
                        disabled={user.id === currentUser!.id}
                        onClick={() =>
                          setConfirmTarget({
                            user,
                            newRole: user.role === 'admin' ? 'user' : 'admin',
                          })
                        }
                      >
                        {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      </Button>
                      <Button color="default" size="xs" onClick={() => setQuotaEditUser(user)}>
                        Quotas
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {!isPending && !isError && users && users.length === 0 && (
        <p className="text-zinc-400">No users found.</p>
      )}

      <RoleChangeModal
        confirmTarget={confirmTarget}
        isPending={updateUserRoleIsPending}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmRoleChange}
      />

      {quotaEditUser && (
        <QuotaEditModal user={quotaEditUser} onClose={() => setQuotaEditUser(null)} />
      )}
    </section>
  );
}
