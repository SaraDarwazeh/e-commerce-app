import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

const COLLECTION_NAME = 'pickupPoints';

export const getPickupPoints = async (activeOnly = false) => {
  try {
    const collRef = collection(db, COLLECTION_NAME);
    let q = collRef;
    if (activeOnly) {
      q = query(collRef, where('isActive', '==', true));
    }
    const snapshot = await getDocs(q);
    const points = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by creation time
    points.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() ?? new Date(0);
      const bTime = b.createdAt?.toDate?.() ?? new Date(0);
      return bTime - aTime;
    });
    
    return points;
  } catch (error) {
    console.error("Error fetching pickup points:", error);
    return [];
  }
};

export const createPickupPoint = async (data) => {
  try {
    const newRef = doc(collection(db, COLLECTION_NAME));
    const payload = {
      ...data,
      isActive: data.isActive ?? true,
      createdAt: serverTimestamp()
    };
    await setDoc(newRef, payload);
    return { id: newRef.id, ...payload };
  } catch (error) {
    console.error("Error creating pickup point:", error);
    throw error;
  }
};

export const updatePickupPoint = async (id, data) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating pickup point:", error);
    throw error;
  }
};

export const deletePickupPoint = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting pickup point:", error);
    throw error;
  }
};
