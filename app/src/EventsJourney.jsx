import React, { useEffect, useMemo, useState } from 'react';
import { createSampleEvents, filterEvents, readBookmarks, bookmarkKey, toggleBookmark } from './events.mjs';
import './events.css';

const EMPTY_FILTERS = { age: '', date: '', distance: '', cost: '', parentStays: false };
const dateLabel = value => new Date(value).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function EventsJourney({ page, user, onNavigate }) {
  const [events] = useState(() => createSampleEvents());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [bookmarkState, setBookmarkState] = useState({ uid: null, ids: [] });
  const [message, setMessage] = useState('');
  const uid = user?.uid || null;
  const saved = bookmarkState.uid === uid && uid ? bookmarkState.ids : [];

  useEffect(() => {
    setSelected(null);
    setMessage('');
    try { setBookmarkState({ uid, ids: readBookmarks(window.localStorage, uid, events) }); }
    catch { setBookmarkState({ uid, ids: [] }); setMessage('Saved events could not be read on this device.'); }
  }, [uid, events]);

  const visible = useMemo(() => filterEvents(events, filters).filter(event => tab !== 'saved' || saved.includes(event.id)), [events, filters, tab, saved]);
  function setFilter(key, value) { setFilters(current => ({ ...current, [key]: value })); }
  function save(event) {
    if (!uid) { setMessage('Sign in with Google to keep a personal My events list on this device.'); return; }
    const ids = toggleBookmark(saved, event.id);
    try {
      window.localStorage.setItem(bookmarkKey(uid), JSON.stringify(ids));
      setBookmarkState({ uid, ids });
      setMessage(ids.includes(event.id) ? 'Event saved to My events on this device. This is not a booking.' : 'Event removed from My events.');
    } catch { setMessage('Your browser could not save this event. Check local storage settings.'); }
  }
  function card(event) {
    return <article className="acorn-event-card" key={event.id}>
      <span className="acorn-event-tag">{event.interest} · Sample event</span>
      <h3>{event.title}</h3><p>{dateLabel(event.start)}</p>
      <p>{event.venue}</p>
      <dl><div><dt>Ages</dt><dd>{event.minAge}–{event.maxAge}</dd></div><div><dt>Distance*</dt><dd>{event.distance} miles</dd></div><div><dt>Per child</dt><dd>{event.cost ? `£${event.cost}` : 'Free'}</dd></div></dl>
      <p>{event.parentStays ? 'Parent stays with child' : 'Sample drop-off session'}</p>
      <div className="acorn-event-actions"><button type="button" onClick={() => { setSelected(event); if (page === 'home') onNavigate('events'); }}>View details<span className="acorn-sr">: {event.title}</span></button>
        <button type="button" aria-pressed={saved.includes(event.id)} onClick={() => save(event)}>{saved.includes(event.id) ? 'Saved ✓' : 'Save event'}<span className="acorn-sr">: {event.title}</span></button></div>
    </article>;
  }

  if (!['home', 'events'].includes(page)) return null;
  return <section className="panel page-panel acorn-events" aria-label="Learning events">
    <div className="panel-heading"><div><p className="section-kicker">Explore Carmarthen</p><h2>{page === 'home' ? 'Coming up nearby' : 'Find your next learning adventure'}</h2></div>
      {page === 'home' && <button type="button" className="primary-action" onClick={() => { setSelected(null); onNavigate('events'); }}>Browse all events</button>}</div>
    <p className="acorn-demo-notice">Demonstration only: all 10 events, venues and prices are fictional. Dates show the next ten days. Nothing can be booked. *Distances are illustrative from Carmarthen town centre, not your location.</p>
    <p className="settings-note">My events is saved per signed-in account in this browser only; it does not sync to Firebase or other devices.</p>
    {message && <p role="status" className="notice">{message}</p>}
    {page === 'events' && <>
      <div className="acorn-event-tabs" role="group" aria-label="Event view"><button type="button" aria-pressed={tab === 'all'} onClick={() => { setTab('all'); setSelected(null); }}>All events</button><button type="button" aria-pressed={tab === 'saved'} onClick={() => { setTab('saved'); setSelected(null); setFilters(EMPTY_FILTERS); }}>My events ({saved.length})</button></div>
      {!selected && <form className="acorn-event-filters" onSubmit={event => event.preventDefault()}>
        <label>Child age<input type="number" min="0" max="18" value={filters.age} onChange={event => setFilter('age', event.target.value)} placeholder="Any age" /></label>
        <label>Date<input type="date" value={filters.date} onChange={event => setFilter('date', event.target.value)} /></label>
        <label>Within<select value={filters.distance} onChange={event => setFilter('distance', event.target.value)}><option value="">Any distance</option><option value="2">2 miles</option><option value="5">5 miles</option><option value="10">10 miles</option></select></label>
        <label>Maximum cost<select value={filters.cost} onChange={event => setFilter('cost', event.target.value)}><option value="">Any cost</option><option value="0">Free</option><option value="5">£5 per child</option><option value="10">£10 per child</option></select></label>
        <label className="acorn-event-check"><input type="checkbox" checked={filters.parentStays} onChange={event => setFilter('parentStays', event.target.checked)} />Parent stays</label>
        <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
      </form>}
    </>}
    {page === 'events' && selected ? <article className="acorn-event-detail">
      <button type="button" onClick={() => setSelected(null)}>← Back to {tab === 'saved' ? 'My events' : 'events'}</button>
      <p className="section-kicker">{selected.interest} · Fictional event</p><h3>{selected.title}</h3><p>{selected.description}</p>
      <dl><dt>When</dt><dd>{dateLabel(selected.start)} · {selected.duration} minutes</dd><dt>Where</dt><dd>{selected.venue} · {selected.distance} illustrative miles from town centre</dd><dt>Suitable ages</dt><dd>{selected.minAge}–{selected.maxAge} years</dd><dt>Cost</dt><dd>{selected.cost ? `£${selected.cost} per child` : 'Free'}</dd><dt>Parent attendance</dt><dd>{selected.parentStays ? 'Parent stays throughout' : 'Fictional drop-off format; supervision details are unverified'}</dd><dt>Accessibility</dt><dd>{selected.accessibility}</dd><dt>Organiser</dt><dd>{selected.organiser}</dd></dl>
      <button className="primary-action" type="button" aria-pressed={saved.includes(selected.id)} onClick={() => save(selected)}>{saved.includes(selected.id) ? 'Remove from My events' : 'Save to My events'}</button><p>No booking or payment is available for sample events.</p>
    </article> : <><p>{page === 'home' ? 'A few ideas for the week ahead' : `${visible.length} ${tab === 'saved' ? 'saved ' : ''}events match`}</p><div className="acorn-event-grid">{(page === 'home' ? filterEvents(events).slice(0, 3) : visible).map(card)}</div>
      {page === 'events' && visible.length === 0 && <p className="empty-state">{tab === 'saved' ? (uid ? 'No saved events match. Browse All events and save something you like.' : 'Sign in to see your personal saved events.') : 'No events match these filters. Try clearing a filter.'}</p>}</>}
  </section>;
}
