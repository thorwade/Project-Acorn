import test from 'node:test';
import assert from 'node:assert/strict';
import { createSampleEvents, filterEvents, localDate, toggleBookmark, readBookmarks, bookmarkKey } from '../src/events.mjs';
const now = new Date(2026, 8, 18, 9);
const events = createSampleEvents(now);
test('ten unique, explicitly fictional upcoming events', () => {
  assert.equal(events.length, 10); assert.equal(new Set(events.map(e => e.id)).size, 10);
  assert.ok(events.every(e => e.fictional && new Date(e.start) > now));
});
test('age includes both boundaries and excludes out-of-range ages', () => {
  assert.equal(filterEvents([events[0]], { age: 3 }, now).length, 1);
  assert.equal(filterEvents([events[0]], { age: 10 }, now).length, 1);
  assert.equal(filterEvents([events[0]], { age: 11 }, now).length, 0);
});
test('filters combine age, local date, distance, free cost and parent attendance', () => {
  assert.deepEqual(filterEvents(events, { age: 5, date: localDate(events[0].start), distance: 5, cost: 0, parentStays: true }, now).map(e => e.id), ['woodland']);
});
test('free-only filtering excludes paid events', () => assert.ok(filterEvents(events, { cost: 0 }, now).every(e => e.cost === 0)));
test('past events and invalid ages do not match', () => {
  assert.equal(filterEvents(events, {}, new Date(2027, 0, 1)).length, 0);
  assert.equal(filterEvents(events, { age: 'bad' }, now).length, 0);
});
test('bookmarks can be added and removed without duplicates', () => {
  assert.deepEqual(toggleBookmark([], 'art'), ['art']);
  assert.deepEqual(toggleBookmark(['art', 'science'], 'art'), ['science']);
});
test('bookmark namespaces are isolated between accounts', () => assert.notEqual(bookmarkKey('family-a'), bookmarkKey('family-b')));
test('stored bookmarks reject unknown events and duplicate IDs', () => {
  const storage = { getItem: () => JSON.stringify(['art', 'art', 'missing', 9]) };
  assert.deepEqual(readBookmarks(storage, 'family-a', events), ['art']);
  assert.deepEqual(readBookmarks(storage, null, events), []);
});
