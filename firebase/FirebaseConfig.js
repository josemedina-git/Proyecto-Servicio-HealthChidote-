import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCn7PHBoCaC_uUGzAHwYVC4OUk7Omc3dKw",
    authDomain: "healthsensor-e7740.firebaseapp.com",
    projectId: "healthsensor-e7740",
    storageBucket: "healthsensor-e7740.firebasestorage.app",
    messagingSenderId: "829686908834",
    appId: "1:829686908834:web:383c4dc33a384c7b8f54fb"
}

const app = initializeApp(firebaseConfig, "app");

const db = getFirestore(app);

const auth = getAuth(app);

const analytics = getAnalytics(app);

export { db, app, auth, analytics }