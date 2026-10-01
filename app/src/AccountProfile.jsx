import React, { useEffect, useState } from 'react';
import './account-profile.css';

export function AccountAvatar({ user }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [user?.photoURL]);
  const name = user?.displayName || user?.email || 'Account';
  const photo = user?.photoURL;
  return photo && photo.startsWith('https://') && !failed
    ? <img className="account-avatar" src={photo} alt={`${name}'s profile picture`} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    : <span className="account-avatar account-initial" aria-label="Profile picture unavailable">{name.trim().charAt(0).toUpperCase() || '?'}</span>;
}

export default function AccountProfile({ user, onSignOut, onSettings }) {
  return <section className="panel account-profile" aria-label="Signed-in account">
    <p className="eyebrow">Profile · Current account</p>
    <div className="account-identity">
      <AccountAvatar user={user} />
      <div><h2>{user.displayName || 'Your account'}</h2><p className="account-email">{user.email || 'No email available'}</p></div>
    </div>
    <p>You are signed in with this account. These details come from your current sign-in, not a child profile.</p>
    <dl><dt>Sign-in method</dt><dd>{user.providerData?.some(provider => provider.providerId === 'google.com') ? 'Google' : 'Firebase account'}</dd><dt>Email status</dt><dd>{user.emailVerified ? 'Verified' : 'Not verified'}</dd></dl>
    <p>To use a different Google account, sign out and sign in again.</p>
    <div className="account-actions"><button type="button" className="secondary-action" onClick={onSignOut}>Sign out</button><button type="button" className="secondary-action" onClick={onSettings}>Manage child profiles</button></div>
  </section>;
}
