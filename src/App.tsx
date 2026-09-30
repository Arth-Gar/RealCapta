import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Building2,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Folder,
  Phone,
  HardDrive,
  Sparkles,
  TrendingUp,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  PropertyListing,
  ClientLead,
  PropertyStatus,
  ClientAttendanceStatus,
  SyncedSpreadsheetInfo,
} from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  loadStoredProperties,
  saveStoredProperties,
  loadStoredClients,
  saveStoredClients,
  loadSyncedSpreadsheetInfo,
  saveSyncedSpreadsheetInfo,
} from './services/storage';
import { Header } from './components/Header';
import { PropertiesTable } from './components/PropertiesTable';
import { PropertyModal } from './components/PropertyModal';
import { ClientsManager } from './components/ClientsManager';
import { ClientModal } from './components/ClientModal';
import { KanbanBoard } from './components/KanbanBoard';
import { WhatsAppModal } from './components/WhatsAppModal';
import { SheetsSyncModal } from './components/SheetsSyncModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'PROPERTIES' | 'KANBAN' | 'CLIENTS' | 'SHEETS_SYNC'>('PROPERTIES');

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data State
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [clients, setClients] = useState<ClientLead[]>([]);
  const [syncedSheet, setSyncedSheet] = useState<SyncedSpreadsheetInfo | null>(null);

  // Modals
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyListing | null>(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientLead | null>(null);
  const [preSelectedPropertyId, setPreSelectedPropertyId] = useState<string | undefined>(undefined);

  const [isSheetsSyncModalOpen, setIsSheetsSyncModalOpen] = useState(false);

  // WhatsApp Modal State
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    mode: 'PROPERTY_OWNER' | 'PROPERTY_REFERRER' | 'CLIENT_VISIT' | 'CLIENT_PROPOSAL' | 'GENERAL';
    targetProperty?: PropertyListing | null;
    targetClient?: ClientLead | null;
  }>({
    isOpen: false,
    mode: 'GENERAL',
  });

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Initialize data and auth
  useEffect(() => {
    setProperties(loadStoredProperties());
    setClients(loadStoredClients());
    setSyncedSheet(loadSyncedSpreadsheetInfo());

    // Init Auth listener
    const unsubscribe = initAuth(
      (authenticatedUser) => {
        setUser(authenticatedUser);
      },
      () => {
        setUser(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Auth Handlers
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showNotification(
          `Conectado com sucesso como ${result.user.displayName || result.user.email}! Acesso ao Google Drive e Sheets ativado.`
        );
      }
    } catch (err: unknown) {
      console.error('Erro no login:', err);
      const msg = err instanceof Error ? err.message : 'Falha na autenticação com Google';
      setAuthError(msg);
      showNotification(msg, 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    showNotification('Sessão do Google encerrada.', 'info');
  };

  // Properties CRUD
  const handleSaveProperty = (saved: PropertyListing) => {
    let updated: PropertyListing[];
    const exists = properties.some((p) => p.id === saved.id);
    if (exists) {
      updated = properties.map((p) => (p.id === saved.id ? saved : p));
      showNotification('Captação de imóvel atualizada com sucesso!');
    } else {
      updated = [saved, ...properties];
      showNotification('Nova captação de imóvel cadastrada na planilha!');
    }
    setProperties(updated);
    saveStoredProperties(updated);
    setEditingProperty(null);
  };

  const handleUpdatePropertyStatus = (propertyId: string, newStatus: PropertyStatus) => {
    const updated = properties.map((p) =>
      p.id === propertyId ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p
    );
    setProperties(updated);
    saveStoredProperties(updated);
    showNotification('Status da captação atualizado!');
  };

  const handleDeletePropertyPrompt = (property: PropertyListing) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Captação de Imóvel',
      message: `Tem certeza que deseja excluir o imóvel em "${property.address}"? Esta operação removerá o registro da triagem local e da planilha.`,
      confirmText: 'Sim, Excluir',
      onConfirm: () => {
        const updated = properties.filter((p) => p.id !== property.id);
        setProperties(updated);
        saveStoredProperties(updated);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        showNotification('Captação removida com sucesso.', 'info');
      },
    });
  };

  // Clients CRUD
  const handleSaveClient = (saved: ClientLead) => {
    let updated: ClientLead[];
    const exists = clients.some((c) => c.id === saved.id);
    if (exists) {
      updated = clients.map((c) => (c.id === saved.id ? saved : c));
      showNotification('Dados do cliente/atendimento atualizados!');
    } else {
      updated = [saved, ...clients];
      showNotification('Novo cliente interessado cadastrado com sucesso!');
    }
    setClients(updated);
    saveStoredClients(updated);
    setEditingClient(null);
    setPreSelectedPropertyId(undefined);
  };

  const handleUpdateClientStatus = (clientId: string, newStatus: ClientAttendanceStatus) => {
    const updated = clients.map((c) =>
      c.id === clientId ? { ...c, attendanceStatus: newStatus, updatedAt: new Date().toISOString() } : c
    );
    setClients(updated);
    saveStoredClients(updated);
    showNotification('Status do atendimento atualizado!');
  };

  const handleDeleteClientPrompt = (client: ClientLead) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Cliente / Atendimento',
      message: `Deseja realmente remover o cliente "${client.name}" do controle de atendimentos?`,
      confirmText: 'Sim, Excluir',
      onConfirm: () => {
        const updated = clients.filter((c) => c.id !== client.id);
        setClients(updated);
        saveStoredClients(updated);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        showNotification('Cliente removido.', 'info');
      },
    });
  };

  // Quick WhatsApp Trigger
  const handleOpenWhatsAppProperty = (
    property: PropertyListing,
    mode: 'PROPERTY_OWNER' | 'PROPERTY_REFERRER'
  ) => {
    setWhatsAppModalData({
      isOpen: true,
      mode,
      targetProperty: property,
      targetClient: null,
    });
  };

  const handleOpenWhatsAppClient = (
    client: ClientLead,
    mode: 'CLIENT_VISIT' | 'CLIENT_PROPOSAL' | 'GENERAL' = 'GENERAL'
  ) => {
    const relatedProperty =
      client.interestedPropertyIds.length > 0
        ? properties.find((p) => p.id === client.interestedPropertyIds[0])
        : null;

    setWhatsAppModalData({
      isOpen: true,
      mode,
      targetProperty: relatedProperty,
      targetClient: client,
    });
  };

  const handleLinkClientToProperty = (property: PropertyListing) => {
    setPreSelectedPropertyId(property.id);
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  // Metrics
  const authorizedCount = properties.filter(
    (p) => p.status === 'CAPTACAO_AUTORIZADA' || p.status === 'FOTOS_REALIZADAS' || p.status === 'EM_DIVULGACAO'
  ).length;
  const photosDriveCount = properties.filter((p) => Boolean(p.photosFolderUrl)).length;
  const pendingVisitsCount = clients.filter((c) => c.attendanceStatus === 'AGENDAMENTO_VISITA').length;
  const inProposalCount = clients.filter(
    (c) => c.attendanceStatus === 'PROPOSTA_ENVIADA' || c.attendanceStatus === 'PROPOSTA_EM_ANALISE' || c.attendanceStatus === 'EM_FECHAMENTO'
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isAuthenticating={isAuthenticating}
        syncedSheet={syncedSheet}
        onOpenSyncModal={() => setIsSheetsSyncModalOpen(true)}
        onOpenNewProperty={() => {
          setEditingProperty(null);
          setIsPropertyModalOpen(true);
        }}
        onOpenNewClient={() => {
          setEditingClient(null);
          setPreSelectedPropertyId(undefined);
          setIsClientModalOpen(true);
        }}
        propertiesCount={properties.length}
        clientsCount={clients.length}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-slate-900 text-emerald-300 border-emerald-500/40 shadow-emerald-950/20'
                : notification.type === 'error'
                ? 'bg-slate-900 text-red-300 border-red-500/40 shadow-red-950/20'
                : 'bg-slate-900 text-slate-100 border-slate-700 shadow-slate-950/20'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive KPI / Dashboard Summary Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Total de Captações</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{properties.length}</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
                {authorizedCount} autorizadas
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Fotos no Google Drive</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{photosDriveCount}</span>
              <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md">
                pastas vinculadas
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Visitas Agendadas</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{pendingVisitsCount}</span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-200/60 px-1.5 py-0.5 rounded-md">
                em andamento
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Propostas & Fechamento</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{inProposalCount}</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
                {clients.length} clientes ativos
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Views */}
        {activeTab === 'PROPERTIES' && (
          <PropertiesTable
            properties={properties}
            onEdit={(p) => {
              setEditingProperty(p);
              setIsPropertyModalOpen(true);
            }}
            onDelete={handleDeletePropertyPrompt}
            onUpdateStatus={handleUpdatePropertyStatus}
            onOpenWhatsApp={handleOpenWhatsAppProperty}
            onLinkClient={handleLinkClientToProperty}
            onOpenNewProperty={() => {
              setEditingProperty(null);
              setIsPropertyModalOpen(true);
            }}
          />
        )}

        {activeTab === 'KANBAN' && (
          <KanbanBoard
            properties={properties}
            clients={clients}
            onUpdatePropertyStatus={handleUpdatePropertyStatus}
            onUpdateClientStatus={handleUpdateClientStatus}
            onEditProperty={(p) => {
              setEditingProperty(p);
              setIsPropertyModalOpen(true);
            }}
            onEditClient={(c) => {
              setEditingClient(c);
              setIsClientModalOpen(true);
            }}
            onOpenWhatsAppProperty={handleOpenWhatsAppProperty}
            onOpenWhatsAppClient={(c) => handleOpenWhatsAppClient(c, 'GENERAL')}
            onOpenNewProperty={() => {
              setEditingProperty(null);
              setIsPropertyModalOpen(true);
            }}
            onOpenNewClient={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
          />
        )}

        {activeTab === 'CLIENTS' && (
          <ClientsManager
            clients={clients}
            properties={properties}
            onOpenNewClient={() => {
              setEditingClient(null);
              setPreSelectedPropertyId(undefined);
              setIsClientModalOpen(true);
            }}
            onEditClient={(c) => {
              setEditingClient(c);
              setIsClientModalOpen(true);
            }}
            onDeleteClient={handleDeleteClientPrompt}
            onUpdateStatus={handleUpdateClientStatus}
            onOpenWhatsApp={(c, mode) => handleOpenWhatsAppClient(c, mode)}
          />
        )}

        {activeTab === 'SHEETS_SYNC' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Painel de Sincronização Google Sheets
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mantenha sua planilha comercial no Google Drive sempre atualizada com suas captações e clientes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetsSyncModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Configurar / Sincronizar Planilha
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Aba 1: Captações de Imóveis
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  Exporta todas as colunas requisitadas: Foto/link do anúncio no Drive, telefone de contato, nome do proprietário/imobiliária parceira, endereço, status da captação, observações comerciais, pasta de fotos no Drive e contatos de quem indicou.
                </p>
                <div className="text-xs font-bold text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                  {properties.length} registros prontos para sincronização
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Aba 2: Clientes & Atendimentos
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  Exporta interessados em comprar ou alugar, imóveis vinculados, orçamento pretendido, múltiplos status de atendimento (agendamento de visita, aguardando retorno, proposta) e observações.
                </p>
                <div className="text-xs font-bold text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-200">
                  {clients.length} atendimentos prontos para sincronização
                </div>
              </div>
            </div>

            {syncedSheet && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Planilha no Google Drive
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{syncedSheet.title}</h4>
                  <p className="text-xs text-slate-500">
                    Última sincronização:{' '}
                    {syncedSheet.lastSyncedAt
                      ? new Date(syncedSheet.lastSyncedAt).toLocaleString('pt-BR')
                      : '-'}
                  </p>
                </div>
                <a
                  href={syncedSheet.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir no Google Sheets
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Property Add/Edit Modal */}
      <PropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => {
          setIsPropertyModalOpen(false);
          setEditingProperty(null);
        }}
        onSave={handleSaveProperty}
        propertyToEdit={editingProperty}
        isAuthenticated={Boolean(user)}
        onRequireAuth={handleSignIn}
      />

      {/* Client Add/Edit Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
          setPreSelectedPropertyId(undefined);
        }}
        onSave={handleSaveClient}
        clientToEdit={editingClient}
        properties={properties}
        preSelectedPropertyId={preSelectedPropertyId}
      />

      {/* Sheets Sync Hub Modal */}
      <SheetsSyncModal
        isOpen={isSheetsSyncModalOpen}
        onClose={() => setIsSheetsSyncModalOpen(false)}
        properties={properties}
        clients={clients}
        syncedSheet={syncedSheet}
        onUpdateSyncedSheet={(info) => {
          setSyncedSheet(info);
          saveSyncedSpreadsheetInfo(info);
        }}
        isAuthenticated={Boolean(user)}
        onRequireAuth={handleSignIn}
      />

      {/* WhatsApp Pre-Formatted Trigger Modal */}
      <WhatsAppModal
        isOpen={whatsAppModalData.isOpen}
        onClose={() => setWhatsAppModalData({ ...whatsAppModalData, isOpen: false })}
        mode={whatsAppModalData.mode}
        targetProperty={whatsAppModalData.targetProperty}
        targetClient={whatsAppModalData.targetClient}
      />

      {/* Explicit Confirmation Dialog (for deletions & destructive changes) */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
