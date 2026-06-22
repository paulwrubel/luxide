import { useNavigate } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/Auth';
import { navigateToAPILogin } from '@/utils/api';
import type { User } from '@/utils/api';
import { FaGithub } from 'react-icons/fa';

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative flex flex-1 items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,var(--color-primary-500)_0%,transparent_60%)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,var(--color-secondary-500)_0%,transparent_60%)] opacity-50" />
      </div>
      {isAuthenticated && user ? <AuthenticatedWelcome user={user} /> : <LandingHero />}
    </div>
  );
}

function LandingHero() {
  return (
    <div className="relative z-10 flex flex-col items-center gap-6 text-center">
      <motion.h1
        className="from-primary-400 to-secondary-400 bg-linear-to-r bg-clip-text text-6xl font-bold text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Luxide
      </motion.h1>
      <motion.p
        className="text-lg text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Path Tracing Render Manager
      </motion.p>
      <motion.p
        className="max-w-md text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Create, monitor, and manage path-traced renders with a powerful multi-tenant platform.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Button color="default" onClick={() => navigateToAPILogin().catch(console.error)}>
          <FaGithub className="mr-2 h-5 w-5" />
          Sign in with GitHub
        </Button>
      </motion.div>
    </div>
  );
}

function AuthenticatedWelcome({ user }: { user: User }) {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 flex flex-col items-center gap-6 text-center">
      <motion.img
        src={user.avatar_url}
        alt={`${user.username}'s avatar`}
        className="h-20 w-20 rounded-full border-2 border-zinc-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      />
      <motion.h1
        className="text-3xl font-bold text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Welcome back, {user.username}
      </motion.h1>
      <motion.div
        className="flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Button color="default" onClick={() => navigate('/renders')}>
          View Renders
        </Button>
      </motion.div>
    </div>
  );
}
