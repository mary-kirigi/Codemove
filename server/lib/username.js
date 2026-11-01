// =====================================================================
// NEW FILE – server/lib/username.js : the rules for usernames (used by the profile, admin and login routes)
// =====================================================================
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,19}$/;          // 3–20 chars; letters, numbers, . _ -
const RESERVED = new Set(['admin', 'administrator', 'teacher', 'support', 'codemove', 'root', 'staff', 'moderator']);

export const cleanUsername = (v) => String(v ?? '').trim().toLowerCase();

// Returns a message when the name is not allowed, or '' when it is fine.
// `reserved: false` lets an admin hand out names such as "teacher1" without the reserved-word check.
export function usernameProblem(u, { reserved = true } = {}) {
  if (!USERNAME_RE.test(u)) return 'Use 3–20 letters, numbers, dots, dashes or underscores, starting with a letter or number.';
  if (reserved && RESERVED.has(u)) return 'That username is reserved. Please choose another one.';
  return '';
}
