import { supabase } from './supabase';

/**
 * Uploads multiple files to Supabase Storage under the 'vehicle-images' bucket.
 * @param files - Array of File objects to upload.
 * @param folder - Optional folder within the bucket (e.g., 'vehicle-images').
 * @returns Promise resolves to an array of public URLs for the uploaded files.
 */
export async function uploadFiles(files: File[], folder: string = ''): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    // Generate a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const path = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from('vehicle-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Error uploading file ${file.name}: ${error.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(path);

    return urlData.publicUrl;
  });

  // Wait for all uploads to complete
  const urls = await Promise.all(uploadPromises);
  return urls;
}

/**
 * Deletes a file from Supabase Storage.
 * @param path - The path of the file to delete (relative to the bucket root).
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from('vehicle-images').remove([path]);
  if (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }
}