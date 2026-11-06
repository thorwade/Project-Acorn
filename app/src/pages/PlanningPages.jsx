import React from 'react';
import FamilyMemberPicker from '../components/FamilyMemberPicker.jsx';
import { diaryMemberIds } from '../diary.mjs';
import { CalendarDays, CheckCircle2, Circle, ListTodo, NotebookPen, Plus, Trash2 } from 'lucide-react';
import SpaceTabs from '../components/SpaceTabs.jsx';
import { spaceLabel } from '../app-helpers.mjs';

export function HomePage({openTaskCount,diaryCount}) {
  return <section className="home-grid">
    <article className="feature-card lavender"><span className="feature-icon"><CalendarDays size={24} aria-hidden="true"/></span><p className="section-kicker">Today</p><h2>Family rhythm</h2><p>Choose a child or the whole family, then move into Planning, To-do, or Diary to organise the day.</p></article>
    <article className="feature-card green"><span className="feature-icon"><ListTodo size={24} aria-hidden="true"/></span><p className="section-kicker">To-do</p><h2>{openTaskCount} open tasks</h2><p>Tasks stay private and can be assigned to the family or an individual child.</p></article>
    <article className="feature-card peach"><span className="feature-icon"><NotebookPen size={24} aria-hidden="true"/></span><p className="section-kicker">Diary</p><h2>{diaryCount} diary notes</h2><p>Capture evidence with text, photos, or videos in your private learning diary.</p></article>
  </section>;
}

export function PlanningPage({space,setSpace,allChildren,activeChildren,openTaskCount,diaryCount}) {
  return <section className="panel page-panel"><div className="panel-heading"><div><p className="section-kicker">Planning</p><h2>{spaceLabel(space,allChildren)} overview</h2></div><CalendarDays size={22} aria-hidden="true"/></div>
    <SpaceTabs space={space} setSpace={setSpace} children={activeChildren}/><div className="planning-grid"><article><strong>{openTaskCount}</strong><span>open tasks in this space</span></article><article><strong>{diaryCount}</strong><span>diary notes captured</span></article><article><strong>{activeChildren.length}</strong><span>child spaces in the family hub</span></article></div><p className="planning-note">Use Planning to choose the family or child context, then move to To-dos or Diary to add work and evidence for that space.</p>
  </section>;
}

export function TodosPage({allChildren,activeChildren,taskTitle,setTaskTitle,taskAssignees,setTaskAssignees,signedInMember,addTask,visibleTasks,toggleTask,deleteTask}) {
  return <section className="panel page-panel"><div className="panel-heading"><div><p className="section-kicker">To-dos</p><h2>Family tasks</h2></div><ListTodo size={22} aria-hidden="true"/></div>
    <form className="stacked-form" onSubmit={addTask}><FamilyMemberPicker members={[signedInMember,...activeChildren]} selected={taskAssignees} onChange={setTaskAssignees}/><label htmlFor="task-title">Task</label><input id="task-title" value={taskTitle} onChange={event=>setTaskTitle(event.target.value)} placeholder="Reading, nature walk, maths practice..."/><button className="primary-action" type="submit"><Plus size={18} aria-hidden="true"/>Add task</button></form>
    <div className="item-list" aria-label="Tasks">{visibleTasks.length===0&&<p className="empty-state">No tasks yet.</p>}{visibleTasks.map(task=><article className="list-item" key={task.id}><button className="icon-button" type="button" onClick={()=>toggleTask(task)} aria-label={task.complete?'Mark task incomplete':'Mark task done'}>{task.complete?<CheckCircle2 size={20} aria-hidden="true"/>:<Circle size={20} aria-hidden="true"/>}</button><div><strong className={task.complete?'complete':''}>{task.title}</strong><span>{diaryMemberIds(task).map(id=>id===signedInMember.id?signedInMember.name:spaceLabel(id,allChildren)).join(', ')}</span></div><button className="icon-button subtle" type="button" onClick={()=>deleteTask(task.id)} aria-label="Delete task"><Trash2 size={18} aria-hidden="true"/></button></article>)}</div>
  </section>;
}
