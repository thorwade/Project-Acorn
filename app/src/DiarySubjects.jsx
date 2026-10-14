import React, { useState } from 'react';
import { SUBJECTS, normalizeSubjects } from './diary-subjects.mjs';
import './diary-subjects.css';

export function SubjectPicker({ id, value, onChange, disabled = false }) {
  const selected = normalizeSubjects(value);
  return <div className="diary-subject-picker">
    <label htmlFor={id}>Subjects (optional)</label>
    <p id={`${id}-help`}>Choose a subject to add it. One entry can cover several subjects.</p>
    <select id={id} value="" aria-describedby={`${id}-help`} disabled={disabled}
      onChange={event => { if (event.target.value) onChange(normalizeSubjects([...selected, event.target.value])); }}>
      <option value="">Add a subject…</option>
      {SUBJECTS.filter(subject => !selected.includes(subject)).map(subject => <option key={subject} value={subject}>{subject}</option>)}
    </select>
    <ul className="diary-subject-tags" aria-label="Selected subjects" aria-live="polite">
      {selected.map(subject => <li key={subject}><span>{subject}</span><button type="button" disabled={disabled}
        aria-label={`Remove ${subject}`} onClick={() => onChange(selected.filter(item => item !== subject))}>×</button></li>)}
    </ul>
  </div>;
}

export default function DiarySubjects({ entry, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const subjects = normalizeSubjects(entry.subjects);
  async function save() {
    setSaving(true); setError('');
    try { await onSave(entry.id, normalizeSubjects(draft)); setEditing(false); }
    catch { setError('Subjects could not be saved. Your selections are kept here; please try again.'); }
    finally { setSaving(false); }
  }
  return <div className="diary-saved-subjects">
    {editing ? <>
      <SubjectPicker id={`subjects-${entry.id}`} value={draft} onChange={setDraft} disabled={saving}/>
      {error && <p role="alert">{error}</p>}
      <div className="diary-subject-actions"><button className="secondary-action" type="button" disabled={saving} onClick={save}>{saving ? 'Saving subjects…' : 'Save subjects'}</button>
        <button className="secondary-action" type="button" disabled={saving} onClick={() => {setEditing(false);setError('');}}>Cancel</button></div>
    </> : <>
      <ul className="diary-subject-tags" aria-label="Entry subjects">{subjects.map(subject => <li key={subject}>{subject}</li>)}</ul>
      {!subjects.length && <p className="settings-note">No subjects added yet.</p>}
      <button className="secondary-action" type="button" onClick={() => {setDraft(subjects);setError('');setEditing(true);}}>Edit subjects</button>
    </>}
  </div>;
}
