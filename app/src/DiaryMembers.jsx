import React from 'react';
import { addMember, removeMember, normalizeMembers } from './diary-members.mjs';
import './diary-subjects.css';

export default function DiaryMembers({ value, onChange, children, disabled = false }) {
  const selected = normalizeMembers(value);
  return <div className="diary-subject-picker">
    <label htmlFor="diary-members">Family members</label>
    <p id="diary-members-help">Choose everyone who took part. Whole family is separate from selecting individual children.</p>
    <select id="diary-members" value="" disabled={disabled} aria-describedby="diary-members-help" onChange={event => {if(event.target.value)onChange(addMember(selected,event.target.value));}}>
      <option value="">Add a family member…</option>
      {!selected.includes('family') && <option value="family">Whole family</option>}
      {children.filter(child=>!selected.includes(child.id)).map(child=><option key={child.id} value={child.id}>{child.name}</option>)}
    </select>
    <ul className="diary-subject-tags" aria-label="Selected family members" aria-live="polite">
      {selected.map(id=><li key={id}><span>{id==='family'?'Whole family':children.find(child=>child.id===id)?.name || 'Child'}</span><button type="button" disabled={disabled} aria-label={`Remove ${id==='family'?'Whole family':children.find(child=>child.id===id)?.name || 'Child'}`} onClick={()=>onChange(removeMember(selected,id))}>×</button></li>)}
    </ul>
    <p className="settings-note">If no children are selected, the entry belongs to Whole family.</p>
  </div>;
}
