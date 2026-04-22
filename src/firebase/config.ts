import { getApp, getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Вашите Firebase конфигурационни данни (ще ги вземете от Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCz9Nfpu99ypzYgvxlA6FiW0CDsoeaEkDw",
  authDomain: "artcare-4e91b.firebaseapp.com",
  projectId: "artcare-4e91b",
  storageBucket: "artcare-4e91b.firebasestorage.app",
  messagingSenderId: "902315680724",
  appId: "1:902315680724:web:5702d53664f6384e3fec41",
  measurementId: "G-7TKZ1EJ742"
  
};

// ─── Initialise app exactly once (safe for React StrictMode / HMR) ─────────
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
 
// ─── Auth — LOCAL persistence so the session survives page refresh ─────────
export const auth = getAuth(app);
 
// Set persistence once; the promise is intentionally not awaited here because
// onAuthStateChanged will always fire after the SDK is ready regardless.
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Silently ignore — falls back to the default session persistence.
});
 
// ─── Other services ────────────────────────────────────────────────────────
export const db      = getFirestore(app);
export const storage = getStorage(app);
 
export default app;