/**
 * Firebase Configuration & Initialization
 * Shared across public portfolio, admin login, and dashboard pages.
 * Uses Firebase Web SDK v9+ modular CDN imports.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
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
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBjr5Om7h_r2RcWLupohXLUaOPduzknz40",
    authDomain: "ahmed-portfolio-a3085.firebaseapp.com",
    projectId: "ahmed-portfolio-a3085",
    storageBucket: "ahmed-portfolio-a3085.firebasestorage.app",
    messagingSenderId: "890273916430",
    appId: "1:890273916430:web:90401ce42dedcb592dbe5f",
    measurementId: "G-FCKTWGHYCL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---- Helper: Check if user is admin ----
async function checkAdminRole(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking admin role:", error);
        return false;
    }
}

// ---- Helper: Fetch active documents ordered by 'order' field ----
async function fetchActiveOrdered(collectionName) {
    try {
        const q = query(
            collection(db, collectionName),
            orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(item => item.isActive !== false);
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return null;
    }
}

// ---- Helper: Fetch all documents ordered by 'order' field ----
async function fetchAllOrdered(collectionName) {
    try {
        const q = query(
            collection(db, collectionName),
            orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error(`Error fetching all ${collectionName}:`, error);
        return [];
    }
}

// ---- Helper: Fetch site settings ----
async function fetchSiteSettings() {
    try {
        const docRef = doc(db, "siteSettings", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching site settings:", error);
        return null;
    }
}

// Export everything needed
export {
    app,
    auth,
    db,
    // Auth functions
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    // Firestore functions
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
    Timestamp,
    // Custom helpers
    checkAdminRole,
    fetchActiveOrdered,
    fetchAllOrdered,
    fetchSiteSettings
};
