import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMembers, addMember, removeMember, diaryInSpace, memberLabel } from '../src/diary-members.mjs';
test('legacy single-child and family entries retain their original assignment',()=>{
 assert.deepEqual(normalizeMembers(undefined,'one'),['one']);
 assert.deepEqual(normalizeMembers(undefined),['family']);
 assert.equal(diaryInSpace({assigneeId:'one'},'one'),true);
 assert.equal(diaryInSpace({assigneeId:'family'},'one'),false);
});
test('multiple children share one entry and exclude children who did not attend',()=>{
 const entry={assigneeIds:['one','two','one']};
 assert.deepEqual(normalizeMembers(entry.assigneeIds),['one','two']);
 assert.equal(diaryInSpace(entry,'one'),true);assert.equal(diaryInSpace(entry,'two'),true);assert.equal(diaryInSpace(entry,'three'),false);
 assert.equal([entry].filter(item=>diaryInSpace(item,'all')).length,1);
 assert.equal(memberLabel(entry.assigneeIds,[{id:'one',name:'Alex'},{id:'two',name:'Sam'}]),'Alex, Sam');
});
test('whole family and individual selections are exclusive, with safe removal fallback',()=>{
 assert.deepEqual(addMember(['family'],'one'),['one']);
 assert.deepEqual(addMember(['one'],'two'),['one','two']);
 assert.deepEqual(addMember(['one','two'],'family'),['family']);
 assert.deepEqual(removeMember(['one','two'],'one'),['two']);
 assert.deepEqual(removeMember(['two'],'two'),['family']);
 assert.deepEqual(normalizeMembers([null,42,'']),['family']);
});
