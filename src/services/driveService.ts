import { DriveFileItem } from '../types';
import { getAccessToken } from './auth';

export const listDriveFiles = async (
  query = "mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder'",
  pageSize = 30
): Promise<DriveFileItem[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Drive');
  }

  const fields = 'files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, createdTime)';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=${encodeURIComponent(
    fields
  )}&q=${encodeURIComponent(query + ' and trashed = false')}&orderBy=createdTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao consultar Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
};

export const searchDriveFolders = async (searchTerm = ''): Promise<DriveFileItem[]> => {
  let query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  if (searchTerm.trim()) {
    query += ` and name contains '${searchTerm.replace(/'/g, "\\'")}'`;
  }
  return listDriveFiles(query, 25);
};

export const searchDriveImages = async (searchTerm = ''): Promise<DriveFileItem[]> => {
  let query = "mimeType contains 'image/' and trashed = false";
  if (searchTerm.trim()) {
    query += ` and name contains '${searchTerm.replace(/'/g, "\\'")}'`;
  }
  return listDriveFiles(query, 30);
};

export const createDriveFolder = async (folderName: string): Promise<DriveFileItem> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Drive');
  }

  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao criar pasta no Google Drive (${res.status})`);
  }

  return await res.json();
};

export const parseDriveUrlOrId = (input: string): { type: 'file' | 'folder' | 'unknown'; id: string } => {
  if (!input) return { type: 'unknown', id: '' };
  
  // Folders: https://drive.google.com/drive/folders/1a2b3c...
  const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    return { type: 'folder', id: folderMatch[1] };
  }

  // Files: https://drive.google.com/file/d/1a2b3c.../view
  const fileMatch = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return { type: 'file', id: fileMatch[1] };
  }

  // Direct ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) {
    return { type: 'file', id: input.trim() };
  }

  return { type: 'unknown', id: input };
};
