import React from 'react';
import {
  Building2,
  FileSpreadsheet,
  Columns,
  Users,
  HardDrive,
  CheckCircle2,
  LogOut,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SyncedSpreadsheetInfo } from '../types';

interface HeaderProps {
  activeTab: 'PROPERTIES' | 'KANBAN' | 'CLIENTS' | 'SHEETS_SYNC';
  setActiveTab: (tab: 'PROPERTIES' | 'KANBAN' | 'CLIENTS' | 'SHEETS_SYNC') => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isAuthenticating: boolean;
  syncedSheet: SyncedSpreadsheetInfo | null;
  onOpenSyncModal: () => void;
  onOpenNewProperty: () => void;
  onOpenNewClient: () => void;
  propertiesCount: number;
  clientsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onSignIn,
  onSignOut,
  isAuthenticating,
  syncedSheet,
  onOpenSyncModal,
  onOpenNewProperty,
  onOpenNewClient,
  propertiesCount,
  clientsCount,
}) => {
  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between py-3.5 border-b border-slate-100 gap-4 flex-wrap">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-base tracking-tight text-slate-900">
                  RealCapta <span className="text-blue-600 font-normal">| Imóveis Comerciais</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  Google Drive & Sheets
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Triagem de fotos de placas, controle de contatos de proprietários/parcerias e CRM de clientes
              </p>
            </div>
          </div>

          {/* User Auth & Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* Synced Sheet Indicator */}
            {syncedSheet ? (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                title="Planilha sincronizada no Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[140px]">{syncedSheet.title}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sincronizar Google Sheets</span>
              </button>
            )}

            {/* Google Sign-in / User Pill */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuário'}
                    className="w-6 h-6 rounded-full border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Conectado ao Google
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-200/60 rounded transition-colors ml-1"
                  title="Desconectar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isAuthenticating ? 'Conectando...' : 'Conectar Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs & Primary CTAs */}
        <div className="flex items-center justify-between pt-2 pb-2 gap-2 flex-wrap">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('PROPERTIES')}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'PROPERTIES'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Captação de Imóveis (Planilha)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'PROPERTIES' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                {propertiesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('KANBAN')}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'KANBAN'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Funil / Pipeline Visual</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CLIENTS')}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'CLIENTS'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Clientes & Atendimentos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'CLIENTS' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                {clientsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SHEETS_SYNC')}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'SHEETS_SYNC'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets Sync</span>
            </button>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNewProperty}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Captação</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewClient}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Cliente</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
