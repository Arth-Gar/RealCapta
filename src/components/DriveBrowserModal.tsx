import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  ArrowLeft,
  Eye,
  CheckCircle2,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { DriveFileItem } from '../types';
import {
  listFolderContents,
  createDriveFolder,
  parseDriveUrlOrId,
  uploadFileToDrive,
} from '../services/driveService';

interface DriveBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'SELECT_PHOTO' | 'SELECT_FOLDER';
  title?: string;
  defaultFolderName?: string;
  onSelect: (item: {
    name: string;
    url: string;
    driveId?: string;
    isFolder?: boolean;
    thumbnailLink?: string;
  }) => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
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
  
  // Folder Navigation Stack
  const [folderStack, setFolderStack] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'Meu Drive' },
  ]);
  const currentFolder = folderStack[folderStack.length - 1];

  // Filtering & Search
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGES' | 'FOLDERS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAllDrive, setSearchAllDrive] = useState(false);

  // Data & State
  const [items, setItems] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual input tab
  const [manualLink, setManualLink] = useState('');
  const [manualName, setManualName] = useState('');

  // Create folder tab
  const [newFolderName, setNewFolderName] = useState(defaultFolderName);
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Upload directly to current folder
  const [isUploadingToFolder, setIsUploadingToFolder] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Image preview modal/lightbox within browser
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (isOpen && isAuthenticated && activeTab === 'BROWSE') {
      loadContents();
    }
  }, [isOpen, isAuthenticated, activeTab, currentFolder.id, filterType]);

  useEffect(() => {
    if (defaultFolderName) {
      setNewFolderName(defaultFolderName);
    }
  }, [defaultFolderName]);

  // Load items from Google Drive based on current folder & filter
  const loadContents = async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await listFolderContents({
        parentFolderId: currentFolder.id,
        searchTerm,
        searchAllDrive,
        filterType,
        pageSize: 60,
      });
      setItems(files);
    } catch (err: unknown) {
      console.error('Erro ao consultar arquivos no Google Drive:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar arquivos no Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadContents();
  };

  // Enter a folder to navigate down
  const enterFolder = (folder: DriveFileItem) => {
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearchTerm('');
  };

  // Jump to specific breadcrumb
  const navigateToBreadcrumb = (index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
    setSearchTerm('');
  };

  // Go back one folder level
  const goBackOneLevel = () => {
    if (folderStack.length > 1) {
      setFolderStack((prev) => prev.slice(0, prev.length - 1));
      setSearchTerm('');
    }
  };

  // Select current folder
  const handleSelectCurrentFolder = () => {
    onSelect({
      name: currentFolder.name,
      url:
        currentFolder.id === 'root'
          ? 'https://drive.google.com/drive/my-drive'
          : `https://drive.google.com/drive/folders/${currentFolder.id}`,
      driveId: currentFolder.id !== 'root' ? currentFolder.id : undefined,
      isFolder: true,
    });
    onClose();
  };

  // Select a specific folder card
  const handleSelectFolder = (folder: DriveFileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      name: folder.name,
      url: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      driveId: folder.id,
      isFolder: true,
    });
    onClose();
  };

  // Select a specific image file
  const handleSelectImageFile = (image: DriveFileItem) => {
    onSelect({
      name: image.name,
      url: image.webViewLink || `https://drive.google.com/file/d/${image.id}/view`,
      driveId: image.id,
      isFolder: false,
      thumbnailLink: image.thumbnailLink,
    });
    onClose();
  };

  // Create folder inside current folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    setError(null);
    try {
      const created = await createDriveFolder(
        newFolderName.trim(),
        currentFolder.id !== 'root' ? currentFolder.id : undefined
      );
      onSelect({
        name: created.name,
        url: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`,
        driveId: created.id,
        isFolder: true,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pasta no Google Drive');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Manual link confirmation
  const handleManualConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLink.trim()) return;

    const parsed = parseDriveUrlOrId(manualLink.trim());
    const isFolder = parsed.type === 'folder' || mode === 'SELECT_FOLDER';
    const fallbackName = isFolder ? 'Pasta no Google Drive' : 'Foto no Google Drive';
    const name = manualName.trim() || fallbackName;

    onSelect({
      name,
      url: manualLink.trim(),
      driveId: parsed.id !== manualLink ? parsed.id : undefined,
      isFolder,
    });
    onClose();
  };

  // Upload file from device directly into current folder
  const handleUploadToCurrentFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploadingToFolder(true);
    setError(null);
    try {
      const uploaded = await uploadFileToDrive(
        file,
        currentFolder.id !== 'root' ? currentFolder.id : undefined
      );
      await loadContents();

      if (mode === 'SELECT_PHOTO') {
        onSelect({
          name: uploaded.name,
          url: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
          driveId: uploaded.id,
          isFolder: false,
          thumbnailLink: uploaded.thumbnailLink,
        });
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo para o Google Drive');
    } finally {
      setIsUploadingToFolder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="drive-browser-modal"
        className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                {title || (mode === 'SELECT_PHOTO' ? 'Selecionar Foto da Placa / Anúncio' : 'Selecionar Pasta de Fotos do Imóvel')}
              </h3>
              <p className="text-xs text-slate-500">
                Navegue pelas pastas e clique para abrir ou selecione arquivos de imagem específicos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('BROWSE')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'BROWSE'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Navegar no Drive (Pastas & Fotos)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CREATE_FOLDER')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'CREATE_FOLDER'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            Criar Pasta no Drive
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LINK_INPUT')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'LINK_INPUT'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            Colar Link / URL
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/30">
          {activeTab === 'BROWSE' && (
            <div className="space-y-4">
              {!isAuthenticated ? (
                <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-300">
                  <HardDrive className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">
                    Conexão com Google Drive Necessária
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Conecte sua conta Google para navegar em suas pastas e selecionar fotos ou vincular diretórios.
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
                <>
                  {/* Breadcrumbs & Up Level Navigation */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="flex items-center gap-1 text-xs overflow-x-auto py-1">
                      {folderStack.length > 1 && (
                        <button
                          type="button"
                          onClick={goBackOneLevel}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded mr-1"
                          title="Voltar um nível de pasta"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      )}
                      {folderStack.map((folder, idx) => {
                        const isLast = idx === folderStack.length - 1;
                        return (
                          <React.Fragment key={folder.id}>
                            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <button
                              type="button"
                              onClick={() => navigateToBreadcrumb(idx)}
                              disabled={isLast}
                              className={`px-2 py-1 rounded text-xs font-medium truncate max-w-[150px] transition-colors ${
                                isLast
                                  ? 'bg-blue-50 text-blue-700 font-semibold cursor-default'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title={folder.name}
                            >
                              {folder.name}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Actions: Upload to current folder & Select current folder */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="file"
                        ref={uploadInputRef}
                        accept="image/*"
                        onChange={handleUploadToCurrentFolder}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => uploadInputRef.current?.click()}
                        disabled={isUploadingToFolder}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                        title="Fazer upload de foto do seu aparelho direto para esta pasta"
                      >
                        {isUploadingToFolder ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Aqui</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSelectCurrentFolder}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                        title="Selecionar esta pasta atual para o imóvel"
                      >
                        <Check className="w-3.5 h-3.5 text-amber-700" />
                        <span>Selecionar Pasta</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <form onSubmit={handleSearchSubmit} className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder={
                            searchAllDrive
                              ? 'Buscar em todo o Google Drive...'
                              : `Buscar dentro de "${currentFolder.name}"...`
                          }
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Buscar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            loadContents();
                          }}
                          disabled={loading}
                          className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs transition-colors"
                          title="Atualizar lista"
                        >
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Filter Type & Scope toggles */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setFilterType('ALL')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            filterType === 'ALL'
                              ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Todos (Pastas & Fotos)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterType('IMAGES')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            filterType === 'IMAGES'
                              ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Apenas Fotos / Imagens
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterType('FOLDERS')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            filterType === 'FOLDERS'
                              ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Apenas Pastas
                        </button>
                      </div>

                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={searchAllDrive}
                          onChange={(e) => setSearchAllDrive(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Buscar em todo o Google Drive</span>
                      </label>
                    </div>
                  </form>

                  {/* Error Notification */}
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                      {error}
                    </div>
                  )}

                  {/* Items Grid */}
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-xs font-medium">Carregando itens do Google Drive...</span>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white">
                      <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-700">Esta pasta está vazia ou nenhum item corresponde ao filtro.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Você pode criar uma nova pasta ou subir arquivos de imagem no Google Drive.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {items.map((item) => {
                        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';

                        if (isFolder) {
                          return (
                            <div
                              key={item.id}
                              onClick={() => enterFolder(item)}
                              className="group relative p-3 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 rounded-xl cursor-pointer transition-all flex flex-col justify-between shadow-2xs min-h-[110px]"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-2">
                                  <Folder className="w-6 h-6 text-amber-500 shrink-0 group-hover:scale-105 transition-transform" />
                                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                    Pasta
                                  </span>
                                </div>
                                <h4
                                  className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-amber-900 leading-snug"
                                  title={item.name}
                                >
                                  {item.name}
                                </h4>
                              </div>

                              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium group-hover:text-amber-800 flex items-center gap-1">
                                  Abrir pasta →
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleSelectFolder(item, e)}
                                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[10px] transition-colors"
                                  title="Selecionar esta pasta"
                                >
                                  Selecionar
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // Specific Image File Card
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectImageFile(item)}
                            className="group relative p-2.5 bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-xl cursor-pointer transition-all flex flex-col justify-between min-h-[160px]"
                          >
                            <div>
                              {/* Thumbnail preview */}
                              <div className="relative w-full h-24 bg-slate-100 rounded-lg overflow-hidden mb-2 border border-slate-100 flex items-center justify-center">
                                {item.thumbnailLink ? (
                                  <img
                                    src={item.thumbnailLink}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      // Fallback on preview error
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <ImageIcon className="w-8 h-8 text-blue-400" />
                                )}

                                <div className="absolute top-1 right-1 flex items-center gap-1">
                                  {item.webViewLink && (
                                    <a
                                      href={item.webViewLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 bg-black/60 hover:bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Visualizar em tamanho real"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold mb-0.5">
                                <ImageIcon className="w-3 h-3 shrink-0" />
                                <span>Arquivo de Imagem</span>
                              </div>
                              <h4
                                className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-700"
                                title={item.name}
                              >
                                {item.name}
                              </h4>
                            </div>

                            <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 text-[10px]">
                                {item.createdTime ? new Date(item.createdTime).toLocaleDateString() : 'Foto'}
                              </span>
                              <span className="text-blue-600 font-bold group-hover:underline">
                                Selecionar Foto ✓
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab 2: Create Folder */}
          {activeTab === 'CREATE_FOLDER' && (
            <form onSubmit={handleCreateFolder} className="space-y-4 max-w-md mx-auto py-6 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-center mb-4">
                <FolderPlus className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">
                  Criar Nova Pasta no Google Drive
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  A pasta será criada dentro de: <strong className="text-slate-700">{currentFolder.name}</strong>
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
                    <span>Criando pasta no Google Drive...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Criar Pasta & Vincular ao Imóvel</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 3: Paste Link */}
          {activeTab === 'LINK_INPUT' && (
            <form onSubmit={handleManualConfirm} className="space-y-4 max-w-md mx-auto py-6 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-center mb-4">
                <ExternalLink className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">
                  Vincular por Link ou URL do Google Drive
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Cole o link de compartilhamento de qualquer foto ou pasta do Google Drive.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link / URL do Arquivo ou Pasta
                </label>
                <input
                  type="text"
                  required
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... ou /drive/folders/..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Arquivo / Pasta (Opcional)
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Ex: foto_placa_fachada.jpg ou Pasta Fotos"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Vincular</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500 truncate max-w-sm">
            {activeTab === 'BROWSE' && (
              <span>
                Pasta atual: <strong className="text-slate-800">{currentFolder.name}</strong>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
