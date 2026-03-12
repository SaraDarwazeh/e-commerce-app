import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Create a new user with email and password, and create a Firestore profile
export const signUp = async (email, password, fullName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile document in Firestore
    const userProfile = {
      uid: user.uid,
      fullName,
      email,
      role: 'customer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    return { user, userProfile };
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Fetch user profile to ensure it exists and get role
    let userProfile = await getUserProfile(user.uid);
    
    // If somehow a profile doesn't exist, create it (e.g., from an old migration)
    if (!userProfile) {
      userProfile = {
        uid: user.uid,
        fullName: user.displayName || 'User',
        email: user.email,
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), userProfile);
    }

    return { user, userProfile };
  } catch (error) {
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if profile exists
    let userProfile = await getUserProfile(user.uid);
    
    // If not, create it
    if (!userProfile) {
      userProfile = {
        uid: user.uid,
        fullName: user.displayName || 'Google User',
        email: user.email,
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), userProfile);
    }

    return { user, userProfile };
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw error;
  }
};

// Reset Password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Get User Profile from Firestore
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Update User Profile in Firestore
export const updateUserProfile = async (uid, data) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Get All Users (Admin only)
export const getUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};
