import test from 'node:test';
import assert from 'node:assert/strict';
import {todayDate,validDiaryDate,diaryDate,dateLabel,sortDiary,inDiaryDateRange} from '../src/diary-dates.mjs';
test('Today follows London calendar around midnight and daylight savings',()=>{
 assert.equal(todayDate(new Date('2026-06-01T23:30:00Z')),'2026-06-02');
 assert.equal(todayDate(new Date('2026-12-01T23:30:00Z')),'2026-12-01');
});
test('date-only values are validated and displayed without timezone conversion',()=>{
 assert.equal(validDiaryDate('2024-02-29'),true);assert.equal(validDiaryDate('2026-02-29'),false);
 assert.equal(validDiaryDate('2026-13-01'),false);assert.equal(validDiaryDate(''),false);
 assert.equal(dateLabel('2026-10-14'),'14 Oct 2026');
});
test('explicit diary date overrides audit timestamp with legacy fallback',()=>{
 const createdAt={toDate:()=>new Date('2026-06-01T23:30:00Z')};
 assert.equal(diaryDate('2026-05-10',createdAt),'2026-05-10');
 assert.equal(diaryDate(undefined,createdAt),'2026-06-02');assert.equal(diaryDate(undefined,null),'');
});
test('diary sorting uses entry date rather than creation order and preserves input',()=>{
 const entries=[{id:'old-event',entryDate:'2026-01-01',createdMillis:200},{id:'recent-event',entryDate:'2026-10-01',createdMillis:100}];
 assert.deepEqual(sortDiary(entries).map(e=>e.id),['recent-event','old-event']);assert.equal(entries[0].id,'old-event');
});

test('date range filtering is inclusive and uses the diary day',()=>{
 const entry={entryDate:'2026-10-10'};
 assert.equal(inDiaryDateRange(entry,'2026-10-10','2026-10-10'),true);
 assert.equal(inDiaryDateRange(entry,'2026-10-11',''),false);
 assert.equal(inDiaryDateRange(entry,'','2026-10-09'),false);
 assert.equal(inDiaryDateRange({entryDate:''}),true);
 assert.equal(Boolean(inDiaryDateRange({entryDate:''},'2026-10-01','')),false);
});
