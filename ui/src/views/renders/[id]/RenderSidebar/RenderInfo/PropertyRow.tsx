export type PropertyRowProps = {
  label: string;
  value: React.ReactNode;
};

export function PropertyRow(props: PropertyRowProps) {
  const { label, value } = props;

  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  );
}
