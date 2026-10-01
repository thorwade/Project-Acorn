import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getBlob,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyCUAP8mBr8aTTdSXA6IebSjsoPtx7XHqK8",
  authDomain: "project-acorn-1868e.firebaseapp.com",
  projectId: "project-acorn-1868e",
  storageBucket: "project-acorn-1868e.firebasestorage.app",
  messagingSenderId: "688983850743",
  appId: "1:688983850743:web:6153c622433b3857321df2",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();

export {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getBlob,
  onAuthStateChanged,
  onSnapshot,
  orderBy,
  query,
  ref,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signOut,
  updateDoc,
  uploadBytesResumable,
  deleteObject,
};
