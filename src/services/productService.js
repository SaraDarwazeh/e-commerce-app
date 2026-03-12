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

const PRODUCTS_COLLECTION = 'products';

/**
 * Upload image (mock – real Storage upload goes here later)
 */
export const uploadProductImage = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://placehold.co/400x400?text=Uploaded+Image`);
    }, 1000);
  });
};

/**
 * Fetch all products. Uses only single-field where clauses to avoid
 * requiring Firestore composite indexes.  Sorting is done client-side.
 * @param {boolean} activeOnly - If true, fetches only isActive == true
 */
export const getProducts = async (activeOnly = false) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  let q;

  if (activeOnly) {
    q = query(productsRef, where('isActive', '==', true));
  } else {
    q = query(productsRef);
  }

  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Sort client-side by createdAt descending
  products.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
    const bTime = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
    return bTime - aTime;
  });

  return products;
};

/**
 * Fetch featured products (isFeatured === true AND isActive === true).
 * Uses a single where clause + client-side filter to avoid composite index.
 */
export const getFeaturedProducts = async () => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  // Only filter by isActive in the query (single field, no index needed)
  const q = query(productsRef, where('isActive', '==', true));
  const snapshot = await getDocs(q);

  const products = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => p.isFeatured === true); // client-side filter

  // Sort by createdAt descending client-side
  products.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
    const bTime = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
    return bTime - aTime;
  });

  return products;
};

/**
 * Fetch a single product by ID
 */
export const getProductById = async (id) => {
  if (!id) return null;
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
};

/**
 * Create a new product
 */
export const createProduct = async (productData) => {
  const newRef = doc(collection(db, PRODUCTS_COLLECTION));
  const payload = {
    ...productData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(newRef, payload);
  return { id: newRef.id, ...payload };
};

/**
 * Update an existing product
 */
export const updateProduct = async (id, productData) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...productData,
    updatedAt: serverTimestamp()
  });
};

/**
 * Delete a product
 */
export const deleteProduct = async (id) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
};

/**
 * Fetch sale products (showInSaleSection === true AND isActive === true).
 */
export const getSaleProducts = async () => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(productsRef, where('isActive', '==', true));
  const snapshot = await getDocs(q);

  const products = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => p.showInSaleSection === true);

  products.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
    const bTime = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
    return bTime - aTime;
  });

  return products;
};
