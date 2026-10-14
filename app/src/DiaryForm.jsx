import DiaryMembers from './DiaryMembers.jsx';
import React from 'react';
import { Image, Video, ShieldCheck, Upload, Plus } from 'lucide-react';
import { SubjectPicker } from './DiarySubjects.jsx';

export default function DiaryForm({
  saveDiary, diaryTitle, setDiaryTitle, diarySubjects, setDiarySubjects,
  diaryDateMode, setDiaryDateMode, selectedDiaryDate, setSelectedDiaryDate,
  diaryFiles, onDiaryFileChange, diaryProgress, savingDiary,
  diaryBody, setDiaryBody, diaryAssignees, setDiaryAssignees, activeChildren, formatBytes,
}) {
  return (
              <form className="stacked-form" onSubmit={saveDiary}>
                <label htmlFor="diary-title">Title</label>
                <input id="diary-title" value={diaryTitle} onChange={(event) => setDiaryTitle(event.target.value)} placeholder="What did you notice today?" />
                <fieldset className="diary-date-control">
                  <legend>Entry date</legend>
                  <label><input type="radio" name="diary-date-mode" value="today" checked={diaryDateMode==='today'} disabled={savingDiary} onChange={()=>setDiaryDateMode('today')}/> Today</label>
                  <label><input type="radio" name="diary-date-mode" value="choose" checked={diaryDateMode==='choose'} disabled={savingDiary} onChange={()=>setDiaryDateMode('choose')}/> Choose a date</label>
                  {diaryDateMode==='choose' && <><label htmlFor="diary-date">Diary date</label><input id="diary-date" name="entryDate" type="date" required value={selectedDiaryDate} disabled={savingDiary} onInput={event=>setSelectedDiaryDate(event.currentTarget.value)} onChange={event=>setSelectedDiaryDate(event.target.value)}/></>}
                </fieldset>
                <DiaryMembers value={diaryAssignees} onChange={setDiaryAssignees} children={activeChildren} disabled={savingDiary} />
                <SubjectPicker id="diary-subjects" value={diarySubjects} onChange={setDiarySubjects} disabled={savingDiary} />
                <label htmlFor="diary-attachments">Photos and videos (optional)</label>
                <input id="diary-attachments" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple onChange={(event) => onDiaryFileChange(event.target.files)} />
                <div className="attachment-strip" aria-label="Attachment rules">
                  <span>
                    <Image size={17} aria-hidden="true" />
                    Images up to 8 MB
                  </span>
                  <span>
                    <Video size={17} aria-hidden="true" />
                    Videos up to 50 MB
                  </span>
                  <span>
                    <ShieldCheck size={17} aria-hidden="true" />
                    Private owner access
                  </span>
                </div>
                {diaryFiles.length > 0 && (
                  <div className="selected-files">
                    {diaryFiles.map((file) => (
                      <span key={`${file.name}-${file.size}`}>{file.name} ({formatBytes(file.size)})</span>
                    ))}
                  </div>
                )}
                {Object.entries(diaryProgress).length > 0 && (
                  <div className="upload-progress">
                    {Object.entries(diaryProgress).map(([id, percent]) => (
                      <span key={id}>Uploading: {percent}%</span>
                    ))}
                  </div>
                )}
                <label htmlFor="diary-body">Diary entry</label>
                <textarea id="diary-body" value={diaryBody} onChange={(event) => setDiaryBody(event.target.value)} placeholder="Write a short note about learning, progress, questions, or evidence..." rows={5} />
<button className="primary-action" type="submit" disabled={savingDiary}>
                  {savingDiary ? <Upload size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                  {savingDiary ? "Saving..." : "Save diary entry"}
                </button>
              </form>
  );
}
