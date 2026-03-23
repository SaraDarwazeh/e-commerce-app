import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * Safely creates a user document in Firestore if it doesn't exist,
 * or updates only the missing/changed fields if it does.
 * Never overwrites role or createdAt.
 */
export const ensureUserDocument = async (user, extraData = {}) => {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // First time: create full document
    const profile = {
      uid: user.uid,
      fullName: extraData.fullName || user.displayName || '',
      email: extraData.email || user.email || '',
      phone: extraData.phone || user.phoneNumber || '',
      authMethod: extraData.authMethod || 'email',
      role: 'customer',
      region: '',
      address: '',
      notes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
  } else {
    // Already exists: update empty fields only, preserve role
    const existing = snap.data();
    const updates = { updatedAt: serverTimestamp() };
    if (!existing.email && (extraData.email || user.email))  updates.email  = extraData.email || user.email || '';
    if (!existing.phone && (extraData.phone || user.phoneNumber)) updates.phone = extraData.phone || user.phoneNumber || '';
    if (!existing.fullName && (extraData.fullName || user.displayName)) updates.fullName = extraData.fullName || user.displayName || '';
    await updateDoc(ref, updates);
    return { ...existing, ...updates };
  }
};

// Create a new user with email and password, and create a Firestore profile
export const signUp = async (email, password, fullName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userProfile = await ensureUserDocument(user, { fullName, email, authMethod: 'email' });
  return { user, userProfile };
};

// Sign in with email and password
export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userProfile = await ensureUserDocument(user, { email, authMethod: 'email' });
  return { user, userProfile };
};

// Sign in with Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;
  const userProfile = await ensureUserDocument(user, { authMethod: 'google' });
  return { user, userProfile };
};

/**
 * Creates a RecaptchaVerifier instance.
 * Call this inside a useEffect one-time, or on-demand once.
 * @param {HTMLElement} container - The DOM element ref
 * @returns {RecaptchaVerifier}
 */
export const createRecaptchaVerifier = (container) => {
  if (!container) return null;
  
  // Clear any old instance to avoid "already rendered" conflicts
  if (window._recaptchaVerifier) {
    try { window._recaptchaVerifier.clear(); } catch (_) {}
    window._recaptchaVerifier = null;
  }

  try {
    const verifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        // reCAPTCHA expired, maybe reset
      }
    });
    window._recaptchaVerifier = verifier;
    return verifier;
  } catch (err) {
    console.error('[createRecaptchaVerifier] Failed:', err);
    return null;
  }
};

/**
 * Sends an OTP to a phone number using an existing verifier.
 * @param {string} phoneNumber - E.164 format
 * @param {RecaptchaVerifier} verifier
 * @returns {ConfirmationResult}
 */
export const sendPhoneOTP = async (phoneNumber, verifier) => {
  if (!verifier) {
    throw new Error('reCAPTCHA not initialized. Please refresh.');
  }

  try {
    console.log('[sendPhoneOTP] Sending to:', phoneNumber);
    // Ensure it's rendered
    await verifier.render();
    
    const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return result;
  } catch (error) {
    console.error('[sendPhoneOTP] Firebase Auth 400 Error Details:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    
    // Friendly mapping for common 400 errors
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('The phone number is invalid. Use E.164 format (e.g. +97250...)');
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized in Firebase Console.');
    }
    
    throw error;
  }
};



/**
 * Verify the OTP code returned from sendPhoneOTP.
 * @param {ConfirmationResult} confirmationResult
 * @param {string} code - 6-digit OTP
 * @param {string} fullName - Optional, for new phone sign-ups
 * @returns {{ user, userProfile }}
 */
export const verifyPhoneOTP = async (confirmationResult, code, fullName = '') => {
  const result = await confirmationResult.confirm(code);
  const user = result.user;
  const userProfile = await ensureUserDocument(user, {
    phone: user.phoneNumber || '',
    fullName,
    authMethod: 'phone'
  });
  return { user, userProfile };
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

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// Cloud Function 1: Request Password Reset OTP
export const requestPasswordResetOTP = async (email, lang = 'en') => {
  try {
    const fn = httpsCallable(functions, 'requestPasswordReset');
    const response = await fn({ email, lang });
    return response.data;
  } catch (error) {
    console.error('requestPasswordResetOTP error:', error);
    throw error;
  }
};

// Cloud Function 1.5: Verify OTP (UI intermediary step)
export const verifyOTPOnly = async (email, otp) => {
  try {
    const fn = httpsCallable(functions, 'verifyOTPOnly');
    const response = await fn({ email, otp });
    return response.data;
  } catch (error) {
    console.error('verifyOTPOnly error:', error);
    throw error;
  }
};

// Cloud Function 2: Verify OTP & Reset Password
export const verifyOTPAndResetPassword = async (email, otp, newPassword) => {
  try {
    const fn = httpsCallable(functions, 'verifyAndResetPassword');
    const response = await fn({ email, otp, newPassword });
    return response.data;
  } catch (error) {
    console.error('verifyOTPAndResetPassword error:', error);
    throw error;
  }
};
