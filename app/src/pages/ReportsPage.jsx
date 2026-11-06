import React, { useState } from 'react';
import { FileText, Download, Cloud, Share2 } from 'lucide-react';
import FamilyMemberPicker from '../components/FamilyMemberPicker.jsx';
import { buildLearningReport, localDate, reportHtml, reportFilename, reportEntryDate } from '../reports.mjs';
import { reportPdf, downloadReport } from '../report-pdf.mjs';
import { addDoc, collection, db, serverTimestamp } from '../firebase';
import '../reports.css';

export default function ReportsPage({user, entries, members, savedReports, loading}) {
  const [from,setFrom]=useState(()=>`${localDate().slice(0,7)}-01`);
  const [to,setTo]=useState(localDate);
  const [selected,setSelected]=useState(['family']);
  const [title,setTitle]=useState('Family learning report');
  const [preparedBy,setPreparedBy]=useState(user.displayName || '');
  const [introduction,setIntroduction]=useState('');
  const [reflection,setReflection]=useState('');
  const [nextSteps,setNextSteps]=useState('');
  const [report,setReport]=useState(null);
  const [storedPdf,setStoredPdf]=useState('');
  const [pdfFile,setPdfFile]=useState(null);
  const [saved,setSaved]=useState(false);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const undated=entries.filter(entry=>!reportEntryDate(entry)).length;

  async function generate(event) {
    event.preventDefault();setError('');setMessage('');setBusy('generate');
    try {
      const model=buildLearningReport({entries,from,to,members:selected,memberNames:Object.fromEntries(members.map(member=>[member.id,member.name])),title,preparedBy,introduction,reflection,nextSteps});
      const file=await reportPdf(model);
      setReport(model);setPdfFile(file);
      setStoredPdf('');setSaved(false);setMessage('Report generated. Review the preview before downloading or sharing.');
    } catch(error) {setError(error.message);} finally {setBusy('');}
  }

  async function getFile() {
    if(pdfFile)return pdfFile;
    if(!storedPdf)return reportPdf(report);
    const binary=atob(storedPdf);
    return new File([Uint8Array.from(binary,char=>char.charCodeAt(0))],reportFilename(report),{type:'application/pdf'});
  }

  async function exportReport(action) {
    if(busy || !report)return;
    setBusy(action);setError('');setMessage('');
    try {
      const file=await getFile();
      if(action==='download')downloadReport(file);
      if(action==='share') {
        if(navigator.canShare?.({files:[file]})) {
          await navigator.share({files:[file],title:report.title});
          setMessage('The file has been handed to your sharing app.');
        } else {downloadReport(file);setMessage('PDF downloaded. Attach it to an email or upload it to your preferred cloud drive.');}
      }
      if(action==='cloud') {
        const bytes=new Uint8Array(await file.arrayBuffer());
        const reportJson=JSON.stringify(report);
        if(bytes.length*4/3+new TextEncoder().encode(reportJson).length>750000)throw new Error('This report is too large for cloud saving here. Choose a shorter period or download the PDF.');
        const pdfBase64=btoa(Array.from(bytes,byte=>String.fromCharCode(byte)).join(''));
        await addDoc(collection(db,'users',user.uid,'tasks'),{kind:'report',title:report.title,from:report.from,to:report.to,reportJson,pdfBase64,createdAt:serverTimestamp()});
        setStoredPdf(pdfBase64);setSaved(true);setMessage('PDF saved privately to your Acorn cloud reports. Open it here later to download or share.');
      }
    } catch(error) {
      if(error.name!=='AbortError')setError(error.message?.startsWith('This report')?error.message:'That action could not be completed. Please try again.');
    } finally {setBusy('');}
  }

  function openSaved(item) {
    try {
      const model=JSON.parse(item.reportJson);
      if(model.version!==1 || !model.entries?.length)throw new Error('Invalid report');
      // Render using the same escaped template rather than storing executable HTML.
      reportHtml(model);
      const binary=atob(item.pdfBase64);
      const file=new File([Uint8Array.from(binary,char=>char.charCodeAt(0))],reportFilename(model),{type:'application/pdf'});
      setReport(model);setPdfFile(file);setStoredPdf(item.pdfBase64);setSaved(true);setError('');setMessage('Opened your saved report. Download or share the saved PDF below.');
    } catch {setError('This saved report could not be opened.');}
  }

  return <section className="panel page-panel reports-panel">
    <div className="panel-heading"><div><p className="section-kicker">Reports</p><h2>Your learning story, beautifully gathered</h2></div><FileText size={24} aria-hidden="true"/></div>
    <p className="reports-intro">Bring your diary notes together into a considered family learning report. Choose a period, add your reflections, and create a PDF to keep or share.</p>
    <form className="stacked-form report-form" onSubmit={generate}>
      <div className="report-date-grid"><label>From<input type="date" required value={from} max={to || undefined} onChange={event=>setFrom(event.target.value)}/></label><label>To<input type="date" required value={to} min={from || undefined} onChange={event=>setTo(event.target.value)}/></label></div>
      <FamilyMemberPicker members={members} selected={selected} onChange={setSelected}/>
      <label>Report title<input value={title} maxLength={120} onChange={event=>setTitle(event.target.value)}/></label>
      <label>Prepared by<input value={preparedBy} maxLength={120} onChange={event=>setPreparedBy(event.target.value)}/></label>
      <details className="report-reflections"><summary>Add context, reflections & next steps</summary><label>Introduction<textarea rows={3} maxLength={12000} value={introduction} onChange={event=>setIntroduction(event.target.value)} placeholder="Your approach to learning and the context for this period"/></label><label>Progress & reflections<textarea rows={4} maxLength={12000} value={reflection} onChange={event=>setReflection(event.target.value)} placeholder="What developed, what worked well, and observations you would like to highlight"/></label><label>Looking ahead<textarea rows={3} maxLength={12000} value={nextSteps} onChange={event=>setNextSteps(event.target.value)} placeholder="Interests to follow, opportunities to explore, and next steps"/></label></details>
      <p className="report-hint">Uses the diary date where available, otherwise the date it was recorded. Whole family includes all members; selecting an individual also includes shared family entries. Photos and videos are listed as evidence, rather than embedded.</p>
      {undated>0&&<p className="report-hint">{undated} {undated===1?'entry has':'entries have'} no confirmed date and will be excluded until dated.</p>}
      <button type="submit" className="primary-action" disabled={!!busy || loading}><FileText size={18}/>{loading?'Loading diary…':'Generate learning report'}</button>
    </form>
    {error&&<p className="notice error" role="alert">{error}</p>}{message&&<p className="notice success" role="status">{message}</p>}
    {report&&<section className="report-result" aria-label="Generated report"><div className="report-preview-heading"><h3>Report preview</h3><span>{report.entries.length} diary entries · {report.from} – {report.to}</span></div><div className="report-actions"><button type="button" disabled={!!busy} onClick={()=>exportReport('download')}><Download size={17}/>Download PDF</button><button type="button" disabled={!!busy || saved} onClick={()=>exportReport('cloud')}><Cloud size={17}/>{saved?'Saved to cloud':'Save PDF to cloud'}</button><button type="button" disabled={!!busy} onClick={()=>exportReport('share')}><Share2 size={17}/>Share PDF</button></div>{busy&&<p role="status">Preparing your report…</p>}<iframe title="Learning report preview" className="report-preview" sandbox="" srcDoc={reportHtml(report)}/></section>}
    <section className="cloud-report-library"><h3>Saved cloud reports</h3><p className="report-hint">Private to your account. Open a saved PDF to download or share a copy using your device’s sharing options.</p>{savedReports.length===0?<p className="empty-state">Your saved reports will appear here.</p>:<div className="item-list">{savedReports.map(item=><article className="cloud-report-row" key={item.id}><div><strong>{item.title}</strong><span>{item.from} – {item.to} · {item.createdLabel}</span></div><button type="button" onClick={()=>openSaved(item)} disabled={!!busy}>Open report</button></article>)}</div>}</section>
  </section>;
}
