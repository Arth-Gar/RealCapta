export type PropertyStatus =
  | 'NOVO_ANUNCIO'
  | 'CONTATO_REALIZADO'
  | 'EM_TRIAGEM'
  | 'NEGOCIACAO_PARCERIA'
  | 'CAPTACAO_AUTORIZADA'
  | 'FOTOS_REALIZADAS'
  | 'EM_DIVULGACAO'
  | 'CONCLUIDO'
  | 'ARQUIVADO';

export interface PropertyListing {
  id: string;
  // 1. Imagem do anúncio/placa de telefone (Google Drive / Firebase)
  adImageName: string;
  adImageUrl: string;
  adImageDriveId?: string;
  adImageStoragePath?: string;
  adImageStorageProvider?: 'drive' | 'firebase' | 'both';

  // 2. Contato do proprietário ou imobiliária
  ownerName: string;
  ownerType: 'PROPRIETARIO' | 'IMOBILIARIA_PARCEIRA' | 'CORRETOR_PARCEIRO';
  ownerPhone: string;
  ownerEmail?: string;

  // 3. Endereço
  address: string;
  neighborhood?: string;
  city?: string;
  propertyType?: 'LOJA' | 'SALA_COMERCIAL' | 'GALPAO' | 'PREDIO_INTEIRO' | 'TERRENO_COMERCIAL' | 'OUTRO';

  // 4. Status da captação
  status: PropertyStatus;

  // 5. Observações (metragem, valor pretendido, condições, etc.)
  notes: string;
  estimatedPrice?: string;
  areaSize?: string; // m²

  // 6. Link da pasta das fotos do imóvel no Drive & Lista de Fotos
  photosFolderUrl: string;
  photosFolderDriveId?: string;
  photosCount?: number;
  photosList?: PropertyPhotoItem[];

  // 7. Indicação do imóvel
  referrerName: string;
  referrerContact: string;

  createdAt: string;
  updatedAt: string;
}

export type ClientInterestType = 'COMPRA' | 'LOCACAO' | 'AMBOS';

export type ClientAttendanceStatus =
  | 'PRIMEIRO_CONTATO'
  | 'AGENDAMENTO_VISITA'
  | 'VISITA_REALIZADA'
  | 'AGUARDANDO_RETORNO'
  | 'PROPOSTA_ENVIADA'
  | 'PROPOSTA_EM_ANALISE'
  | 'EM_FECHAMENTO'
  | 'CONTRATO_ASSINADO'
  | 'SEM_INTERESSE'
  | 'ARQUIVADO';

export interface ClientLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  interestType: ClientInterestType;
  budget?: string;
  desiredArea?: string; // m² pretendida
  preferredLocations?: string;
  
  // Imóveis vinculados de interesse
  interestedPropertyIds: string[];
  
  // Status de atendimento (múltiplas opções / pipeline)
  attendanceStatus: ClientAttendanceStatus;
  
  // Próximo passo / agendamento
  nextFollowUpDate?: string;
  
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyPhotoItem {
  id: string;
  name: string;
  url: string;
  driveId?: string;
  storagePath?: string;
  provider: 'drive' | 'firebase' | 'both' | 'local';
  sizeFormatted?: string;
  createdAt: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
}

export interface SyncedSpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  lastSyncedAt?: string;
}
