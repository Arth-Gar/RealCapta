import { ClientLead, PropertyListing, SyncedSpreadsheetInfo } from '../types';

const PROPERTIES_KEY = 'realcapta_properties_v1';
const CLIENTS_KEY = 'realcapta_clients_v1';
const SYNCED_SHEET_KEY = 'realcapta_synced_sheet_v1';

export const INITIAL_PROPERTIES: PropertyListing[] = [
  {
    id: 'prop-1',
    adImageName: 'placa_anuncio_av_paulista_loja.jpg',
    adImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    adImageDriveId: 'drive-ad-101',
    ownerName: 'Carlos Eduardo Silveira',
    ownerType: 'PROPRIETARIO',
    ownerPhone: '(11) 98765-4321',
    ownerEmail: 'carlos.silveira@email.com',
    address: 'Av. Paulista, 1420 - Bela Vista, São Paulo/SP',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    propertyType: 'LOJA',
    status: 'CAPTACAO_AUTORIZADA',
    notes: 'Loja de rua comercial com 220m², pé direito duplo, excelente fluxo de pedestres. Aceita aluguel de R$ 18.000/mês ou venda R$ 3.2M. IPTU R$ 1.800.',
    estimatedPrice: 'Aluguel: R$ 18.000 / Venda: R$ 3.200.000',
    areaSize: '220',
    photosFolderUrl: 'https://drive.google.com/drive/folders/sample-paulista-photos',
    photosFolderDriveId: 'folder-paulista-01',
    photosCount: 14,
    referrerName: 'Marcos Vinicius (Zelador Ed. Horizon)',
    referrerContact: '(11) 97123-8899',
    createdAt: '2026-08-18T10:30:00.000Z',
    updatedAt: '2026-08-22T14:15:00.000Z',
  },
  {
    id: 'prop-2',
    adImageName: 'foto_placa_galpao_anhanguera.jpg',
    adImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    adImageDriveId: 'drive-ad-102',
    ownerName: 'Imobiliária Prime Industrial (Dr. Roberto)',
    ownerType: 'IMOBILIARIA_PARCEIRA',
    ownerPhone: '(11) 99345-6789',
    ownerEmail: 'parcerias@primeindustrial.com.br',
    address: 'Rodovia Anhanguera, Km 28 - Perus, São Paulo/SP',
    neighborhood: 'Perus',
    city: 'São Paulo',
    propertyType: 'GALPAO',
    status: 'FOTOS_REALIZADAS',
    notes: 'Galpão logístico de 1.800m², docas para 4 carretas, piso de alta tonelagem (6 ton/m²), pátio de manobras de 800m². Parceria 50/50 na comissão.',
    estimatedPrice: 'Locação: R$ 42.000/mês',
    areaSize: '1800',
    photosFolderUrl: 'https://drive.google.com/drive/folders/sample-galpao-anhanguera',
    photosFolderDriveId: 'folder-galpao-02',
    photosCount: 22,
    referrerName: 'Juliana Mendes (Consultora de Expansão)',
    referrerContact: '(11) 98877-6655',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-08-24T11:00:00.000Z',
  },
  {
    id: 'prop-3',
    adImageName: 'placa_telefone_predio_berrini.jpg',
    adImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    adImageDriveId: 'drive-ad-103',
    ownerName: 'Eng. Marcelo Albuquerque (Fundo Lumina)',
    ownerType: 'PROPRIETARIO',
    ownerPhone: '(11) 97654-3210',
    ownerEmail: 'marcelo@luminaassets.com.br',
    address: 'Rua Funchal, 418, Conjunto 81/82 - Vila Olímpia, São Paulo/SP',
    neighborhood: 'Vila Olímpia',
    city: 'São Paulo',
    propertyType: 'SALA_COMERCIAL',
    status: 'NOVO_ANUNCIO',
    notes: 'Conjunto corporativo de 360m², mobiliado, piso elevado, gerador de emergência e 10 vagas. Foto da placa tirada no portão hoje.',
    estimatedPrice: 'Locação: R$ 38.000/mês + Condomínio R$ 6.500',
    areaSize: '360',
    photosFolderUrl: '',
    referrerName: 'Bruno Henrique (Corretor Parceiro)',
    referrerContact: '(11) 96543-2198',
    createdAt: '2026-08-24T08:20:00.000Z',
    updatedAt: '2026-08-24T08:20:00.000Z',
  },
  {
    id: 'prop-4',
    adImageName: 'placa_esquina_moema_terreno.jpg',
    adImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    adImageDriveId: 'drive-ad-104',
    ownerName: 'Dra. Beatriz Fontes',
    ownerType: 'PROPRIETARIO',
    ownerPhone: '(11) 99122-3344',
    ownerEmail: 'beatriz.fontes@advocacia.com',
    address: 'Av. Ibirapuera, 2800 (Esquina com Av. Moema) - Moema, São Paulo/SP',
    neighborhood: 'Moema',
    city: 'São Paulo',
    propertyType: 'TERRENO_COMERCIAL',
    status: 'NEGOCIACAO_PARCERIA',
    notes: 'Terreno comercial de esquina com 650m², ideal para Built to Suit (farmácias, fast food ou clínicas). Proprietária aguardando proposta de locação de longo prazo.',
    estimatedPrice: 'Locação BTS: R$ 28.000/mês',
    areaSize: '650',
    photosFolderUrl: 'https://drive.google.com/drive/folders/sample-moema-terreno',
    photosCount: 8,
    referrerName: 'Placa no local (Passagem de carro)',
    referrerContact: 'Captação direta',
    createdAt: '2026-08-20T16:40:00.000Z',
    updatedAt: '2026-08-23T10:00:00.000Z',
  },
];

