import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { before, beforeEach, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, deleteField, collection, getDocs, query, orderBy, limit, serverTimestamp, Timestamp, writeBatch, where, arrayUnion, arrayRemove } from 'firebase/firestore';

let env;
test('client index, upcoming feed and fresh invitation after removal match the UI workflow', async () => {
  const owner=db('owner'), outsider=db('outsider');
  const index=doc(outsider,'users/outsider/tasks/circle-index');
  await invite();await accept(outsider,'outsider');
  await assertSucceeds(setDoc(index,{kind:'circle-index',circleIds:arrayUnion('one')},{merge:true}));
  assert.deepEqual((await getDoc(index)).data().circleIds,['one']);
  await assertSucceeds(getDocs(query(collection(outsider,'circles/one/events'),where('startsAt','>=',Timestamp.now()),orderBy('startsAt'),limit(50))));
  await assertFails(setDoc(doc(owner,'users/outsider/tasks/circle-index'),{circleIds:['other']},{merge:true}));
  await deleteDoc(path(owner,'members/outsider'));
  await assertFails(getDocs(query(collection(outsider,'circles/one/events'),where('startsAt','>=',Timestamp.now()),orderBy('startsAt'),limit(50))));
  await deleteDoc(path(owner,'invites/outsider'));await invite();await assertSucceeds(accept(outsider,'outsider'));
  await assertSucceeds(setDoc(path(outsider,'events/outsider-event'),freshEvent({authorUid:'outsider',authorName:'Member'})));
  await assertSucceeds(deleteDoc(path(outsider,'members/outsider')));
  await assertSucceeds(setDoc(index,{kind:'circle-index',circleIds:arrayRemove('one')},{merge:true}));
  assert.deepEqual((await getDoc(index)).data().circleIds,[]);
});
test('private family ownership preserves create, read, query, update and delete for every existing record kind', async () => {
  const database = db('owner');
  for (const kind of ['child','diary','gallery','preferences','task']) {
    const reference = doc(database,`users/owner/tasks/compat-${kind}`);
    await assertSucceeds(setDoc(reference,{kind,title:'Fictional compatibility fixture'}));
    await assertSucceeds(getDoc(reference));
    await assertSucceeds(updateDoc(reference,{title:'Updated fixture'}));
    await assertSucceeds(deleteDoc(reference));
  }
  await assertSucceeds(getDocs(collection(database,'users/owner/tasks')));
});
test('other accounts and signed-out users cannot perform family CRUD or list queries', async () => {
  for (const uid of ['member','outsider',null]) {
    const database = db(uid);
    const reference = doc(database,'users/owner/tasks/private');
    await assertFails(getDoc(reference));
    await assertFails(getDocs(collection(database,'users/owner/tasks')));
    await assertFails(setDoc(doc(database,'users/owner/tasks/injected'),{kind:'child',title:'Denied'}));
    await assertFails(updateDoc(reference,{title:'Denied'}));
    await assertFails(deleteDoc(reference));
  }
});
const stamp = Timestamp.fromMillis(Date.now() - 60000);
const future = hours => Timestamp.fromMillis(Date.now() + hours * 3600000);
const circle = { name:'Carmarthen explorers', about:'A fictional test circle', theme:'woodland', ownerUid:'owner', createdAt:stamp };
const event = { circleId:'one', authorUid:'member', authorName:'Member', title:'Nature walk', body:'Bring waterproofs.', venue:'Fictional meeting point', startsAt:future(24), endsAt:future(26), costPence:0, minAge:3, maxAge:12, parentStays:true, kind:'organising', status:'scheduled', createdAt:stamp };
const db = uid => uid ? env.authenticatedContext(uid, { name:uid === 'owner' ? 'Owner' : 'Member' }).firestore() : env.unauthenticatedContext().firestore();
const path = (database, suffix) => doc(database, `circles/one/${suffix}`);
const freshEvent = changes => ({...event, createdAt:serverTimestamp(), ...changes});
async function invite(uid='outsider', changes={}) {
  return setDoc(path(db('owner'),`invites/${uid}`), { inviteeUid:uid, createdAt:serverTimestamp(), expiresAt:future(24), usedAt:null, ...changes });
}
function accept(database, uid) {
  const batch = writeBatch(database);
  batch.set(path(database,`members/${uid}`),{uid,joinedAt:serverTimestamp()});
  batch.update(path(database,`invites/${uid}`),{usedAt:serverTimestamp()});
  return batch.commit();
}
before(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8088') throw new Error('Run only against the isolated localhost emulator on port 8088.');
  env = await initializeTestEnvironment({ projectId:'demo-acorn-circles', firestore:{host:'127.0.0.1',port:8088,rules:await readFile(new URL('./circles.candidate.rules',import.meta.url),'utf8')} });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    await setDoc(doc(database,'circles/one'),circle);
    await setDoc(path(database,'members/member'),{uid:'member',joinedAt:stamp});
    await setDoc(path(database,'events/walk'),event);
    await setDoc(doc(database,'users/owner/tasks/private'),{title:'Private child information'});
  });
});
after(async () => { if (env) await env.cleanup(); });

