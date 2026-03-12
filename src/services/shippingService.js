import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const SETTINGS_DOC = 'config/shipping';

export const getShippingSettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    // Return default fallback if document doesn't exist yet
    return {
      rates: {
        'West Bank': 15,
        'Inside': 30
      },
      freeShippingThreshold: 50,
      active: true
    };
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    // Return safe fallback so app doesn't crash on fetch
    return {
      rates: { 'West Bank': 15, 'Inside': 30 },
      freeShippingThreshold: 50,
      active: true
    };
  }
};

export const updateShippingSettings = async (settingsData) => {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    // Use setDoc with merge to create it if it doesn't exist yet
    await setDoc(docRef, settingsData, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating shipping settings:", error);
    throw error;
  }
};
