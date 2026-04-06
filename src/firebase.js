import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLpELcjmt_f_LkaM1x5knqa8RNSI1LJY8",
  authDomain: "ayewqur-ayew-a48af.firebaseapp.com",
  projectId: "ayewqur-ayew-a48af",
  storageBucket: "ayewqur-ayew-a48af.firebasestorage.app",
  messagingSenderId: "198405017817",
  appId: "1:198405017817:web:87591e3084322b6c196ec8",
  measurementId: "G-936WZEEP4C"
};

// Firebaseni ishga tushirish
const app = initializeApp(firebaseConfig);

// Dastur qolgan joylarda ishlata olishi uchun eksport qilish
export const auth = getAuth(app);
export const db = getFirestore(app);


