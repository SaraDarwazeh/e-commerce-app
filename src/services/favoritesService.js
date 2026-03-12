import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  getDoc
} from 'firebase/firestore';

const getFavoritesRef = (uid) => collection(db, 'users', uid, 'favorites');

export const getUserFavorites = async (uid) => {
  if (!uid) return [];
  const snapshot = await getDocs(getFavoritesRef(uid));
  return snapshot.docs.map(doc => ({
    productId: doc.id,
    ...doc.data()
  }));
};

export const addFavorite = async (uid, productId) => {
  if (!uid || !productId) return;
  const favDoc = doc(getFavoritesRef(uid), productId);
  await setDoc(favDoc, {
    addedAt: serverTimestamp()
  });
};

export const removeFavorite = async (uid, productId) => {
  if (!uid || !productId) return;
  const favDoc = doc(getFavoritesRef(uid), productId);
  await deleteDoc(favDoc);
};

export const checkIsFavorite = async (uid, productId) => {
  if (!uid || !productId) return false;
  const favDoc = doc(getFavoritesRef(uid), productId);
  const snap = await getDoc(favDoc);
  return snap.exists();
};
