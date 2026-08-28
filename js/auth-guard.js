// Shared dashboard auth-guard + logout. Every dashboard-*.html calls
// requireRole([...allowed roles...], onReady) at the top of its module script.
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const ROUTES = {
  admin: '/dashboard-admin.html',
  production: '/dashboard-production.html',
  scanpoint: '/dashboard-scanpoint.html',
  qc: '/dashboard-qc.html',
  customer: '/dashboard-customer.html'
};

export function routeForRole(role) {
  return ROUTES[role] || '/dashboard-customer.html';
}

function getCached() {
  try { return JSON.parse(localStorage.getItem('gaios_user') || 'null'); } catch (e) { return null; }
}

function setCached(userData) {
  localStorage.setItem('gaios_user', JSON.stringify(userData));
}

/**
 * Guards a dashboard page.
 * @param {string[]} allowedRoles - roles permitted on this page
 * @param {(userData:object)=>void} onReady - called once role is confirmed
 */
export function requireRole(allowedRoles, onReady) {
  // Fast local check first so the page doesn't flash unstyled/wrong content
  // while Firebase's auth state resolves.
  const cached = getCached();
  if (cached && allowedRoles.includes(cached.role)) {
    document.body.style.visibility = 'visible';
    if (onReady) onReady(cached);
  } else if (cached && cached.role && !allowedRoles.includes(cached.role)) {
    window.location.href = routeForRole(cached.role);
    return;
  } else {
    document.body.style.visibility = 'hidden';
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      localStorage.removeItem('gaios_user');
      window.location.href = '/auth.html';
      return;
    }

    let role = 'customer';
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists() && snap.data().role) role = snap.data().role;
    } catch (e) { /* fall back to customer */ }

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || (user.email || '').split('@')[0],
      role
    };
    setCached(userData);

    if (!allowedRoles.includes(role)) {
      window.location.href = routeForRole(role);
      return;
    }

    document.body.style.visibility = 'visible';
    if (onReady) onReady(userData);
  });
}

export async function gaiosLogout() {
  try { await signOut(auth); } catch (e) { /* ignore */ }
  localStorage.removeItem('gaios_user');
  window.location.href = '/auth.html';
}
window.gaiosLogout = gaiosLogout;
