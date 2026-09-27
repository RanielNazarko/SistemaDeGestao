import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6hbwYY4dP5o9d7ELJ7PP7IkPG4frMVCc",
  authDomain: "sistema-de-gestao-38ba7.firebaseapp.com",
  projectId: "sistema-de-gestao-38ba7",
  storageBucket: "sistema-de-gestao-38ba7.firebasestorage.app",
  messagingSenderId: "974408210302",
  appId: "1:974408210302:web:db0f832af697a17ee2c52f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