test('circle creation binds owner and server creation time', async () => {
  const database=db('owner');
  await assertSucceeds(setDoc(doc(database,'circles/new'),{...circle,createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(database,'circles/spoof'),{...circle,ownerUid:'member',createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(database,'circles/old'),circle));
});
test('discovery requires authentication and a bounded query', async () => {
  await assertSucceeds(getDocs(query(collection(db('outsider'),'circles'),limit(50))));
  await assertFails(getDocs(collection(db('owner'),'circles')));
  await assertFails(getDocs(query(collection(db('owner'),'circles'),limit(51))));
  await assertFails(getDocs(query(collection(db(null),'circles'),limit(50))));
});
test('only owner edits metadata and ownership remains immutable', async () => {
  await assertSucceeds(updateDoc(doc(db('owner'),'circles/one'),{theme:'sky'}));
  await assertFails(updateDoc(doc(db('member'),'circles/one'),{name:'Hijacked'}));
  for (const changes of [{ownerUid:'member'},{createdAt:future(2)},{name:'x'.repeat(81)},{theme:'unknown'},{about:123},{name:deleteField()},{role:'admin'}])
    await assertFails(updateDoc(doc(db('owner'),'circles/one'),changes));
  await assertFails(deleteDoc(doc(db('owner'),'circles/one')));
});
test('outsiders and signed-out users cannot read or list event content', async () => {
  for (const uid of ['outsider',null]) {
    await assertFails(getDoc(path(db(uid),'events/walk')));
    await assertFails(getDocs(query(collection(db(uid),'circles/one/events'),orderBy('startsAt'),limit(50))));
  }
  for (const uid of ['owner','member']) await assertSucceeds(getDocs(query(collection(db(uid),'circles/one/events'),orderBy('startsAt'),limit(50))));
});
test('only owner issues invitations; invite is private to its recipient', async () => {
  await assertSucceeds(invite());
  await assertSucceeds(getDoc(path(db('outsider'),'invites/outsider')));
  await assertFails(getDoc(path(db('member'),'invites/outsider')));
  await assertFails(setDoc(path(db('member'),'invites/outsider'),{inviteeUid:'outsider',createdAt:serverTimestamp(),expiresAt:future(24),usedAt:null}));
  await assertFails(invite('bad',{expiresAt:future(200)}));
  await assertFails(invite('bad',{inviteeUid:'different'}));
  await assertFails(invite('bad',{role:'owner'}));
});
test('joining requires an unused invite and atomic consumption', async () => {
  const database=db('outsider');
  await assertFails(accept(database,'outsider'));
  await invite();
  await assertFails(setDoc(path(database,'members/outsider'),{uid:'outsider',joinedAt:serverTimestamp()}));
  await assertFails(updateDoc(path(database,'invites/outsider'),{usedAt:serverTimestamp()}));
  await assertSucceeds(accept(database,'outsider'));
  await assertSucceeds(getDoc(path(database,'events/walk')));
});
test('expired invitations cannot be accepted', async () => {
  await env.withSecurityRulesDisabled(context=>setDoc(path(context.firestore(),'invites/outsider'),{inviteeUid:'outsider',createdAt:stamp,expiresAt:stamp,usedAt:null}));
  await assertFails(accept(db('outsider'),'outsider'));
});
test('membership cannot be forged, promoted or created for another account', async () => {
  await invite();
  const database=db('outsider');
  const batch=writeBatch(database);
  batch.set(path(database,'members/outsider'),{uid:'outsider',joinedAt:serverTimestamp(),role:'owner'});
  batch.update(path(database,'invites/outsider'),{usedAt:serverTimestamp()});
  await assertFails(batch.commit());
  await assertFails(accept(db('member'),'outsider'));
  await assertFails(updateDoc(path(db('member'),'members/member'),{role:'owner'}));
});
test('removal revokes access and a consumed invitation cannot be replayed', async () => {
  await invite(); await accept(db('outsider'),'outsider');
  await assertSucceeds(deleteDoc(path(db('owner'),'members/outsider')));
  await assertFails(getDoc(path(db('outsider'),'events/walk')));
  await assertFails(setDoc(path(db('outsider'),'events/new'),freshEvent({authorUid:'outsider'})));
  await assertFails(accept(db('outsider'),'outsider'));
});
test('members may leave but cannot remove other members', async () => {
  await assertFails(deleteDoc(path(db('member'),'members/outsider')));
  await assertSucceeds(deleteDoc(path(db('member'),'members/member')));
  await assertFails(updateDoc(path(db('member'),'events/walk'),{title:'Changed after leaving'}));
});
test('member posts bind identity and immutable creation time', async () => {
  await assertSucceeds(setDoc(path(db('member'),'events/new'),freshEvent({})));
  for (const changes of [{authorUid:'owner'},{authorName:'Owner'},{createdAt:stamp},{status:'cancelled'}])
    await assertFails(setDoc(path(db('member'),'events/bad'),freshEvent(changes)));
  await assertFails(setDoc(path(db('outsider'),'events/new'),freshEvent({authorUid:'outsider'})));
});
test('author edits their event; owner may only cancel another authors event', async () => {
  await assertSucceeds(updateDoc(path(db('member'),'events/walk'),{title:'Updated walk'}));
  await assertFails(updateDoc(path(db('owner'),'events/walk'),{title:'Changed by owner'}));
  await assertSucceeds(updateDoc(path(db('owner'),'events/walk'),{status:'cancelled'}));
  await assertFails(updateDoc(path(db('owner'),'events/walk'),{status:'scheduled'}));
  await assertFails(updateDoc(path(db('outsider'),'events/walk'),{title:'Hijacked'}));
});
test('event updates cannot hijack identity, paths or creation timestamps', async () => {
  for (const changes of [{authorUid:'owner'},{authorName:'Owner'},{circleId:'two'},{createdAt:future(2)},{role:'admin'}])
    await assertFails(updateDoc(path(db('member'),'events/walk'),changes));
});
test('create and update validators reject oversized, missing and corrupt fields', async () => {
  const badValues=[{title:'x'.repeat(121)},{body:'x'.repeat(4001)},{venue:'x'.repeat(201)},{authorName:'x'.repeat(101)},{costPence:-1},{costPence:100001},{costPence:1.5},{minAge:-1},{maxAge:19},{minAge:15,maxAge:3},{startsAt:'tomorrow'},{endsAt:stamp},{endsAt:future(240)},{parentStays:'true'},{kind:'unknown'},{status:'unknown'},{extra:'unapproved'}];
  for (const changes of badValues) {
    await assertFails(setDoc(path(db('member'),'events/bad'),freshEvent(changes)));
    await assertFails(updateDoc(path(db('member'),'events/walk'),changes));
  }
  await assertFails(updateDoc(path(db('member'),'events/walk'),{venue:deleteField()}));
  const missing=freshEvent({}); delete missing.venue;
  await assertFails(setDoc(path(db('member'),'events/bad'),missing));
});
test('only current author or owner can delete events', async () => {
  await assertFails(deleteDoc(path(db('outsider'),'events/walk')));
  await assertSucceeds(deleteDoc(path(db('owner'),'events/walk')));
});
test('orphan memberships grant no access to a nonexistent circle', async () => {
  await env.withSecurityRulesDisabled(async context=>{
    await setDoc(doc(context.firestore(),'circles/missing/members/member'),{uid:'member',joinedAt:stamp});
    await setDoc(doc(context.firestore(),'circles/missing/events/walk'),{...event,circleId:'missing'});
  });
  await assertFails(getDoc(doc(db('member'),'circles/missing/events/walk')));
});
test('circle membership never grants access to private family records', async () => {
  await assertFails(getDoc(doc(db('member'),'users/owner/tasks/private')));
  await assertFails(setDoc(doc(db('member'),'users/owner/tasks/private'),{title:'Overwrite'}));
});
