export function spaceLabel(id, children) {
  if (id === 'all') return 'All spaces';
  if (id === 'family') return 'Whole family';
  return children.find(child=>child.id===id)?.name ?? 'Child';
}
export function formatBytes(size) {
  return size >= 1024*1024 ? `${(size/1024/1024).toFixed(1)} MB` : `${Math.max(1,Math.round(size/1024))} KB`;
}
