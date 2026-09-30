import { ClientLead, PropertyListing, SyncedSpreadsheetInfo } from '../types';
import { getAccessToken } from './auth';

export const PROPERTY_HEADERS = [
  'ID',
  'Foto/Anúncio (Nome/Link)',
  'Telefone Proprietário/Imob',
  'Nome Proprietário/Imobiliária',
  'Tipo Contato',
  'Endereço do Imóvel',
  'Tipo do Imóvel',
  'Status da Captação',
  'Observações Comerciais',
  'Valor Estimado',
  'Área (m²)',
  'Pasta Fotos Imóvel (Drive)',
  'Nome do Indicador',
  'Contato do Indicador',
  'Data Cadastro',
  'Última Atualização',
];

export const CLIENT_HEADERS = [
  'ID',
  'Nome do Cliente',
  'Telefone / WhatsApp',
  'E-mail',
  'Empresa / Razão Social',
  'Interesse (Compra/Locação)',
  'Imóveis de Interesse (Endereços)',
  'Status do Atendimento',
  'Orçamento / Valor Pretendido',
  'Área Desejada (m²)',
  'Localizações Preferidas',
  'Próximo Retorno / Visita',
  'Observações do Atendimento',
  'Data Cadastro',
  'Última Atualização',
];

export const STATUS_LABELS: Record<string, string> = {
  NOVO_ANUNCIO: 'Novo Anúncio (Placa)',
  CONTATO_REALIZADO: 'Contato Realizado',
  EM_TRIAGEM: 'Em Triagem',
  NEGOCIACAO_PARCERIA: 'Negociação de Parceria',
  CAPTACAO_AUTORIZADA: 'Captação Autorizada',
  FOTOS_REALIZADAS: 'Fotos Realizadas',
  EM_DIVULGACAO: 'Em Divulgação Ativa',
  CONCLUIDO: 'Negócio Fechado',
  ARQUIVADO: 'Arquivado / Descartado',
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRIMEIRO_CONTATO: 'Primeiro Contato',
  AGENDAMENTO_VISITA: 'Agendamento de Visita',
  VISITA_REALIZADA: 'Visita Realizada',
  AGUARDANDO_RETORNO: 'Aguardando Retorno',
  PROPOSTA_ENVIADA: 'Proposta Enviada',
  PROPOSTA_EM_ANALISE: 'Proposta em Análise',
  EM_FECHAMENTO: 'Em Fechamento / Contrato',
  CONTRATO_ASSINADO: 'Contrato Assinado / Ganho',
  SEM_INTERESSE: 'Sem Interesse',
  ARQUIVADO: 'Arquivado',
};

export const createRealEstateSpreadsheet = async (
  title = `Controle de Captações & Clientes - ${new Date().toLocaleDateString('pt-BR')}`
): Promise<SyncedSpreadsheetInfo> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Sheets');
  }

  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Captações de Imóveis',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Clientes & Atendimentos',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao criar planilha no Google Sheets (${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    title: data.properties.title,
    lastSyncedAt: new Date().toISOString(),
  };
};

export const syncAllDataToGoogleSheets = async (
  spreadsheetId: string,
  properties: PropertyListing[],
  clients: ClientLead[]
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Sheets');
  }

  // 1. Build Properties Matrix
  const propertiesData: (string | number)[][] = [
    PROPERTY_HEADERS,
    ...properties.map((p) => [
      p.id,
      p.adImageUrl ? `${p.adImageName || 'Foto da Placa'} (${p.adImageUrl})` : p.adImageName || '-',
      p.ownerPhone || '-',
      p.ownerName || '-',
      p.ownerType === 'IMOBILIARIA_PARCEIRA' ? 'Imobiliária Parceira' : p.ownerType === 'CORRETOR_PARCEIRO' ? 'Corretor Parceiro' : 'Proprietário Direto',
      p.address || '-',
      p.propertyType || 'Comercial',
      STATUS_LABELS[p.status] || p.status,
      p.notes || '-',
      p.estimatedPrice || '-',
      p.areaSize || '-',
      p.photosFolderUrl || '-',
      p.referrerName || '-',
      p.referrerContact || '-',
      new Date(p.createdAt).toLocaleDateString('pt-BR'),
      new Date(p.updatedAt).toLocaleDateString('pt-BR'),
    ]),
  ];

  // Helper map for property lookup in client rows
  const propMap = new Map(properties.map((p) => [p.id, `${p.address} (${p.ownerName})`]));

  // 2. Build Clients Matrix
  const clientsData: (string | number)[][] = [
    CLIENT_HEADERS,
    ...clients.map((c) => [
      c.id,
      c.name,
      c.phone || '-',
      c.email || '-',
      c.companyName || '-',
      c.interestType === 'COMPRA' ? 'Comprar' : c.interestType === 'LOCACAO' ? 'Alugar' : 'Compra ou Locação',
      c.interestedPropertyIds.map((id) => propMap.get(id) || id).join('; ') || 'Nenhum imóvel vinculado',
      ATTENDANCE_STATUS_LABELS[c.attendanceStatus] || c.attendanceStatus,
      c.budget || '-',
      c.desiredArea || '-',
      c.preferredLocations || '-',
      c.nextFollowUpDate ? new Date(c.nextFollowUpDate).toLocaleDateString('pt-BR') : '-',
      c.notes || '-',
      new Date(c.createdAt).toLocaleDateString('pt-BR'),
      new Date(c.updatedAt).toLocaleDateString('pt-BR'),
    ]),
  ];

  // 3. Clear and Update Sheet 1: Captações de Imóveis
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Captações de Imóveis'!A1:Z500:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const updatePropRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Captações de Imóveis'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: propertiesData }),
    }
  );

  if (!updatePropRes.ok) {
    const err = await updatePropRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Erro ao gravar aba de Captações no Google Sheets');
  }

  // 4. Clear and Update Sheet 2: Clientes & Atendimentos
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Clientes & Atendimentos'!A1:Z500:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const updateClientRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Clientes & Atendimentos'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: clientsData }),
    }
  );

  if (!updateClientRes.ok) {
    const err = await updateClientRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Erro ao gravar aba de Clientes no Google Sheets');
  }
};

export const exportToCSV = (properties: PropertyListing[], clients: ClientLead[]) => {
  const escapeCsv = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const propMap = new Map(properties.map((p) => [p.id, `${p.address} (${p.ownerName})`]));

  // CSV for Properties
  const propRows = [
    PROPERTY_HEADERS.map(escapeCsv).join(','),
    ...properties.map((p) =>
      [
        p.id,
        p.adImageUrl || p.adImageName,
        p.ownerPhone,
        p.ownerName,
        p.ownerType,
        p.address,
        p.propertyType,
        STATUS_LABELS[p.status] || p.status,
        p.notes,
        p.estimatedPrice,
        p.areaSize,
        p.photosFolderUrl,
        p.referrerName,
        p.referrerContact,
        p.createdAt,
        p.updatedAt,
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ].join('\n');

  // Download File
  const blob = new Blob(['\uFEFF' + propRows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Captacoes_Imoveis_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
