import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Uploads an image file to Firebase Storage.
 * @param {File} file - The file object to upload.
 * @param {string} folder - The storage bucket folder (e.g., 'categories', 'products').
 * @returns {Promise<{ url: string, path: string }>} - Download URL and storage path reference.
 */
export const uploadImage = async (file, folder = 'misc') => {
  if (!file) throw new Error("No file provided");

  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const path = `${folder}/${fileName}`;
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { url: downloadURL, path };
  } catch (error) {
    console.error(`Error uploading to ${folder}:`, error);
    throw new Error('Image upload failed');
  }
};

/**
 * Deletes an image from Firebase Storage using its path.
 * @param {string} path - The full path of the image in storage (e.g., 'categories/123_bag.jpg').
 */
export const deleteImage = async (path) => {
  if (!path) return;
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error(`Error deleting image at ${path}:`, error);
    // Suppress error so failing to delete an orphaned image doesn't crash the UI
  }
};
