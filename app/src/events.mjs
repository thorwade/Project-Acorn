const templates = [
  ['woodland', 'Woodland explorers', 'Nature', 'Carmarthen woodland meeting point', 3, 10, 4, 0, true, 'Explore leaves, tracks and seasonal changes together. Bring waterproofs and sturdy shoes.'],
  ['science', 'Kitchen science club', 'Science', 'Carmarthen community room', 7, 14, 1, 6, true, 'Try simple experiments with everyday materials. All equipment provided.'],
  ['art', 'Creative sketchbook morning', 'Art', 'Town centre studio', 5, 16, 0.5, 4, true, 'Draw, collage and share ideas at your own pace. Materials included.'],
  ['history', 'Time-travellers walk', 'History', 'Carmarthen town centre', 8, 17, 0, 0, true, 'An easy-paced local history walk with questions and observation challenges.'],
  ['stories', 'Stories and making', 'Reading', 'Carmarthen reading room', 3, 8, 1, 0, true, 'Enjoy a shared story followed by a small creative project.'],
  ['coding', 'Code a tiny game', 'Technology', 'Community computer room', 9, 17, 2, 8, false, 'A beginner-friendly coding workshop. Laptops provided; no previous experience needed.'],
  ['river', 'Riverside nature journal', 'Nature', 'Carmarthen riverside meeting point', 6, 15, 2, 0, true, 'Sketch and record wildlife from the path. No activities in the water.'],
  ['music', 'Family rhythm circle', 'Music', 'Community music room', 4, 12, 3, 5, true, 'Explore percussion, rhythm and musical games. Instruments provided.'],
  ['maths', 'Maths through games', 'Maths', 'Carmarthen learning room', 6, 13, 2, 3, false, 'Build confidence with puzzles, board games and practical number challenges.'],
  ['garden', 'Grow your own workshop', 'Nature', 'Community garden near Carmarthen', 5, 16, 7, 2, true, 'Plant seeds and learn about soil, food and seasons. Gloves and tools provided.'],
];

export function createSampleEvents(anchor = new Date()) {
  const base = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 10);
  return templates.map(([id, title, interest, venue, minAge, maxAge, distance, cost, parentStays, description], index) => {
    const start = new Date(base);
    start.setDate(start.getDate() + index + 1);
    if (index % 2) start.setHours(13);
    return { id, title, interest, venue, minAge, maxAge, distance, cost, parentStays, description,
      start: start.toISOString(), duration: 90, accessibility: 'Sample venue details are not verified. Ask the organiser about access and additional needs.',
      organiser: 'Fictional Acorn demonstration organiser', fictional: true };
  });
}

export function localDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function filterEvents(events, filters = {}, now = new Date()) {
  return events.filter(event => {
    if (new Date(event.start) < now) return false;
    if (filters.age !== '' && filters.age != null) {
      const age = Number(filters.age);
      if (!Number.isFinite(age) || age < event.minAge || age > event.maxAge) return false;
    }
    if (filters.date && localDate(event.start) !== filters.date) return false;
    if (filters.distance && event.distance > Number(filters.distance)) return false;
    if (filters.cost !== '' && filters.cost != null && event.cost > Number(filters.cost)) return false;
    if (filters.parentStays && !event.parentStays) return false;
    return true;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));
}

export function bookmarkKey(uid) {
  return `project-acorn-event-bookmarks:${uid}`;
}

export function toggleBookmark(ids, id) {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

export function readBookmarks(storage, uid, events) {
  if (!uid) return [];
  const value = JSON.parse(storage.getItem(bookmarkKey(uid)) || '[]');
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => typeof id === 'string' && events.some(event => event.id === id)))];
}
