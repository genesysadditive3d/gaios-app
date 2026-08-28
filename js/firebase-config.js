// Shared Firebase init — imported by every page instead of re-pasting config.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVpKkyYzxyn" + "UgKCkZCdmz0nzeol3DIhVs",
  authDomain: "gaios-app.firebaseapp.com",
  projectId: "gaios-app",
  storageBucket: "gaios-app.firebasestorage.app",
  messagingSenderId: "849630241858",
  appId: "1:849630241858:web:786002cc0803f4488bb9db"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
