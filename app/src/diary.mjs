export const EDUCATIONAL_CATEGORIES = [
  'English & literacy', 'Maths & numeracy', 'Science', 'History',
  'Geography', 'Art & design', 'Music', 'Computing & technology',
  'Languages', 'Physical education', 'Life skills', 'Nature & outdoors',
  'Personal, social & emotional development',
  'Drama', 'Welsh', 'Religious education',
];

export function diaryMemberIds(entry) {
  const ids = Array.isArray(entry.assigneeIds)
    ? [...new Set(entry.assigneeIds.filter(id => typeof id === 'string' && id))]
    : [];
  return ids.length ? ids : [entry.assigneeId || 'family'];
}

export function diaryCategories(entry) {
  const aliases = {'English':'English & literacy','Maths':'Maths & numeracy','Art':'Art & design','Computing':'Computing & technology','Design and Technology':'Art & design','Physical Education':'Physical education','Religious Education':'Religious education','PSHE':'Personal, social & emotional development'};
  const source = Array.isArray(entry.educationalCategories) ? entry.educationalCategories
    : Array.isArray(entry.subjects) ? entry.subjects.map(subject => aliases[subject] || subject) : [];
  return EDUCATIONAL_CATEGORIES.filter(category => source.includes(category));
}

export function diaryMatchesSpace(entry, space) {
  return space === 'all' || diaryMemberIds(entry).includes(space);
}

export function toggleDiaryMember(ids, id) {
  if (ids.includes(id)) return ids.filter(value => value !== id);
  return id === 'family' ? ['family'] : [...ids.filter(value => value !== 'family'), id];
}
