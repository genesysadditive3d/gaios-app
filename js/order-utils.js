// Shared order/pricing/payment helpers used by all dashboards.
import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const DEFAULT_PRICING = {
  '7cm':   { label: '7 cm',   price: 3000 },
  '10cm':  { label: '10 cm',  price: 5000 },
  '12.5cm':{ label: '12.5 cm',price: 7000 },
  '15cm':  { label: '15 cm',  price: 10000 }
};

export async function getPricing() {
  try {
    const snap = await getDoc(doc(db, 'config', 'pricing'));
    if (snap.exists() && snap.data().sizes) return snap.data().sizes;
  } catch (e) { /* fall back to defaults */ }
  return DEFAULT_PRICING;
}

export async function savePricing(sizes) {
  await setDoc(doc(db, 'config', 'pricing'), { sizes, updatedAt: new Date().toISOString() }, { merge: true });
}

// Returns null if admin hasn't configured payment details yet — callers
// should show "payment setup pending" rather than a broken QR.
export async function getPaymentConfig() {
  try {
    const snap = await getDoc(doc(db, 'config', 'payment'));
    if (snap.exists()) return snap.data();
  } catch (e) { /* not configured */ }
  return null;
}

export async function savePaymentConfig(cfg) {
  await setDoc(doc(db, 'config', 'payment'), { ...cfg, updatedAt: new Date().toISOString() }, { merge: true });
}

export function generateOrderId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GAIOS-${yy}${mm}${dd}-${rand}`;
}

// Linear happy-path flow. qc_rejected branches off qc_review and rejoins
// at qc_review after the customer/scan point re-submits.
export const STATUS_FLOW = [
  'created', 'payment_pending', 'paid', 'qc_review', 'qc_approved', 'customer_review',
  'queued', 'printing', 'post_processing', 'ready', 'shipped', 'delivered'
];

export const STATUS_META = {
  created:         { label: 'Order Created',      color: '#7A8FA6', icon: '📝' },
  payment_pending: { label: 'Payment Pending',     color: '#FF9500', icon: '💳' },
  payment_submitted:{label: 'Payment Under Verification', color: '#FF9500', icon: '🔎' },
  paid:            { label: 'Payment Received',    color: '#00D68F', icon: '✅' },
  qc_review:       { label: 'Under QC Review',     color: '#4D9FFF', icon: '🔍' },
  qc_approved:     { label: 'QC Approved',         color: '#00D68F', icon: '👍' },
  qc_rejected:     { label: 'QC Rejected — Redo',  color: '#FF4D6D', icon: '⚠️' },
  customer_review: { label: 'Awaiting Your Approval', color: '#4D9FFF', icon: '👀' },
  customer_rejected:{label: 'Changes Requested',   color: '#FF4D6D', icon: '✋' },
  queued:          { label: 'Queued for Printing', color: '#C9A84C', icon: '⏳' },
  printing:        { label: 'Printing',            color: '#C9A84C', icon: '🖨️' },
  post_processing: { label: 'Post-Processing',     color: '#C9A84C', icon: '🎨' },
  ready:           { label: 'Ready',               color: '#00D68F', icon: '📦' },
  shipped:         { label: 'Shipped',             color: '#4D9FFF', icon: '🚚' },
  delivered:       { label: 'Delivered',           color: '#00D68F', icon: '🎉' }
};

export function statusMeta(status) {
  return STATUS_META[status] || { label: status || 'Unknown', color: '#7A8FA6', icon: '•' };
}

// ── Learning-data pipeline ──────────────────────────────────────────
// Append-only feed for the future local ML/learning engine (DGX Spark).
// `type` is one of: 'qc_feedback' | 'print_outcome' | 'customer_rating' |
// 'order_snapshot'. Never throws into the caller's UI flow — logging
// failure shouldn't block the actual order action that triggered it.
export async function logLearningEvent(type, payload) {
  try {
    await addDoc(collection(db, 'learning_data'), {
      type,
      ...payload,
      loggedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('learning_data log failed:', e.message);
  }
}

export function buildUpiLink(vpa, payeeName, amount, orderId) {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    am: String(amount),
    cu: 'INR',
    tn: `GAIOS Order ${orderId}`
  });
  return `upi://pay?${params.toString()}`;
}
