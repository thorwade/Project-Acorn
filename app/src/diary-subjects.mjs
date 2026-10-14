export const SUBJECTS = Object.freeze([
  'English', 'Maths', 'Science', 'Art', 'Geography', 'History',
  'Computing', 'Design and Technology', 'Music', 'Drama',
  'Physical Education', 'Religious Education', 'PSHE', 'Languages', 'Welsh',
]);

export function normalizeSubjects(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(subject => SUBJECTS.includes(subject)))];
}
