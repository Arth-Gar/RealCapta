import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { auth } from './auth';
import { uploadFileToDrive } from './driveService';
import { DriveFileItem, PropertyPhotoItem } from '../types';
import rawConfig from '../../firebase-applet-config.json';
import { getApp } from 'firebase/app';

// Initialize Firebase Storage safely
export const getFirebaseStorage = () => {
  try {
    const app = getApp();
    const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket;
    return getStorage(app, bucket ? `gs://${bucket.replace('gs://', '')}` : undefined);
  } catch (err) {
    console.warn('Erro ao inicializar Firebase Storage:', err);
    return null;
  }
};

export type ImageUploadDestination = 'BOTH' | 'FIREBASE' | 'DRIVE';

export interface UploadResult {
  url: string;
  name: string;
  driveId?: string;
  storagePath?: string;
  provider: 'drive' | 'firebase' | 'both';
  thumbnailUrl?: string;
}

/**
 * Client-side image compression: reduces multi-megabyte camera photos (e.g. 12MB)
 * to an optimized WebP/JPEG (~200KB - 600KB) while retaining sharp readability of signboards and text.
 */
export const compressImageForWeb = async (
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85
): Promise<{ file: File; dataUrl: string }> => {
  return new Promise((resolve) => {
    // If not an image, return original
    if (!file.type.startsWith('image/')) {
      const fallbackUrl = URL.createObjectURL(file);
      return resolve({ file, dataUrl: fallbackUrl });
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ file, dataUrl: event.target?.result as string });
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve({ file: compressedFile, dataUrl });
            } else {
              resolve({ file, dataUrl });
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => {
        const fallbackUrl = URL.createObjectURL(file);
        resolve({ file, dataUrl: fallbackUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      const fallbackUrl = URL.createObjectURL(file);
      resolve({ file, dataUrl: fallbackUrl });
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Upload single image to Firebase Cloud Storage
 */
export const uploadImageToFirebase = async (
  file: File | Blob,
  fileName: string,
  propertyId?: string
): Promise<{ downloadUrl: string; storagePath: string }> => {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error('Serviço de Firebase Storage não disponível');
  }

  const user = auth.currentUser;
  const userId = user?.uid || 'public';
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const folder = propertyId ? `properties/${propertyId}` : 'capturas';
  const storagePath = `users/${userId}/${folder}/${timestamp}_${cleanName}`;

  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  return { downloadUrl, storagePath };
};

/**
 * Get displayable thumbnail / preview URL for any image source
 * Automatically transforms Google Drive URLs and file IDs into direct image thumbnail URLs.
 */
export const getDisplayImageUrl = (url?: string, driveId?: string): string => {
  if (!url && !driveId) return '';

  // 1. If explicit Drive file ID is provided
  if (driveId && driveId.length >= 15) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
  }

  if (url) {
    // 2. Direct data URLs (base64) or blob URLs
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    // 3. Firebase Cloud Storage download URLs
    if (url.includes('firebasestorage.googleapis.com')) {
      return url;
    }

    // 4. Google Drive webViewLink or view URL format:
    // https://drive.google.com/file/d/XYZ/view or https://drive.google.com/open?id=XYZ
    const driveMatch =
      url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      url.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`;
    }

    // 5. Standard HTTP image links
    return url;
  }

  return '';
};

/**
 * Upload an image using the selected destination: Google Drive, Firebase Storage, or BOTH.
 */
export const uploadPropertyImage = async (
  file: File,
  destination: ImageUploadDestination,
  options: {
    propertyId?: string;
    parentDriveFolderId?: string;
    isDriveAuthenticated: boolean;
  }
): Promise<UploadResult> => {
  // First compress the image for web performance
  const { file: optimizedFile, dataUrl } = await compressImageForWeb(file);

  let driveResult: DriveFileItem | null = null;
  let firebaseResult: { downloadUrl: string; storagePath: string } | null = null;
  let uploadErrors: string[] = [];

  // 1. Upload to Firebase Storage if requested
  if (destination === 'FIREBASE' || destination === 'BOTH') {
    try {
      firebaseResult = await uploadImageToFirebase(
        optimizedFile,
        file.name,
        options.propertyId
      );
    } catch (err: unknown) {
      console.warn('Erro ao subir para Firebase Storage:', err);
      uploadErrors.push(
        `Firebase: ${err instanceof Error ? err.message : 'Falha no upload'}`
      );
    }
  }

  // 2. Upload to Google Drive if requested
  if (
    (destination === 'DRIVE' || destination === 'BOTH') &&
    options.isDriveAuthenticated
  ) {
    try {
      driveResult = await uploadFileToDrive(file, options.parentDriveFolderId);
    } catch (err: unknown) {
      console.warn('Erro ao subir para Google Drive:', err);
      uploadErrors.push(
        `Drive: ${err instanceof Error ? err.message : 'Falha no upload'}`
      );
    }
  }

  // Determine final URL to return
  let finalUrl = '';
  let provider: 'drive' | 'firebase' | 'both' = 'firebase';

  if (firebaseResult && driveResult) {
    // Both succeeded: use Firebase URL for instant UI rendering, but link Drive ID
    finalUrl = firebaseResult.downloadUrl;
    provider = 'both';
  } else if (firebaseResult) {
    finalUrl = firebaseResult.downloadUrl;
    provider = 'firebase';
  } else if (driveResult) {
    finalUrl =
      driveResult.webViewLink ||
      `https://drive.google.com/file/d/${driveResult.id}/view`;
    provider = 'drive';
  } else {
    // If both failed or user is offline/unauthenticated, fall back to compressed dataUrl
    // so no photo is lost
    finalUrl = dataUrl;
    provider = 'firebase';
    if (uploadErrors.length > 0) {
      throw new Error(uploadErrors.join(' | '));
    }
  }

  return {
    url: finalUrl,
    name: file.name,
    driveId: driveResult?.id,
    storagePath: firebaseResult?.storagePath,
    provider,
    thumbnailUrl: driveResult?.id
      ? `https://drive.google.com/thumbnail?id=${driveResult.id}&sz=w800`
      : finalUrl,
  };
};
