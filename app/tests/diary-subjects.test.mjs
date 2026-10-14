import test from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECTS, normalizeSubjects } from '../src/diary-subjects.mjs';

test('older or malformed diary subjects are safely optional', () => {
  for (const value of [undefined, null, '', {}, 42]) assert.deepEqual(normalizeSubjects(value), []);
});
test('one diary entry retains multiple valid subjects, without duplicates or unknown values', () => {
  assert.deepEqual(normalizeSubjects(['Art','Science','Art',null,'Unknown','English']), ['Art','Science','English']);
  assert.deepEqual(normalizeSubjects([]), []);
});
test('familiar requested subjects are available', () => {
  for (const subject of ['Art','Maths','Science','Geography','English']) assert.ok(SUBJECTS.includes(subject));
});
