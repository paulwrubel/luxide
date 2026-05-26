import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <h1 className="text-2xl">
        Perhaps you're looking for the{' '}
        <Link to="/renders" className="text-blue-500 hover:underline">
          renders page
        </Link>
        ?
      </h1>
    </div>
  );
}
