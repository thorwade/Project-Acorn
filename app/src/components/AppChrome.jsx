import React from 'react';
import { CalendarDays, Download, Image, Leaf, ListTodo, LogIn, LogOut, Mail, Menu, NotebookPen, Settings, UserRound, Users, X } from 'lucide-react';
import { AccountAvatar } from '../AccountProfile.jsx';
import { FileText } from 'lucide-react';

const bottomNav = [
  ['home','Home',Users],['events','Events',CalendarDays],['circles','Circles',Users],['todos','To-do',ListTodo],['diary','Diary',NotebookPen],
];
const menuItems = [
  ['reports','Reports',FileText],
  ['home','Home',Users],['events','Events',CalendarDays],['circles','Circles',Users],['todos','To-do List',ListTodo],['profile','Profile',UserRound],['diary','Diary',NotebookPen],['gallery','Gallery',Image],['planning','Planning',CalendarDays],['settings','Settings',Settings],['contact','Contact Us',Mail],['install','Install App',Download],
];

export default function AppChrome({activePage,menuOpen,setMenuOpen,navigate,user,onSignIn,onSignOut}) {
  return <>
    <header className="app-header">
      <button className="menu-button" type="button" onClick={()=>setMenuOpen(open=>!open)} aria-label="Open menu">{menuOpen?<X size={23}/>:<Menu size={23}/>}</button>
      <span className="brand-lockup"><span className="acorn-mark" aria-hidden="true"><Leaf size={18}/></span>Acorn</span>
    </header>
    {menuOpen&&<aside className="menu-panel" aria-label="Menu">
      <div className="menu-hero"><span className="acorn-mark large" aria-hidden="true"><Leaf size={28}/></span><strong>Acorn</strong><span>Private family learning hub</span></div>
      {menuItems.map(([id,label,Icon])=><button className={activePage===id?'active':''} type="button" onClick={()=>navigate(id)} key={id}><Icon size={18} aria-hidden="true"/>{label}</button>)}
      <div className="menu-account"><span>{user?`Signed in as ${user.displayName||user.email||'your account'}`:'Account'}</span>{user?<button type="button" onClick={onSignOut}><LogOut size={18} aria-hidden="true"/>Sign out</button>:<button type="button" onClick={onSignIn}><LogIn size={18} aria-hidden="true"/>Sign in with Google</button>}</div>
      {user&&<button className="mobile-menu-signout" type="button" onClick={onSignOut}><LogOut size={18} aria-hidden="true"/>Sign out</button>}
    </aside>}
    <section className="hero-panel">
      <div><p className="eyebrow"><span className="acorn-mark mini" aria-hidden="true"><Leaf size={14}/></span>Project Acorn</p><h1>Home Education Hub</h1><p className="hero-copy">Plan the week, capture learning moments, and keep each child's journey private in one calm family space.</p><p className="hero-tagline">Creating for home education by home educators</p></div>
      {!user?<button className="secondary-action" type="button" onClick={onSignIn}><LogIn size={18} aria-hidden="true"/>Sign in with Google</button>:<button className="secondary-action account-shortcut" type="button" onClick={()=>navigate('profile')} aria-label="View signed-in profile"><AccountAvatar user={user}/><span>{user.displayName||user.email||'Your account'}</span></button>}
    </section>
    <nav className="bottom-nav" aria-label="Primary sections">{bottomNav.map(([id,label,Icon])=><button className={activePage===id?'active':''} type="button" onClick={()=>navigate(id)} key={id}><Icon size={22} aria-hidden="true"/><span>{label}</span></button>)}</nav>
  </>;
}
