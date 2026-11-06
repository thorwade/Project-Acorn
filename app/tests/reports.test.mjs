import test from 'node:test';
import assert from 'node:assert/strict';
import {reportEntries,buildLearningReport,reportHtml} from '../src/reports.mjs';

const note=(id,date,ids=['alice'])=>({id,createdAtMs:+new Date(date),title:'Forest learning',body:'Counted leaves and noticed patterns.',assigneeIds:ids,educationalCategories:['Science','Maths & numeracy'],attachments:[]});
const entries=[note('before','2026-11-01T23:59:59'),note('start','2026-11-02T00:00:00'),note('end','2026-11-03T23:59:59.999'),note('after','2026-11-04T00:00:00'),{id:'undated',createdAtMs:null}];
test('existing chosen diary dates and legacy subject tags remain available in reports',()=>{
  const legacy={...note('dated','2026-11-06T12:00:00'),entryDate:'2026-10-01',subjects:['English','Welsh']};
  delete legacy.educationalCategories;
  const model=buildLearningReport({entries:[legacy],from:'2026-10-01',to:'2026-10-01',members:['family'],memberNames:{alice:'Alice'},title:'Legacy report',preparedBy:'Parent',introduction:'',reflection:'',nextSteps:''});
  assert.equal(model.entries[0].date,'2026-10-01');
  assert.deepEqual(model.entries[0].categories,['English & literacy','Welsh']);
});
test('date range includes both whole boundary days and excludes undated entries',()=>{
  assert.deepEqual(reportEntries(entries,'2026-11-02','2026-11-03').map(note=>note.id),['start','end']);
});
test('invalid, reversed and impossible dates are rejected',()=>{
  for(const [from,to] of [['','2026-11-03'],['2026-11-04','2026-11-03'],['2026-02-30','2026-03-01']])assert.throws(()=>reportEntries(entries,from,to));
});
test('member selection includes shared notes and excludes other individuals',()=>{
  const records=[note('one','2026-11-02T12:00:00',['alice','bob']),note('shared','2026-11-02T13:00:00',['family']),note('other','2026-11-02T14:00:00',['charlie'])];
  assert.deepEqual(reportEntries(records,'2026-11-02','2026-11-02',['bob']).map(note=>note.id),['one','shared']);
});
test('report uses recorded evidence, escapes text, and keeps cloud snapshot independent',()=>{
  const source=[note('one','2026-11-02T12:00:00')];
  source[0].body='<script>alert("test")</script>';
  source[0].attachments=[{name:'Leaf photo.jpg',type:'image/jpeg',path:'private/path'}];
  const model=buildLearningReport({entries:source,from:'2026-11-02',to:'2026-11-02',members:['alice'],memberNames:{alice:'Alice'},title:'Learning <report>',preparedBy:'Parent',introduction:'',reflection:'',nextSteps:''});
  assert.equal(model.days,1);assert.equal(model.evidenceCount,1);assert.equal(model.categories[0].count,1);
  const saved=JSON.parse(JSON.stringify(model));source[0].body='Changed after saving';
  const html=reportHtml(saved);
  assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('private/path'));
  assert.ok(html.includes('Leaf photo.jpg'));assert.ok(!html.includes('Changed after saving'));
});
