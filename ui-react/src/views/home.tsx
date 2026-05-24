import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="m-auto">
      <h3 className="text-2xl">
        Perhaps you're looking for the{' '}
        <Link to="/renders" className="text-blue-500 hover:underline">
          renders page
        </Link>
        ?
      </h3>
    </div>
  );
}
