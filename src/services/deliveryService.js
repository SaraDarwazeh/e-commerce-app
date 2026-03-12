import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_DOC = 'config/delivery';

export const getDeliverySettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    // Return default fallback if document doesn't exist yet
    return {
      westBankCost: 15,
      insideCost: 30,
      freeDeliveryEnabled: false,
      freeDeliveryThresholdEnabled: true,
      freeDeliveryThresholdAmount: 50,
      enabled: true
    };
  } catch (error) {
    console.error("Error fetching delivery settings:", error);
    // Return safe fallback so app doesn't crash on fetch
    return {
      westBankCost: 15,
      insideCost: 30,
      freeDeliveryEnabled: false,
      freeDeliveryThresholdEnabled: true,
      freeDeliveryThresholdAmount: 50,
      enabled: true
    };
  }
};

export const updateDeliverySettings = async (settingsData) => {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    // Use setDoc with merge to create it if it doesn't exist yet
    await setDoc(docRef, settingsData, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating delivery settings:", error);
    throw error;
  }
};
