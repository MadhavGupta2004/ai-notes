import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCzvoKGAeX21mCttvOUBGkSBZkomAnJOr0",
  authDomain: "ai-notes-75a33.firebaseapp.com",
  projectId: "ai-notes-75a33",
  storageBucket: "ai-notes-75a33.firebasestorage.app",
  messagingSenderId: "255288722688",
  appId: "1:255288722688:web:cd397f525041e4edc71fe5",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
