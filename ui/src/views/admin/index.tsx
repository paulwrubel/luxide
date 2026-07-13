import { RenderStorageUsagePanel } from './RenderStorageUsagePanel';
import { UsersTable } from './UsersTable';

export function AdminPage() {
  return (
    <div className="flex w-full flex-col gap-6 overflow-y-auto p-12">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>

      <RenderStorageUsagePanel />
      <UsersTable />
    </div>
  );
}
