import test from 'node:test';
import assert from 'node:assert/strict';
import {reportPdf} from '../src/report-pdf.mjs';

test('PDF export produces a paginated downloadable file with report text',async()=>{
  const model={title:'Fictional learning report',preparedBy:'Example parent',audience:'Whole family',from:'2026-11-01',to:'2026-11-06',generatedOn:'2026-11-06',days:1,categories:[{name:'Science',count:1}],evidenceCount:1,introduction:'A week of exploring nature.',reflection:'We noticed more detail.',nextSteps:'Explore local woodland.',entries:[{title:'Learning outdoors',date:'2026-11-02',members:['Example child'],categories:['Science'],body:'We observed trees, counted leaves and recorded our questions. '.repeat(180),attachments:[{name:'leaf-study.jpg',type:'image/jpeg'}]}]};
  const file=await reportPdf(model);
  assert.equal(file.type,'application/pdf');
  assert.equal(file.name,'acorn-learning-report-2026-11-01-to-2026-11-06.pdf');
  const bytes=new Uint8Array(await file.arrayBuffer());
  const raw=new TextDecoder().decode(bytes);
  assert.ok(raw.startsWith('%PDF-'));
  assert.ok(raw.includes('leaf-study.jpg'));
  assert.ok(raw.includes('Looking ahead'));
  assert.ok((raw.match(/\/Type \/Page\b/g)||[]).length>2);
});
