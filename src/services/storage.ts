import { storage, ID} from "@/lib/appwrite"



/**
 * Rename a File object before upload.
 */
export function renameFile(originalFile: File, newName: string): File {
  return new File([originalFile], newName, { type: originalFile.type });
}

/**
 * Upload a file to a given bucket with optional renaming.
 */
export async function uploadFile(
  bucketId: string,
  file: File,
  options?: { newName?: string; customId?: string }
) {
  const { newName, customId } = options || {};

  // Rename if newName provided
  const finalFile = newName ? renameFile(file, newName) : file;

  return storage.createFile(
    bucketId,
    customId || ID.unique(), // use customId or unique ID
    finalFile
  );
}

/**
 * Get a preview URL for a file in a bucket.
 */
export function getFilePreview(bucketId: string, fileId: string) {
  return storage.getFilePreview(bucketId, fileId);
}

/**
 * Get a download URL for a file in a bucket.
 */
export function getFileDownload(bucketId: string, fileId: string) {
  return storage.getFileDownload(bucketId, fileId);
}

/**
 * Delete a file from a bucket.
 */
export async function deleteFile(bucketId: string, fileId: string) {
  return storage.deleteFile(bucketId, fileId);
}