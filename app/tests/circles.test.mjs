import test from 'node:test';
import assert from 'node:assert/strict';
import {circleInput,eventInput,filterCircleEvents,validCode} from '../src/circles.mjs';
const now=Date.now();
const form={title:' Walk ',body:' Bring boots ',venue:' Park ',startsAt:new Date(now+3600000).toISOString(),endsAt:new Date(now+7200000).toISOString(),cost:'2.50',minAge:'3',maxAge:'12',kind:'organising',parentStays:true};
test('circle creation trims and bounds metadata and validates cover',()=>{
  assert.deepEqual(circleInput({name:' Families ',about:' Together ',theme:'sky'}),{name:'Families',about:'Together',theme:'sky'});
  for(const changes of [{name:' '},{name:'a'.repeat(81)},{about:'a'.repeat(501)},{theme:'invalid'}]) assert.throws(()=>circleInput({name:'Families',about:'',theme:'sky',...changes}));
});
test('account and circle codes reject traversal and blank values',()=>{
  assert.equal(validCode('abc-DEF_123'),true);
  for(const value of ['',null,'../owner','users/owner','a'.repeat(129),'a b']) assert.equal(validCode(value),false);
});
test('event form converts pounds and local dates into validated data',()=>{
  const value=eventInput(form,now);assert.equal(value.costPence,250);assert.equal(value.title,'Walk');assert.equal(value.startsAt.getTime(),now+3600000);
  for(const changes of [{title:''},{venue:''},{body:'a'.repeat(4001)},{startsAt:'bad'},{startsAt:new Date(now-1000).toISOString()},{endsAt:form.startsAt},{endsAt:new Date(now+9*86400000).toISOString()},{cost:'-1'},{cost:'1001'},{cost:'NaN'},{minAge:'-1'},{maxAge:'19'},{minAge:'13'},{maxAge:'1.2'},{kind:'other'},{parentStays:'true'}]) assert.throws(()=>eventInput({...form,...changes},now));
});
test('circle feed excludes cancelled and past events and filters age, cost and parent attendance',()=>{
  const timestamp=value=>({toMillis:()=>value});
  const base={circleId:'one',status:'scheduled',startsAt:timestamp(now+2000),minAge:3,maxAge:12,costPence:0,parentStays:true};
  const events=[{...base,id:'later'},{...base,id:'first',startsAt:timestamp(now+1000)},{...base,id:'past',startsAt:timestamp(now-1)},{...base,id:'cancelled',status:'cancelled'},{...base,id:'other',circleId:'two',costPence:250,parentStays:false}];
  assert.deepEqual(filterCircleEvents(events,{circle:'one',age:'3',free:true,parentStays:true},now).map(e=>e.id),['first','later']);
  assert.equal(filterCircleEvents(events,{circle:'',age:'13',free:false,parentStays:false},now).length,0);
});
