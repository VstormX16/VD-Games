import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDoL_Od005D8S7iHdGinGsjnDymolArP8",
  authDomain: "vd-game-a4edc.firebaseapp.com",
  projectId: "vd-game-a4edc",
  storageBucket: "vd-game-a4edc.firebasestorage.app",
  messagingSenderId: "533599586960",
  appId: "1:533599586960:web:9406a4bc348de32e26e615",
  measurementId: "G-BHD955PHF3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);
