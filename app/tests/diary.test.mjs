import test from 'node:test';
import assert from 'node:assert/strict';
import { diaryMemberIds, diaryCategories, diaryMatchesSpace, toggleDiaryMember } from '../src/diary.mjs';

test('a saved multi-member entry appears for every selected member after reload', () => {
  const entry = JSON.parse(JSON.stringify({ assigneeId: 'alice', assigneeIds: ['alice', 'bob'], educationalCategories: ['Science', 'Maths & numeracy'] }));
  assert.equal(diaryMatchesSpace(entry, 'alice'), true);
  assert.equal(diaryMatchesSpace(entry, 'bob'), true);
  assert.equal(diaryMatchesSpace(entry, 'other'), false);
  assert.equal(diaryMatchesSpace(entry, 'all'), true);
  assert.deepEqual(diaryCategories(entry), ['Maths & numeracy', 'Science']);
});

test('older entries keep their original member and need no categories', () => {
  assert.deepEqual(diaryMemberIds({assigneeId:'alice'}), ['alice']);
  assert.equal(diaryMatchesSpace({assigneeId:'alice'}, 'alice'), true);
  assert.deepEqual(diaryMemberIds({}), ['family']);
  assert.deepEqual(diaryCategories({}), []);
});

test('member checkboxes support multiple choices and a separate whole-family choice', () => {
  let ids = toggleDiaryMember(['family'], 'alice');
  ids = toggleDiaryMember(ids, 'bob');
  assert.deepEqual(ids, ['alice', 'bob']);
  assert.deepEqual(toggleDiaryMember(ids, 'alice'), ['bob']);
  assert.deepEqual(toggleDiaryMember(ids, 'family'), ['family']);
});
