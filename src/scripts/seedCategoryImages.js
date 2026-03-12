import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Visually appropriate luxury bag images for default categories
const categoryImageMap = {
  'Hand Bags': 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop',
  'Shoulder Bags': 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800&auto=format&fit=crop',
  'Crossbody Bags': 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=800&auto=format&fit=crop',
  'Tote Bags': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop',
  'Backpacks': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop',
  'Evening Bags': 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?q=80&w=800&auto=format&fit=crop',
  'Mini Bags': 'https://images.unsplash.com/photo-1590739225287-bd2e51878d65?q=80&w=800&auto=format&fit=crop',
  'Travel Bags': 'https://images.unsplash.com/photo-1554342872-034a06541bad?q=80&w=800&auto=format&fit=crop',
  
  // generic fallback
  'default': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop'
};

export const autoAssignCategoryImages = async () => {
  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);

    let updatedCount = 0;

    for (const categoryDoc of snapshot.docs) {
      const data = categoryDoc.data();
      
      // If image is missing
      if (!data.imageUrl) {
        let assignedUrl = categoryImageMap.default;
        
        // Find specific match by name
        const matchKey = Object.keys(categoryImageMap).find(
          k => k.toLowerCase() === data.name?.toLowerCase()
        );
        
        if (matchKey) {
          assignedUrl = categoryImageMap[matchKey];
        }

        await updateDoc(doc(db, 'categories', categoryDoc.id), {
          imageUrl: assignedUrl,
          imagePath: '' // Indicate it's an external URL, not a managed storage file
        });
        updatedCount++;
      }
    }

    return updatedCount;
  } catch (error) {
    console.error("Error auto-assigning category images:", error);
    throw error;
  }
};
