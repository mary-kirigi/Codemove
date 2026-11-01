// =====================================================================
// NEW FILE – server/routes/usernameLogin.js
// Lets someone log in with a USERNAME + password. Supabase only signs in with an email, so the server finds the
// email for that username, signs in on the person's behalf, and hands the session back to the browser.
// The email is never sent to the browser, and every failure gives the same message (so usernames can't be probed).
// This route is PUBLIC (no login needed) and is mounted in index.js before the login check.
// =====================================================================
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { sb } from '../supabase.js';
import { h } from '../middleware.js';
import { cleanUsername, USERNAME_RE } from '../lib/username.js';

// A few wrong guesses are allowed, then a cool-down (per username, and per address as a wider net).
const WINDOW = 600_000, tries = new Map();
const recent = (k) => (tries.get(k) || []).filter((t) => Date.now() - t < WINDOW);
const blocked = (k, max) => recent(k).length >= max;
const note = (k) => { if (tries.size > 5000) tries.clear(); tries.set(k, [...recent(k), Date.now()]); };

// Signs in with a throw-away client, so the shared server client never takes on someone's session.
// Uses SUPABASE_ANON_KEY when you set it on the server, otherwise the service key.
async function realSignIn(email, password) {
  const c = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  return error || !data?.session ? null : data.session;
}

export function createUsernameLogin(signIn = realSignIn) {
  const r = Router();
  r.post('/username-login', h(async (req, res) => {
    const username = cleanUsername(req.body?.username), password = String(req.body?.password ?? '');
    const kU = `u:${username}`, kI = `i:${req.ip}`;
    if (blocked(kU, 8) || blocked(kI, 40)) return res.status(429).json({ error: 'Too many wrong tries. Wait a few minutes and try again.' });
    const fail = () => { note(kU); note(kI); return res.status(401).json({ error: 'Wrong username or password.' }); };
    if (!USERNAME_RE.test(username) || !password) return fail();
    const { data: u } = await sb.from('users').select('email,is_active').eq('username', username).maybeSingle();
    if (!u || !u.is_active) return fail();
    const session = await signIn(u.email, password);
    if (!session) return fail();
    res.json({ access_token: session.access_token, refresh_token: session.refresh_token });
  }));
  return r;
}
export const usernameLogin = createUsernameLogin();
