/**
 * Firebase Configuration — reads credentials from environment variables.
 * Set up your .env file from .env.example before running.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

async function checkAdminRole(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() && snap.data().role === 'admin';
  } catch {
    return false;
  }
}

async function fetchActiveOrdered(collectionName) {
  try {
    const q   = query(collection(db, collectionName), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(item => item.isActive !== false);
  } catch {
    return null;
  }
}

async function fetchAllOrdered(collectionName) {
  try {
    const q   = query(collection(db, collectionName), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

async function fetchSiteSettings() {
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'main'));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export {
  app, auth, db,
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, orderBy, where,
  serverTimestamp, Timestamp,
  checkAdminRole, fetchActiveOrdered, fetchAllOrdered, fetchSiteSettings
};
