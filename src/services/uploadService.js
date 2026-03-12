// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dnfusxffe';
const CLOUDINARY_UPLOAD_PRESET = 'products_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Uploads an image file to Cloudinary using an unsigned upload preset.
 * @param {File} file - The file object to upload.
 * @param {string} folder - Optional folder hint (used as a tag/label, not enforced by Cloudinary without signed uploads).
 * @returns {Promise<{ url: string, path: string }>} - Cloudinary secure_url and public_id as path.
 */
export const uploadImage = async (file, folder = 'misc') => {
  if (!file) throw new Error('No file provided');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  // Cloudinary folder support via upload preset configuration or tags
  formData.append('tags', folder);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      path: data.public_id, // public_id serves as the reference for future deletion
    };
  } catch (error) {
    console.error(`[Cloudinary] Upload error (${folder}):`, error);
    throw new Error(error.message || 'Image upload failed');
  }
};

/**
 * Deletes an image from Cloudinary.
 * NOTE: Client-side deletion requires a signed request or a backend endpoint.
 * This is a no-op stub — implement server-side deletion if needed.
 * @param {string} publicId - The Cloudinary public_id of the image to delete.
 */
export const deleteImage = async (publicId) => {
  if (!publicId) return;
  // Cloudinary client-side deletion requires signed requests for security.
  // For now, we suppress the error silently (orphaned images can be cleaned
  // from the Cloudinary Media Library directly).
  console.info(`[Cloudinary] deleteImage: ${publicId} — server-side deletion not configured.`);
};
