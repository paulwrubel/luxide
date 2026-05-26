import { Card } from 'flowbite-react';
import { Link } from 'react-router-dom';

export default function NewRenderCard() {
  return (
    <Link to="/renders/new">
      <Card className="h-66 border-2 border-dashed border-zinc-50! bg-zinc-950! text-zinc-200! hover:bg-zinc-900! [&>div]:p-0!">
        <div className="flex h-full w-full items-center justify-center gap-2">
          <PlusCircleIcon />
          <h2 className="text-lg font-normal italic">New Render</h2>
        </div>
      </Card>
    </Link>
  );
}

function PlusCircleIcon() {
  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
