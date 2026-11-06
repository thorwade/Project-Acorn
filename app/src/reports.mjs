import { diaryMemberIds, diaryCategories, EDUCATIONAL_CATEGORIES } from './diary.mjs';

export function localDate(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
}

export function reportEntryDate(entry) {
  const date = new Date(`${entry.entryDate}T12:00:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.entryDate || '') && Number.isFinite(+date) && localDate(date) === entry.entryDate) return entry.entryDate;
  return Number.isFinite(entry.createdAtMs) ? localDate(new Date(entry.createdAtMs)) : '';
}

export function reportEntries(entries, from, to, members = ['family']) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
      !Number.isFinite(+start) || !Number.isFinite(+end) || localDate(start) !== from || localDate(end) !== to || start > end) {
    throw new Error('Choose valid dates, with the start on or before the end.');
  }
  if (!members.length) throw new Error('Select at least one family member or Whole family.');
  return entries.filter(entry => {const day=reportEntryDate(entry);return day && day >= from && day <= to;})
    .filter(entry => members.includes('family') || diaryMemberIds(entry).some(id => id === 'family' || members.includes(id)))
    .sort((a,b) => reportEntryDate(a).localeCompare(reportEntryDate(b)) || (a.createdAtMs || 0)-(b.createdAtMs || 0) || a.id.localeCompare(b.id));
}

export function buildLearningReport({entries, from, to, members, memberNames, title, preparedBy, introduction, reflection, nextSteps}) {
  const selected = reportEntries(entries, from, to, members);
  if (!selected.length) throw new Error('No dated diary entries match this period and family selection.');
  const notes = selected.map(entry => ({
    date: reportEntryDate(entry), title: entry.title, body: entry.body || '',
    members: diaryMemberIds(entry).map(id => id === 'family' ? 'Whole family' : memberNames[id] || 'Archived family member'),
    categories: diaryCategories(entry),
    attachments: (entry.attachments || []).map(file => ({name:file.name, type:file.type})),
  }));
  const categories = EDUCATIONAL_CATEGORIES.map(name => ({name, count:notes.filter(note => note.categories.includes(name)).length})).filter(item=>item.count);
  return {
    version:1, title:title.trim() || 'Family learning report', preparedBy:preparedBy.trim(), from, to,
    generatedOn:localDate(), introduction:introduction.trim(), reflection:reflection.trim(), nextSteps:nextSteps.trim(),
    audience: members.includes('family') ? 'Whole family' : members.map(id=>memberNames[id] || 'Family member').join(', '),
    days:new Set(notes.map(note=>note.date)).size, categories, entries:notes,
    evidenceCount:notes.reduce((total,note)=>total+note.attachments.length,0),
  };
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export function reportFilename(report) { return `acorn-learning-report-${report.from}-to-${report.to}.pdf`; }

export function reportHtml(report) {
  const e=escapeHtml;
  const date=value=>new Date(`${value}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const text=value=>`<p class="prose">${e(value)}</p>`;
  const subjects=report.categories.map(category=>`<div class="subject"><strong>${e(category.name)}</strong><span>${category.count} ${category.count===1?'entry':'entries'}</span></div>`).join('');
  const notes=report.entries.map((note,index)=>`<article><div class="meta">${e(date(note.date))} &nbsp; / &nbsp; RECORD ${index+1}</div><h3>${e(note.title)}</h3><div class="people">${note.members.map(e).join(' · ')}</div>${note.categories.length?`<div class="tags">${note.categories.map(category=>`<span>${e(category)}</span>`).join('')}</div>`:''}${text(note.body || 'A diary record was added with no written observation.')}${note.attachments.length?`<div class="evidence"><strong>Supporting evidence</strong><ul>${note.attachments.map(file=>`<li>${e(file.name)} (${e(file.type.startsWith('image/')?'Photo':file.type.startsWith('video/')?'Video':'File')})</li>`).join('')}</ul></div>`:''}</article>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(report.title)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#f2f0eb;color:#243c36;font:15px/1.6 Georgia,serif}.paper{max-width:860px;margin:0 auto;background:#fffdf8;padding:48px}header{padding-bottom:30px;border-bottom:3px solid #788c69}.brand,.meta{font:700 11px/1.5 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#647657}.brand{margin-bottom:30px}h1{font-size:38px;line-height:1.12;margin:0 0 18px;font-weight:normal}h2{font-size:23px;margin:32px 0 14px}h3{font-size:20px;line-height:1.3;margin:8px 0}.period{font:15px Arial,sans-serif;color:#6c5884}.prepared{font:12px/1.7 Arial,sans-serif;margin-top:16px;color:#64716c}.stats{display:flex;gap:12px;margin:26px 0}.stats div{flex:1;background:#eef2e8;border-radius:12px;padding:16px 12px}.stats b{display:block;font:28px Georgia,serif}.stats span,.people,.tags,.subject,.evidence{font:12px/1.6 Arial,sans-serif}.stats span{color:#526758}.prose{white-space:pre-wrap;overflow-wrap:anywhere}.subjects{display:grid;grid-template-columns:1fr 1fr;gap:8px}.subject{display:flex;justify-content:space-between;gap:10px;border:1px solid #dbe0d2;padding:10px;border-radius:8px}.subject span{white-space:nowrap;color:#6c5884}article{border-top:1px solid #dce1d5;padding:24px 0;break-inside:auto}.people{color:#607064}.tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}.tags span{background:#eee9f5;border-radius:8px;padding:3px 8px;color:#66517c}.evidence{border-left:3px solid #b2c29b;padding:8px 14px;background:#f3f5ed;overflow-wrap:anywhere}.evidence ul{margin:4px 0;padding-left:20px}.note{color:#6c746d;font:12px/1.6 Arial,sans-serif}footer{margin-top:32px;padding-top:15px;border-top:1px solid #dce1d5;font:11px Arial,sans-serif;color:#6c746d}h2,h3{break-after:avoid}@media(max-width:600px){.paper{padding:24px}h1{font-size:30px}.stats{gap:5px}.stats div{padding:10px 6px}.subjects{grid-template-columns:1fr}}@media print{body{background:white}.paper{padding:0;max-width:none}@page{size:A4;margin:18mm}}
    </style></head><body><main class="paper"><header><div class="brand">PROJECT ACORN &nbsp; / &nbsp; LEARNING RECORD</div><h1>${e(report.title)}</h1><div class="period">${e(date(report.from))} – ${e(date(report.to))}</div><div class="prepared">${e(report.audience)}${report.preparedBy?`<br>Prepared by ${e(report.preparedBy)}`:''}<br>Generated ${e(date(report.generatedOn))}</div></header><section class="stats"><div><b>${report.entries.length}</b><span>Diary entries</span></div><div><b>${report.days}</b><span>Days recorded</span></div><div><b>${report.categories.length}</b><span>Learning areas</span></div><div><b>${report.evidenceCount}</b><span>Evidence files</span></div></section><h2>Learning overview</h2>${text(report.introduction || `This report brings together ${report.entries.length} diary entries across ${report.days} recorded days. It documents the activities and observations recorded during the selected period.`)}<h2>Areas explored</h2>${subjects?`<div class="subjects">${subjects}</div>`:text('No educational categories were assigned to the selected entries.')}<p class="note">Counts reflect tagged diary entries. An entry may cover more than one learning area.</p>${report.reflection?`<h2>Progress & reflections</h2>${text(report.reflection)}`:''}<h2>Learning journal</h2>${notes}${report.nextSteps?`<h2>Looking ahead</h2>${text(report.nextSteps)}`:''}<h2>About this record</h2><p class="note">Based on the diary entries selected for this period, using the diary date where available, otherwise the date recorded. Supporting evidence is listed by filename; photos and videos are held separately in the family diary. This report records observations and does not assign attainment levels or assess learning beyond those observations.</p><footer>Project Acorn · Family learning report · ${e(date(report.from))} – ${e(date(report.to))}</footer></main></body></html>`;
}
