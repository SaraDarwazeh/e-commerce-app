import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'categories';

// Get all categories — fetch all, sort + filter client-side to avoid composite index requirement
export const getCategories = async (activeOnly = false) => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(query(categoriesRef));
    
    let categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (activeOnly) {
      categories = categories.filter(c => c.isActive !== false);
    }

    // Sort client-side by sortOrder, then by name
    categories.sort((a, b) => {
      const orderDiff = (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      if (orderDiff !== 0) return orderDiff;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
    
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(categoriesRef, {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...categoryData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
};
