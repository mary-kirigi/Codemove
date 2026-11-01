// NEW – lets a person choose the username they can log in with (as well as their email).
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api';

export default function UsernameField() {
  const { me, setMe } = useOutletContext();
  const [u, setU] = useState(me.username || '');
  const [msg, setMsg] = useState(''), [ok, setOk] = useState(false);
  async function save() {
    setMsg('');
    try {
      await api('/me', { method: 'PATCH', body: { username: u } });
      const clean = u.trim().toLowerCase();
      setMe({ ...me, username: clean || null }); setU(clean); setOk(true);
      setMsg(clean ? 'Username saved. You can now log in with it.' : 'Username removed.');
    } catch (e) { setOk(false); setMsg(e.message); }
  }
  return (
    <>
      <label className="f">Username for logging in
        <input value={u} onChange={(e) => setU(e.target.value)} placeholder="e.g. mary.k" maxLength={20} autoCapitalize="none" autoComplete="off" /></label>
      <p className="muted">3–20 letters, numbers, dots, dashes or underscores. You can log in with this or with your email. Leave it empty to remove it.</p>
      {msg && <p className={ok ? 'note' : 'note error'} role="status">{msg}</p>}
      <button className="btn" onClick={save}>Save username</button>
    </>
  );
}
