import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

const COUPONS_COLLECTION = 'coupons';

/**
 * Validates and fetches an active coupon by code.
 * Used by the customer-facing cart.
 * @param {string} code 
 * @returns {object|null} Coupon data or throws error
 */
export const validateCoupon = async (code) => {
  if (!code) throw new Error("Coupon code is required");
  
  const formattedCode = code.toUpperCase().trim();
  const couponsRef = collection(db, COUPONS_COLLECTION);
  const q = query(couponsRef, where("code", "==", formattedCode), where("isActive", "==", true));
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error("Invalid or inactive coupon code");
  }

  const coupon = snapshot.docs[0].data();
  coupon.id = snapshot.docs[0].id;

  // Additional validations
  if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
    throw new Error("This coupon has expired");
  }

  // Not checking usage limit here for brevity but we could.
  return coupon;
};

// ============================================
// ADMIN ONLY OPERATIONS
// ============================================

export const getAllCoupons = async () => {
  const couponsRef = collection(db, COUPONS_COLLECTION);
  const snapshot = await getDocs(couponsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const createCoupon = async (couponData) => {
  const code = couponData.code.toUpperCase().trim();
  // Check if it already exists
  const existingDoc = await getDoc(doc(db, COUPONS_COLLECTION, code));
  if (existingDoc.exists()) {
    throw new Error(`Coupon code ${code} already exists.`);
  }

  const newCoupon = {
    ...couponData,
    code,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // We use the code itself as the document ID for easy lookup
  await setDoc(doc(db, COUPONS_COLLECTION, code), newCoupon);
  return { id: code, ...newCoupon };
};

export const updateCoupon = async (id, updateData) => {
  const ref = doc(db, COUPONS_COLLECTION, id);
  await updateDoc(ref, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
};

export const deleteCoupon = async (id) => {
  const ref = doc(db, COUPONS_COLLECTION, id);
  await deleteDoc(ref);
};
