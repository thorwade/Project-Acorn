export function normalizeMembers(value, legacy = 'family') {
  const source = Array.isArray(value) ? value : [legacy];
  const ids = [...new Set(source.filter(id => typeof id === 'string' && id.trim().length > 0))];
  return !ids.length || ids.includes('family') ? ['family'] : ids;
}
export function addMember(value, id) {
  if (id === 'family') return ['family'];
  return normalizeMembers([...normalizeMembers(value).filter(item => item !== 'family'), id]);
}
export function removeMember(value, id) {
  return normalizeMembers(normalizeMembers(value).filter(item => item !== id));
}
export function diaryInSpace(entry, space) {
  return space === 'all' || normalizeMembers(entry.assigneeIds, entry.assigneeId).includes(space);
}
export function memberLabel(ids, children) {
  return normalizeMembers(ids).map(id => id === 'family' ? 'Whole family' : children.find(child => child.id === id)?.name || 'Child').join(', ');
}
