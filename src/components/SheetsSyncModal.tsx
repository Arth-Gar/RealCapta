import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ClientLead, PropertyListing, SyncedSpreadsheetInfo } from '../types';
import {
  createRealEstateSpreadsheet,
  syncAllDataToGoogleSheets,
  exportToCSV,
} from '../services/sheetsService';
import { saveSyncedSpreadsheetInfo } from '../services/storage';

interface SheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyListing[];
  clients: ClientLead[];
  syncedSheet: SyncedSpreadsheetInfo | null;
  onUpdateSyncedSheet: (info: SyncedSpreadsheetInfo | null) => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const SheetsSyncModal: React.FC<SheetsSyncModalProps> = ({
  isOpen,
  onClose,
  properties,
  clients,
  syncedSheet,
  onUpdateSyncedSheet,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [customTitle, setCustomTitle] = useState(
    syncedSheet?.title || `Planilha de Captações & Clientes - Corretora Comercial`
  );

  if (!isOpen) return null;

  const handleCreateNewSheet = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    setCreating(true);
    setStatusMessage(null);
    try {
      const created = await createRealEstateSpreadsheet(customTitle);
      // Immediately push data to the newly created sheet
      await syncAllDataToGoogleSheets(created.spreadsheetId, properties, clients);
      
      const updated: SyncedSpreadsheetInfo = {
        ...created,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateSyncedSheet(updated);
      saveSyncedSpreadsheetInfo(updated);

      setStatusMessage({
        type: 'success',
        text: `Planilha "${created.title}" criada e sincronizada com sucesso no seu Google Drive!`,
      });
    } catch (err: unknown) {
      console.error('Erro ao criar planilha:', err);
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao criar planilha no Google Sheets',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSyncExistingSheet = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!syncedSheet?.spreadsheetId) return;

    setSyncing(true);
    setStatusMessage(null);
    try {
      await syncAllDataToGoogleSheets(syncedSheet.spreadsheetId, properties, clients);
      const updated: SyncedSpreadsheetInfo = {
        ...syncedSheet,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateSyncedSheet(updated);
      saveSyncedSpreadsheetInfo(updated);

      setStatusMessage({
        type: 'success',
        text: `Dados sincronizados com sucesso! Atualizadas as abas "Captações de Imóveis" (${properties.length} registros) e "Clientes & Atendimentos" (${clients.length} registros).`,
      });
    } catch (err: unknown) {
      console.error('Erro ao sincronizar planilha:', err);
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao sincronizar com o Google Sheets',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCsv = () => {
    exportToCSV(properties, clients);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="sheets-sync-modal"
        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Integração com Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Sincronize suas captações e carteira de clientes com sua conta Google
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-emerald-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Auth status banner */}
          {!isAuthenticated ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-900">
                  Google Workspace Não Conectado
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Conecte sua conta do Google para permitir criar e atualizar a planilha no seu Google Sheets e Google Drive.
                </p>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Conectar Conta Google Agora
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Autenticado com permissões de Google Sheets & Drive</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Pronto para Sincronizar
              </span>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{statusMessage.text}</div>
            </div>
          )}

          {/* Active Synced Sheet Card */}
          {syncedSheet ? (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Planilha Conectada
                  </span>
                  <h4 className="text-sm font-semibold text-slate-800 mt-1">
                    {syncedSheet.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Última sincronização:{' '}
                    {syncedSheet.lastSyncedAt
                      ? new Date(syncedSheet.lastSyncedAt).toLocaleString('pt-BR')
                      : 'Nunca'}
                  </p>
                </div>
                <a
                  href={syncedSheet.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 text-emerald-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir no Google Sheets
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Aba 1: Captações</span>
                  <span className="font-bold text-slate-800">{properties.length} Imóveis Comerciais</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Aba 2: Clientes & CRM</span>
                  <span className="font-bold text-slate-800">{clients.length} Atendimentos</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSyncExistingSheet}
                  disabled={syncing || !isAuthenticated}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar Agora com o Google Sheets'}
                </button>
              </div>
            </div>
          ) : (
            /* Create new sheet box */
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-semibold text-slate-800">
                  Criar Nova Planilha no seu Google Sheets
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                O sistema criará automaticamente uma planilha estruturada com as duas abas solicitadas:
                <strong className="text-slate-800 block mt-1">
                  1. Captações de Imóveis (Fotos da placa, proprietário/parceria, endereço, status, link de fotos e indicador)
                </strong>
                <strong className="text-slate-800 block">
                  2. Clientes & Atendimentos (Interessados em comprar/alugar e status dos atendimentos)
                </strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título da Planilha
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={creating || !isAuthenticated}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gerando planilha no Google Drive...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Gerar Planilha Oficial no Google Sheets</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Offline CSV Download */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-semibold text-slate-700">Backup / Download Offline</h5>
                <p className="text-[11px] text-slate-500">Baixe os dados em formato CSV para Excel</p>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
