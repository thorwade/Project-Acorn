export function todayDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = type => parts.find(item=>item.type===type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function validDiaryDate(value) {
  if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}
export function diaryDate(value, createdAt) {
  if(validDiaryDate(value))return value;
  const date = createdAt?.toDate?.();
  return date instanceof Date && !Number.isNaN(date.getTime()) ? todayDate(date) : '';
}
export function dateLabel(value) {
  return validDiaryDate(value) ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`)) : 'Date unavailable';
}
export function sortDiary(entries) {
  return [...entries].sort((a,b)=>(b.entryDate || '').localeCompare(a.entryDate || '') || (b.createdMillis || 0)-(a.createdMillis || 0));
}

export function inDiaryDateRange(entry, from = '', to = '') {
  return (!from || (entry.entryDate && entry.entryDate >= from)) && (!to || (entry.entryDate && entry.entryDate <= to));
}
