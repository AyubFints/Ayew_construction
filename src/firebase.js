import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Sizning Firebase bazangiz kalitlari
const firebaseConfig = {
  apiKey: "AIzaSyDulMOCZ57vaSrs1JA4fipqcG1zcdGrUaE",
  authDomain: "ayewqur-ayew.firebaseapp.com",
  projectId: "ayewqur-ayew",
  storageBucket: "ayewqur-ayew.firebasestorage.app",
  messagingSenderId: "405408640898",
  appId: "1:405408640898:web:9980a3c81e837a6b06699b"
};

// Firebase'ni ishga tushirish
const app = initializeApp(firebaseConfig);

// Xavfsizlik va Ma'lumotlar bazasini eksport qilish
export const auth = getAuth(app);
export const db = getFirestore(app);