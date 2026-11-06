import React from 'react';
import { toggleDiaryMember } from '../diary.mjs';
import '../diary.css';

export default function FamilyMemberPicker({ members, selected, onChange }) {
  return (
    <fieldset className="diary-choices">
      <legend>Family members</legend>
      <div className="diary-choice-grid">
        {[{ id: 'family', name: 'Whole family' }, ...members].map(member => (
          <label className="diary-choice" key={member.id}>
            <input type="checkbox" checked={selected.includes(member.id)}
              onChange={() => onChange(current => toggleDiaryMember(current, member.id))} />
            <span>{member.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
