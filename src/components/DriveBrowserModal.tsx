import React, { useState, useEffect } from 'react';
import {
  Folder,
  Image as ImageIcon,
  ExternalLink,
  Search,
  Plus,
  Check,
  X,
  Loader2,
  HardDrive,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { DriveFileItem } from '../types';
import {
  listDriveFiles,
  createDriveFolder,
  parseDriveUrlOrId,
} from '../services/driveService';

interface DriveBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'SELECT_PHOTO' | 'SELECT_FOLDER';
  title?: string;
  defaultFolderName?: string;
  onSelect: (item: { name: string; url: string; driveId?: string }) => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const DriveBrowserModal: React.FC<DriveBrowserModalProps> = ({
  isOpen,
  onClose,
  mode,
  title,
  defaultFolderName = '',
  onSelect,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'BROWSE' | 'LINK_INPUT' | 'CREATE_FOLDER'>('BROWSE');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual input
  const [manualLink, setManualLink] = useState('');
  const [manualName, setManualName] = useState('');

  // Create folder
  const [newFolderName, setNewFolderName] = useState(defaultFolderName);
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated && activeTab === 'BROWSE') {
      loadDriveItems();
    }
    if (defaultFolderName) {
      setNewFolderName(defaultFolderName);
    }
  }, [isOpen, isAuthenticated, activeTab, mode]);

  const loadDriveItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const mimeQuery =
        mode === 'SELECT_FOLDER'
          ? "mimeType = 'application/vnd.google-apps.folder'"
          : "mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder'";

      let fullQuery = `${mimeQuery} and trashed = false`;
      if (searchTerm.trim()) {
        fullQuery += ` and name contains '${searchTerm.replace(/'/g, "\\'")}'`;
      }

      const files = await listDriveFiles(fullQuery, 24);
      setItems(files);
    } catch (err: unknown) {
      console.error('Erro ao carregar arquivos do Drive:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar arquivos no Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    setError(null);
    try {
      const created = await createDriveFolder(newFolderName.trim());
      onSelect({
        name: created.name,
        url: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`,
        driveId: created.id,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pasta no Google Drive');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleManualConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLink.trim()) return;

    const parsed = parseDriveUrlOrId(manualLink.trim());
    const name = manualName.trim() || (mode === 'SELECT_FOLDER' ? 'Pasta no Google Drive' : 'Foto no Google Drive');
    
    onSelect({
      name,
      url: manualLink.trim(),
      driveId: parsed.id !== manualLink ? parsed.id : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="drive-browser-modal"
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {title || (mode === 'SELECT_FOLDER' ? 'Selecionar Pasta no Google Drive' : 'Selecionar Imagem do Anúncio')}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'SELECT_FOLDER'
                  ? 'Vincule a pasta de fotos do imóvel ou crie uma nova pasta no Drive'
                  : 'Selecione a foto da placa/anúncio no seu Google Drive ou insira o link'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('BROWSE')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'BROWSE'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Explorar Google Drive
          </button>
          {mode === 'SELECT_FOLDER' && (
            <button
              type="button"
              onClick={() => setActiveTab('CREATE_FOLDER')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'CREATE_FOLDER'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              Criar Nova Pasta no Drive
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('LINK_INPUT')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'LINK_INPUT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            Inserir Link / URL Direta
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'BROWSE' && (
            <div>
              {!isAuthenticated ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <HardDrive className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">
                    Conexão com Google Drive Necessária
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Conecte sua conta Google para listar suas pastas e fotos de anúncios diretamente pelo Drive.
                  </p>
                  <button
                    type="button"
                    onClick={onRequireAuth}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-xs"
                  >
                    Conectar Conta Google
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadDriveItems()}
                        placeholder="Buscar pastas ou arquivos de imagem..."
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={loadDriveItems}
                      disabled={loading}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                      {error}
                    </div>
                  )}

                  {/* Items Grid */}
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-xs">Consultando arquivos no Google Drive...</span>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      <p className="text-xs">Nenhum item encontrado no Google Drive.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Experimente trocar a busca ou use a aba &quot;Inserir Link / URL Direta&quot;.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {items.map((item) => {
                        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              onSelect({
                                name: item.name,
                                url:
                                  item.webViewLink ||
                                  (isFolder
                                    ? `https://drive.google.com/drive/folders/${item.id}`
                                    : `https://drive.google.com/file/d/${item.id}/view`),
                                driveId: item.id,
                              });
                              onClose();
                            }}
                            className="group p-3 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {isFolder ? (
                                <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                              )}
                              <span className="text-xs font-medium text-slate-800 line-clamp-1 group-hover:text-blue-700">
                                {item.name}
                              </span>
                            </div>

                            {item.thumbnailLink && !isFolder && (
                              <div className="w-full h-20 bg-slate-100 rounded overflow-hidden mb-2">
                                <img
                                  src={item.thumbnailLink}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                              <span>{isFolder ? 'Pasta' : 'Arquivo'}</span>
                              <span className="text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                Selecionar
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'CREATE_FOLDER' && (
            <form onSubmit={handleCreateFolder} className="space-y-4 max-w-md mx-auto py-4">
              <div className="text-center mb-4">
                <FolderPlus className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">
                  Criar Pasta de Fotos no Google Drive
                </h4>
                <p className="text-xs text-slate-500">
                  Uma nova pasta será criada no seu Drive para armazenar as fotos deste imóvel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Pasta no Drive
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ex: Imóvel - Av. Paulista 1420 (Fotos)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={creatingFolder}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                {creatingFolder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando pasta no Drive...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Criar Pasta & Vincular</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'LINK_INPUT' && (
            <form onSubmit={handleManualConfirm} className="space-y-4 max-w-md mx-auto py-4">
              <div className="text-center mb-4">
                <ExternalLink className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">
                  Vincular por Link / URL do Drive
                </h4>
                <p className="text-xs text-slate-500">
                  Cole o link de compartilhamento da pasta ou do arquivo de imagem do Google Drive.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link / URL do Google Drive (ou ID)
                </label>
                <input
                  type="text"
                  required
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome / Identificador do Arquivo (Opcional)
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Ex: foto_placa_fachada.jpg"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Vínculo</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
