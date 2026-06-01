import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSfTQdKQxWsH3T85oq5aKSTxjnuZ37JLw",
  authDomain: "focusnest-3c458.firebaseapp.com",
  projectId: "focusnest-3c458",
  storageBucket: "focusnest-3c458.firebasestorage.app",
  messagingSenderId: "444554553214",
  appId: "1:444554553214:web:24048f32361fb2aa1eb52f",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;