export const INITIAL_CLIENTS: ClientLead[] = [
  {
    id: 'client-1',
    name: 'Renato Sampaio (Diretor de Expansão)',
    phone: '(11) 98111-2233',
    email: 'renato@redefarmaexpress.com.br',
    companyName: 'Rede Farma Express',
    interestType: 'LOCACAO',
    budget: 'Até R$ 35.000/mês',
    desiredArea: '200 a 400 m²',
    preferredLocations: 'Av. Paulista, Moema, Pinheiros',
    interestedPropertyIds: ['prop-1', 'prop-4'],
    attendanceStatus: 'PROPOSTA_EM_ANALISE',
    nextFollowUpDate: '2026-08-26',
    notes: 'Apresentada a loja da Paulista e o terreno de Moema. Cliente gostou muito do ponto da Paulista, preparando proposta formal com carência de 90 dias para obras.',
    createdAt: '2026-08-19T14:00:00.000Z',
    updatedAt: '2026-08-24T15:30:00.000Z',
  },
  {
    id: 'client-2',
    name: 'Patrícia Guimarães',
    phone: '(11) 99888-7766',
    email: 'patricia@logitechbrasil.com.br',
    companyName: 'LogiTech E-commerce & Armazenagem',
    interestType: 'LOCACAO',
    budget: 'Até R$ 50.000/mês',
    desiredArea: '1.500 a 2.500 m²',
    preferredLocations: 'Rodovias Anhanguera, Bandeirantes ou Castelo Branco',
    interestedPropertyIds: ['prop-2'],
    attendanceStatus: 'AGENDAMENTO_VISITA',
    nextFollowUpDate: '2026-08-27',
    notes: 'Agendada visita técnica ao galpão da Anhanguera para quinta-feira às 10h com o engenheiro da empresa para vistoria do piso e docas.',
    createdAt: '2026-08-21T11:20:00.000Z',
    updatedAt: '2026-08-24T16:00:00.000Z',
  },
  {
    id: 'client-3',
    name: 'Dr. Lucas Vasconcelos',
    phone: '(11) 97234-5678',
    email: 'lucas@vasconcelospartners.com',
    companyName: 'Vasconcelos & Partners FinTech',
    interestType: 'LOCACAO',
    budget: 'Até R$ 40.000/mês',
    desiredArea: '300 a 500 m²',
    preferredLocations: 'Vila Olímpia, Faria Lima, Itaim Bibi',
    interestedPropertyIds: ['prop-3'],
    attendanceStatus: 'AGUARDANDO_RETORNO',
    nextFollowUpDate: '2026-08-25',
    notes: 'Enviadas fotos e planta do conjunto corporativo na Rua Funchal. Aguardando retorno da diretoria para marcar visita presencial.',
    createdAt: '2026-08-23T10:15:00.000Z',
    updatedAt: '2026-08-24T09:00:00.000Z',
  },
];

export const loadStoredProperties = (): PropertyListing[] => {
  try {
    const raw = localStorage.getItem(PROPERTIES_KEY);
    if (!raw) {
      localStorage.setItem(PROPERTIES_KEY, JSON.stringify(INITIAL_PROPERTIES));
      return INITIAL_PROPERTIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler propriedades locais:', e);
    return INITIAL_PROPERTIES;
  }
};

export const saveStoredProperties = (properties: PropertyListing[]) => {
  try {
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
  } catch (e) {
    console.error('Erro ao salvar propriedades locais:', e);
  }
};

export const loadStoredClients = (): ClientLead[] => {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler clientes locais:', e);
    return INITIAL_CLIENTS;
  }
};

export const saveStoredClients = (clients: ClientLead[]) => {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Erro ao salvar clientes locais:', e);
  }
};

export const loadSyncedSpreadsheetInfo = (): SyncedSpreadsheetInfo | null => {
  try {
    const raw = localStorage.getItem(SYNCED_SHEET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSyncedSpreadsheetInfo = (info: SyncedSpreadsheetInfo | null) => {
  try {
    if (info) {
      localStorage.setItem(SYNCED_SHEET_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(SYNCED_SHEET_KEY);
    }
  } catch (e) {
    console.error('Erro ao salvar info de planilha:', e);
  }
};
