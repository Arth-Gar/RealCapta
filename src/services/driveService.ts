import { DriveFileItem } from '../types';
import { getAccessToken } from './auth';

export interface ListDriveOptions {
  parentFolderId?: string; // 'root' or specific folder ID
  searchTerm?: string;
  searchAllDrive?: boolean;
  filterType?: 'ALL' | 'IMAGES' | 'FOLDERS';
  pageSize?: number;
}

export const listDriveFiles = async (
  query = "mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder'",
  pageSize = 50
): Promise<DriveFileItem[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Drive');
  }

  const fields = 'files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, createdTime, modifiedTime, size, parents)';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=${encodeURIComponent(
    fields
  )}&q=${encodeURIComponent(query + ' and trashed = false')}&orderBy=folder,name`;

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

/**
 * List contents inside a specific folder or across drive with advanced filters
 */
export const listFolderContents = async (options: ListDriveOptions = {}): Promise<DriveFileItem[]> => {
  const {
    parentFolderId = 'root',
    searchTerm = '',
    searchAllDrive = false,
    filterType = 'ALL',
    pageSize = 60,
  } = options;

  const queryParts: string[] = ['trashed = false'];

  // Parent condition
  if (!searchAllDrive) {
    queryParts.push(`'${parentFolderId}' in parents`);
  }

  // Type filter
  if (filterType === 'IMAGES') {
    queryParts.push("mimeType contains 'image/'");
  } else if (filterType === 'FOLDERS') {
    queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
  } else {
    // ALL: folders and images
    queryParts.push("(mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder')");
  }

  // Search term
  if (searchTerm.trim()) {
    const sanitized = searchTerm.trim().replace(/'/g, "\\'");
    queryParts.push(`name contains '${sanitized}'`);
  }

  const fullQuery = queryParts.join(' and ');
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Drive');
  }

  const fields = 'files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, createdTime, modifiedTime, size, parents)';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=${encodeURIComponent(
    fields
  )}&q=${encodeURIComponent(fullQuery)}&orderBy=folder,name`;

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
  return listDriveFiles(query, 30);
};

export const searchDriveImages = async (searchTerm = ''): Promise<DriveFileItem[]> => {
  let query = "mimeType contains 'image/' and trashed = false";
  if (searchTerm.trim()) {
    query += ` and name contains '${searchTerm.replace(/'/g, "\\'")}'`;
  }
  return listDriveFiles(query, 40);
};

export const createDriveFolder = async (folderName: string, parentFolderId?: string): Promise<DriveFileItem> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Drive');
  }

  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId && parentFolderId !== 'root') {
    metadata.parents = [parentFolderId];
  }

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

/**
 * Upload a file directly to Google Drive (using multipart upload)
 */
export const uploadFileToDrive = async (
  file: File,
  parentFolderId?: string
): Promise<DriveFileItem> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Drive');
  }

  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: file.name,
    mimeType: file.type || 'image/jpeg',
  };

  if (parentFolderId && parentFolderId !== 'root') {
    metadata.parents = [parentFolderId];
  }

  const boundary = `-------314159265358979323846_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataBlob = new Blob([JSON.stringify(metadata)], {
    type: 'application/json; charset=UTF-8',
  });

  const requestBody = new Blob(
    [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      metadataBlob,
      delimiter,
      `Content-Type: ${file.type || 'image/jpeg'}\r\n\r\n`,
      file,
      closeDelimiter,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: requestBody,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao enviar arquivo para o Google Drive (${res.status})`);
  }

  return await res.json();
};

