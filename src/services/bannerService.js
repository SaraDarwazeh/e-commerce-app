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

const COLLECTION_NAME = 'homepageBanners';

// Default elegant fallback banners if the database is completely empty
const FALLBACK_BANNERS = [
  {
    id: 'fallback-1',
    title: 'New Arrivals',
    subtitle: 'Discover the latest additions to our luxury collection.',
    ctaText: 'Shop New In',
    ctaLink: '/products',
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1600&q=80',
    isActive: true,
    order: 1
  },
  {
    id: 'fallback-2',
    title: 'Evening Elegance',
    subtitle: 'Hand-picked clutches and minis for your next night out.',
    ctaText: 'Explore Evening',
    ctaLink: '/products?category=evening-bags',
    image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1600&q=80',
    isActive: true,
    order: 2
  }
];

export const getBanners = async (activeOnly = false) => {
  try {
    const bannersRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(query(bannersRef));
    
    let banners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // If db has never been seeded or initialized with banners, return gorgeous fallbacks
    if (banners.length === 0) {
      banners = [...FALLBACK_BANNERS];
    }

    if (activeOnly) {
      banners = banners.filter(b => b.isActive !== false);
    }

    // Sort client-side by order
    banners.sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });
    
    return banners;
  } catch (error) {
    console.error("Error fetching banners:", error);
    throw error;
  }
};

export const getBannerById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching banner ${id}:`, error);
    throw error;
  }
};

export const createBanner = async (bannerData) => {
  try {
    const bannersRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(bannersRef, {
      ...bannerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating banner:", error);
    throw error;
  }
};

export const updateBanner = async (id, bannerData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...bannerData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error updating banner ${id}:`, error);
    throw error;
  }
};

export const deleteBanner = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting banner ${id}:`, error);
    throw error;
  }
};
