export const THEMES = ['woodland', 'sky', 'sunset'];
export function validCode(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value); }
export function circleInput(form) {
  const name = form.name.trim(), about = form.about.trim();
  if (!name || name.length > 80 || about.length > 500 || !THEMES.includes(form.theme)) throw new Error('Add a name (up to 80 characters), a description (up to 500), and a cover style.');
  return { name, about, theme: form.theme };
}
export function eventInput(form, now = Date.now()) {
  const title = form.title.trim(), body = form.body.trim(), venue = form.venue.trim();
  const start = new Date(form.startsAt), end = new Date(form.endsAt);
  const costPence = Math.round(Number(form.cost) * 100), minAge = Number(form.minAge), maxAge = Number(form.maxAge);
  if (!title || title.length > 120 || body.length > 4000 || !venue || venue.length > 200) throw new Error('Add an event title and meeting place within the displayed limits.');
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || +start < now || +end <= +start || +end - +start > 7 * 86400000) throw new Error('Choose a future start and a later finish, no more than seven days apart.');
  if (!Number.isFinite(Number(form.cost)) || costPence < 0 || costPence > 100000 || !Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < 0 || maxAge > 18 || minAge > maxAge) throw new Error('Check the cost (£0–£1,000) and age range (0–18).');
  if (!['organising','attending'].includes(form.kind) || typeof form.parentStays !== 'boolean') throw new Error('Choose the event type and parent attendance.');
  return {title,body,venue,startsAt:start,endsAt:end,costPence,minAge,maxAge,parentStays:form.parentStays,kind:form.kind,status:'scheduled'};
}
export function filterCircleEvents(events, filters, now = Date.now()) {
  return events.filter(e => e.status === 'scheduled' && e.startsAt?.toMillis() >= now
    && (!filters.circle || e.circleId === filters.circle)
    && (filters.age === '' || (Number(filters.age) >= e.minAge && Number(filters.age) <= e.maxAge))
    && (!filters.free || e.costPence === 0)
    && (!filters.parentStays || e.parentStays))
    .sort((a,b) => a.startsAt.toMillis() - b.startsAt.toMillis());
}
