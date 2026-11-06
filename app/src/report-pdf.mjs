import { reportFilename } from './reports.mjs';

export async function reportPdf(report) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({unit:'mm',format:'a4'});
  const width = 174;
  let y=24;
  const colour=[40,66,54];
  const addPage=()=>{pdf.addPage();y=24;};
  const text=(value,{size=10,bold=false,colour:ink=colour,gap=4}={})=>{
    pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...ink);
    const lines=pdf.splitTextToSize(String(value),width);
    const step=size*.46;
    for(const line of lines){if(y+step>273)addPage();pdf.text(line,18,y);y+=step;}
    y+=gap;
  };
  const heading=value=>{if(y>235)addPage();y+=5;text(value,{size:16,bold:true,gap:5});};
  const date=value=>new Date(`${value}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  pdf.setFillColor(238,242,232);pdf.rect(0,0,210,67,'F');
  text('PROJECT ACORN / LEARNING RECORD',{size:10,bold:true,colour:[97,118,83],gap:8});
  text(report.title,{size:25,gap:5});
  text(`${date(report.from)} - ${date(report.to)}`,{size:12,colour:[108,88,132]});
  y=Math.max(y,78);
  text(report.audience,{bold:true});
  if(report.preparedBy)text(`Prepared by ${report.preparedBy}`,{size:10});
  text(`Generated ${date(report.generatedOn)}`,{size:10,gap:7});
  text(`${report.entries.length} diary entries   /   ${report.days} recorded days   /   ${report.categories.length} learning areas   /   ${report.evidenceCount} evidence files`,{size:10,bold:true});
  heading('Learning overview');
  text(report.introduction || `This report brings together ${report.entries.length} diary entries across ${report.days} recorded days. It documents the activities and observations recorded during the selected period.`);
  heading('Areas explored');
  if(!report.categories.length)text('No educational categories were assigned to the selected entries.');
  report.categories.forEach(category=>text(`${category.name}: ${category.count} ${category.count===1?'entry':'entries'}`,{size:11,gap:2}));
  text('Counts reflect tagged diary entries; each entry may cover more than one learning area.',{size:9,colour:[102,112,103]});
  if(report.reflection){heading('Progress & reflections');text(report.reflection);}
  text('About this record: Based on selected diary entries, using the diary date where available, otherwise the date recorded. Evidence is listed by filename; photos and videos are held separately in the family diary. This report records observations and does not assign attainment levels.',{size:8,colour:[102,112,103],gap:3});
  if(y>210)addPage();
  heading('Learning journal');
  report.entries.forEach((note,index)=>{
    if(y>235)addPage();
    pdf.setDrawColor(215,223,207);pdf.line(18,y,192,y);y+=7;
    text(`${date(note.date)} / Record ${index+1}`,{size:9,bold:true,colour:[97,118,83],gap:3});
    text(note.title,{size:14,bold:true,gap:3});
    text(note.members.join(', '),{size:10,gap:3});
    if(note.categories.length)text(note.categories.join(' / '),{size:9,colour:[108,88,132],gap:4});
    text(note.body || 'A diary record was added with no written observation.');
    if(note.attachments.length){text('Supporting evidence',{size:10,bold:true,gap:2});note.attachments.forEach(file=>text(`- ${file.name} (${file.type.startsWith('image/')?'Photo':file.type.startsWith('video/')?'Video':'File'})`,{size:10,gap:2}));}
    y+=6;
  });
  if(report.nextSteps){heading('Looking ahead');text(report.nextSteps);}
  const pages=pdf.getNumberOfPages();
  for(let page=1;page<=pages;page++){
    pdf.setPage(page);pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(102,112,103);
    pdf.text('Project Acorn / Family learning report',18,286);pdf.text(`${page} / ${pages}`,192,286,{align:'right'});
  }
  pdf.setProperties({title:report.title,author:report.preparedBy,subject:'Family learning record',creator:'Project Acorn'});
  return new File([pdf.output('arraybuffer')],reportFilename(report),{type:'application/pdf'});
}

export function downloadReport(file) {
  const url=URL.createObjectURL(file);
  const link=document.createElement('a');link.href=url;link.download=file.name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
