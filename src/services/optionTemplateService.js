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
  orderBy
} from 'firebase/firestore';

const TEMPLATES_COLLECTION = 'optionTemplates';

/**
 * Fetch all option templates
 */
export const getOptionTemplates = async () => {
  const templatesRef = collection(db, TEMPLATES_COLLECTION);
  const q = query(templatesRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Create an option template
 * `templateData` shape:
 * {
 *   name: "Clothing",
 *   optionGroups: [
 *     { name: "Size", values: ["S", "M", "L", "XL"] },
 *     { name: "Color", values: ["Black", "White"] }
 *   ]
 * }
 */
export const createOptionTemplate = async (templateData) => {
  const newRef = doc(collection(db, TEMPLATES_COLLECTION));
  
  const payload = {
    ...templateData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(newRef, payload);
  return { id: newRef.id, ...payload };
};

/**
 * Update an option template
 */
export const updateOptionTemplate = async (id, templateData) => {
  const docRef = doc(db, TEMPLATES_COLLECTION, id);
  await updateDoc(docRef, {
    ...templateData,
    updatedAt: serverTimestamp()
  });
};

/**
 * Delete an option template
 */
export const deleteOptionTemplate = async (id) => {
  const docRef = doc(db, TEMPLATES_COLLECTION, id);
  await deleteDoc(docRef);
};
