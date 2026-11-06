import React from 'react';
import { Download, ShieldCheck, Upload } from 'lucide-react';

export function HoldingPage({icon,kicker,title,children}) {
  return <section className="panel page-panel holding-page"><div className="panel-heading"><div><p className="section-kicker">{kicker}</p><h2>{title}</h2></div>{icon}</div><div className="holding-copy">{children}</div></section>;
}
export function InstallPanel({canPrompt,isStandalone,onInstall}) {
  return <div className="install-grid">{isStandalone&&<div className="notice success" role="status">Project Acorn is already running like an installed app on this device.</div>}
    <article className="install-card"><span className="feature-icon"><Download size={24} aria-hidden="true"/></span><h3>Android</h3><p>On Chrome for Android, tap the install button when it appears. If the browser does not show it yet, open the Chrome menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p><button className="primary-action" type="button" onClick={onInstall}><Download size={18} aria-hidden="true"/>{canPrompt?'Install on this device':'Show install guidance'}</button></article>
    <article className="install-card"><span className="feature-icon"><Upload size={24} aria-hidden="true"/></span><h3>iPhone</h3><p>In Safari, tap the Share button, then choose <strong>Add to Home Screen</strong>. This installs Project Acorn as a home-screen web app. It is not an App Store download.</p></article>
    <article className="install-card"><span className="feature-icon"><ShieldCheck size={24} aria-hidden="true"/></span><h3>Offline note</h3><p>The app shell can open when your connection is poor, but sign-in, diary uploads, Firestore records, and private media still need a secure internet connection.</p></article>
  </div>;
}
export function InstallPage(props) {
  return <section className="panel page-panel install-panel"><div className="panel-heading"><div><p className="section-kicker">Install</p><h2>Add Project Acorn to your phone</h2></div><Download size={24} aria-hidden="true"/></div><InstallPanel {...props}/></section>;
}
