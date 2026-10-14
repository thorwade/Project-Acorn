import React from 'react';
export default function DiaryDateFilters({from,to,setFrom,setTo}) {
 return <fieldset className="diary-date-control"><legend>Filter diary dates</legend>
  <label htmlFor="diary-from">From</label><input id="diary-from" type="date" value={from} onInput={e=>setFrom(e.currentTarget.value)} onChange={e=>setFrom(e.target.value)}/>
  <label htmlFor="diary-to">To</label><input id="diary-to" type="date" value={to} onInput={e=>setTo(e.currentTarget.value)} onChange={e=>setTo(e.target.value)}/>
  <button className="secondary-action" type="button" onClick={()=>{setFrom('');setTo('');}}>Clear date filters</button>
  {from&&to&&from>to&&<p role="status">Choose an end date on or after the start date.</p>}
 </fieldset>;
}
