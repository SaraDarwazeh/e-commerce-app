import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
connectFunctionsEmulator(functions, 'localhost', 5001);

const run = async () => {
    try {
        const resetPassword = httpsCallable(functions, 'requestPasswordReset');
        console.log("Calling requestPasswordReset...");
        const res = await resetPassword({ email: 'testrecovery2@example.com', lang: 'en' });
        console.log("Success:", res.data);
    } catch (e) {
        console.error("Error:", e.message, e.code, e.details);
    }
};

run();
