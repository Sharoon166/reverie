import { APPWRITE_DB } from './appwrite';

export function getImageUrl(fileId?: string) {
  if (!fileId) return '/default-avatar.png'; // fallback

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  const bucketId = APPWRITE_DB.buckets.reverie;

  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${project}`;
}
