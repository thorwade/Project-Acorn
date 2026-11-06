import React from 'react';
import { UserRound, Users } from 'lucide-react';

export default function SpaceTabs({space,setSpace,children}) {
  return <div className="space-tabs" aria-label="Select family or child space">
    <button className={space==='all'?'space-tab active':'space-tab'} type="button" onClick={()=>setSpace('all')}><Users size={16} aria-hidden="true"/>All</button>
    <button className={space==='family'?'space-tab active':'space-tab'} type="button" onClick={()=>setSpace('family')}><UserRound size={16} aria-hidden="true"/>Family</button>
    {children.map(child=><button className={space===child.id?'space-tab active':'space-tab'} type="button" onClick={()=>setSpace(child.id)} key={child.id}><span className="child-dot" style={{backgroundColor:child.colour}}/>{child.name}</button>)}
  </div>;
}
