import { useParams } from 'react-router-dom';

export default function RenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex-1 p-8 text-zinc-200">
      <h1 className="text-2xl font-bold">Render {id}</h1>
      <p className="mt-2 text-zinc-400">Coming in Phase 5</p>
    </div>
  );
}
