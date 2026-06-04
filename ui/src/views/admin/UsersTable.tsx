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

export type UsersTableProps = {
  users: User[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  onRoleToggle: (user: User, newRole: Role) => void;
  currentUserId: number;
};

export function UsersTable(props: UsersTableProps) {
  const { users, isPending, isError, error, onRoleToggle, currentUserId } = props;

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
                <TableHeadCell>User</TableHeadCell>
                <TableHeadCell>Role</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
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
                  <TableCell>
                    <Button
                      color="default"
                      size="xs"
                      disabled={user.id === currentUserId}
                      onClick={() => onRoleToggle(user, user.role === 'admin' ? 'user' : 'admin')}
                    >
                      {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                    </Button>
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
    </section>
  );
}
