export function getGridColumnsStyle(percentage: number): { gridTemplateColumns: string } {
  return { gridTemplateColumns: `${percentage}fr ${100 - percentage}fr` };
}
