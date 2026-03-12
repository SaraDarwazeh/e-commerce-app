import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Fetches the user's cart from Firestore.
 * Route: users/{uid}/cart/{itemId}
 * @param {string} uid User ID
 * @returns {Array} Array of cart items (excluding the document ID itself if structured carefully)
 */
export const getUserCart = async (uid) => {
  if (!uid) return [];
  try {
    const cartRef = collection(db, 'users', uid, 'cart');
    const snapshot = await getDocs(cartRef);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      cartItemId: doc.id
    }));
  } catch (error) {
    console.error("Error fetching cart from Firestore:", error);
    throw error;
  }
};

/**
 * Adds or updates an item in the user's Firestore cart.
 * If the item exists, overwrites it with the new quantity.
 * @param {string} uid User ID
 * @param {object} item Product info + quantity
 */
export const syncCartItem = async (uid, item) => {
  if (!uid || !item.cartItemId) return;
  try {
    const itemRef = doc(db, 'users', uid, 'cart', item.cartItemId);
    await setDoc(itemRef, {
      ...item,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error syncing cart item:", error);
    throw error;
  }
};

/**
 * Removes an item from the user's Firestore cart.
 * @param {string} uid User ID
 * @param {string} cartItemId Identifies the unique combination of product + options
 */
export const removeCartItem = async (uid, cartItemId) => {
  if (!uid || !cartItemId) return;
  try {
    const itemRef = doc(db, 'users', uid, 'cart', cartItemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error("Error removing cart item:", error);
    throw error;
  }
};

/**
 * Clears the user's Firestore cart safely.
 * @param {string} uid User ID
 */
export const clearUserCart = async (uid) => {
  if (!uid) return;
  try {
    const cartRef = collection(db, 'users', uid, 'cart');
    const snapshot = await getDocs(cartRef);
    const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, 'users', uid, 'cart', document.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error clearing user cart:", error);
    throw error;
  }
};
