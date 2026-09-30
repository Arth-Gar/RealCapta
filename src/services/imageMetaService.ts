import exifr from 'exifr';

export interface ExtractedImageMeta {
  fileName: string;
  fileSizeFormatted: string;
  dateTime?: string;
  device?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  dimensions?: string;
  formattedNotesBlock: string;
  raw?: Record<string, unknown>;
}

/**
 * Format bytes to readable size (e.g. 2.4 MB)
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Extract EXIF metadata, GPS, timestamp and device info from an image file
 */
export const extractImageMetadata = async (file: File): Promise<ExtractedImageMeta> => {
  const fileName = file.name;
  const fileSizeFormatted = formatFileSize(file.size);

  let raw: Record<string, unknown> | null = null;
  try {
    raw = (await exifr.parse(file, {
      gps: true,
      tiff: true,
      exif: true,
      iptc: true,
    })) as Record<string, unknown> | null;
  } catch (err) {
    console.warn('Não foi possível extrair metadados EXIF da imagem:', err);
  }

  let dateTime: string | undefined;
  if (raw?.DateTimeOriginal instanceof Date) {
    dateTime = raw.DateTimeOriginal.toLocaleString('pt-BR');
  } else if (raw?.CreateDate instanceof Date) {
    dateTime = raw.CreateDate.toLocaleString('pt-BR');
  } else if (file.lastModified) {
    dateTime = new Date(file.lastModified).toLocaleString('pt-BR');
  }

  // Device model (Make + Model)
  let device: string | undefined;
  const make = (raw?.Make as string) || '';
  const model = (raw?.Model as string) || '';
  if (make || model) {
    if (model.toLowerCase().includes(make.toLowerCase())) {
      device = model.trim();
    } else {
      device = `${make} ${model}`.trim();
    }
  }

  // GPS Coordinates
  let latitude: number | undefined;
  let longitude: number | undefined;
  let googleMapsUrl: string | undefined;

  if (typeof raw?.latitude === 'number' && typeof raw?.longitude === 'number') {
    latitude = raw.latitude;
    longitude = raw.longitude;
    googleMapsUrl = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  }

  // Dimensions
  let dimensions: string | undefined;
  const width = (raw?.ImageWidth as number) || (raw?.ExifImageWidth as number);
  const height = (raw?.ImageHeight as number) || (raw?.ExifImageHeight as number);
  if (width && height) {
    dimensions = `${width} x ${height} px`;
  }

  // Build clean text block for notes
  const notesLines: string[] = [`[Metadados da Fotografia: ${fileName}]`];
  if (dateTime) {
    notesLines.push(`• Data/Hora da Foto: ${dateTime}`);
  }
  if (device) {
    notesLines.push(`• Aparelho/Câmera: ${device}`);
  }
  if (latitude && longitude && googleMapsUrl) {
    notesLines.push(`• Coordenadas GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    notesLines.push(`• Localização no Mapa: ${googleMapsUrl}`);
  }
  if (dimensions) {
    notesLines.push(`• Resolução: ${dimensions} (${fileSizeFormatted})`);
  } else {
    notesLines.push(`• Tamanho do Arquivo: ${fileSizeFormatted}`);
  }

  const formattedNotesBlock = notesLines.join('\n');

  return {
    fileName,
    fileSizeFormatted,
    dateTime,
    device,
    latitude,
    longitude,
    googleMapsUrl,
    dimensions,
    formattedNotesBlock,
    raw: raw || undefined,
  };
};
