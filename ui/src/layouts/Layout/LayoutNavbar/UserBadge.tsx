import { useAuth } from '@/providers/Auth';
import { navigateToAPILogin } from '@/utils/api';
import { FaGithub } from 'react-icons/fa6';
import {
  Spinner,
  Dropdown,
  Avatar,
  DropdownItem,
  Button,
  DropdownHeader,
  DropdownDivider,
} from 'flowbite-react';

export function UserBadge() {
  const { isAuthenticated, user, clearAccessToken, isAuthLoading } = useAuth();

  function handleLogout() {
    clearAccessToken();
    window.location.reload();
  }

  if (isAuthLoading || (isAuthenticated && user === undefined)) {
    return (
      <div className="flex items-center gap-2">
        <Spinner color="info" size="sm" />
        <span className="text-sm text-white">Loading...</span>
      </div>
    );
  } else if (!isAuthenticated) {
    return (
      <Button
        outline
        className="dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200 hover:dark:border-zinc-400 hover:dark:bg-zinc-700"
        onClick={navigateToAPILogin}
      >
        <FaGithub className="mr-2 h-5 w-5" />
        Sign In with GitHub
      </Button>
    );
  }

  const validUser = user!; // type guard for isAuthenticated

  return (
    <Dropdown
      label={<Avatar img={validUser.avatar_url} alt="User avatar" size="md" />}
      arrowIcon={false}
      inline
    >
      <DropdownHeader>
        <span className="block text-sm">{validUser.username}</span>
        <span className="block text-sm font-bold">{validUser.role}</span>
      </DropdownHeader>
      <DropdownDivider />
      <DropdownItem onClick={handleLogout}>Sign Out</DropdownItem>
    </Dropdown>
  );
}
