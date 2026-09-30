import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Folder,
  User,
  MapPin,
  Building,
  UserCheck,
  HardDrive,
  FolderPlus,
  ExternalLink,
  Trash2,
  Upload,
  Sparkles,
  Smartphone,
  Calendar,
  Navigation,
  Loader2,
  CheckCircle2,
  Check,
  Plus,
} from 'lucide-react';
import { PropertyListing, PropertyStatus } from '../types';
import { DriveBrowserModal } from './DriveBrowserModal';
import { extractImageMetadata, ExtractedImageMeta } from '../services/imageMetaService';
import { uploadFileToDrive } from '../services/driveService';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: PropertyListing) => void;
  propertyToEdit?: PropertyListing | null;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  propertyToEdit,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [formData, setFormData] = useState<Partial<PropertyListing>>({
    adImageName: '',
    adImageUrl: '',
    ownerName: '',
    ownerType: 'PROPRIETARIO',
    ownerPhone: '',
    ownerEmail: '',
    address: '',
    neighborhood: '',
    city: 'São Paulo',
    propertyType: 'LOJA',
    status: 'NOVO_ANUNCIO',
    notes: '',
    estimatedPrice: '',
    areaSize: '',
    photosFolderUrl: '',
    referrerName: '',
    referrerContact: '',
  });

  const [driveModalMode, setDriveModalMode] = useState<'SELECT_PHOTO' | 'SELECT_FOLDER' | null>(
    null
  );

  // Device Upload & Metadata Extraction State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiplePhotosInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedMeta, setExtractedMeta] = useState<ExtractedImageMeta | null>(null);
  const [autoTransferMeta, setAutoTransferMeta] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Section 5 multiple upload state
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const [multipleUploadStatus, setMultipleUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    if (propertyToEdit) {
      setFormData({ ...propertyToEdit });
      setExtractedMeta(null);
    } else {
      setFormData({
        adImageName: '',
        adImageUrl: '',
        ownerName: '',
        ownerType: 'PROPRIETARIO',
        ownerPhone: '',
        ownerEmail: '',
        address: '',
        neighborhood: '',
        city: 'São Paulo',
        propertyType: 'LOJA',
        status: 'NOVO_ANUNCIO',
        notes: '',
        estimatedPrice: '',
        areaSize: '',
        photosFolderUrl: '',
        referrerName: '',
        referrerContact: '',
      });
      setExtractedMeta(null);
    }
  }, [propertyToEdit, isOpen]);

  if (!isOpen) return null;

  // Process file upload from device
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      // 1. Extract EXIF / Meta-tags (date, camera/phone, GPS, resolution)
      const meta = await extractImageMetadata(file);
      setExtractedMeta(meta);

      // 2. Transfer meta-tags to notes if checked
      if (autoTransferMeta && meta.formattedNotesBlock) {
        setFormData((prev) => {
          const currentNotes = prev.notes || '';
          if (currentNotes.includes(file.name)) {
            return prev;
          }
          const updatedNotes = currentNotes.trim()
            ? `${currentNotes.trim()}\n\n${meta.formattedNotesBlock}`
            : meta.formattedNotesBlock;
          return {
            ...prev,
            notes: updatedNotes,
          };
        });
      }

      // 3. Local object URL preview immediately
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        adImageName: file.name,
        adImageUrl: localUrl,
      }));

      // 4. Upload to Google Drive if authenticated
      if (isAuthenticated) {
        const driveItem = await uploadFileToDrive(file, formData.photosFolderDriveId);
        setFormData((prev) => ({
          ...prev,
          adImageName: driveItem.name,
          adImageUrl:
            driveItem.webViewLink || `https://drive.google.com/file/d/${driveItem.id}/view`,
          adImageDriveId: driveItem.id,
        }));
      }
    } catch (err: unknown) {
      console.error('Erro ao processar imagem:', err);
      setUploadError(err instanceof Error ? err.message : 'Erro ao processar a foto do aparelho');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Manually re-apply metadata to notes
  const handleAppendMetaToNotes = () => {
    if (!extractedMeta) return;
    setFormData((prev) => {
      const currentNotes = prev.notes || '';
      const updatedNotes = currentNotes.trim()
        ? `${currentNotes.trim()}\n\n${extractedMeta.formattedNotesBlock}`
        : extractedMeta.formattedNotesBlock;
      return {
        ...prev,
        notes: updatedNotes,
      };
    });
  };

  // Use GPS location in address if user desires
  const handleUseGpsInAddress = () => {
    if (extractedMeta?.googleMapsUrl) {
      setFormData((prev) => ({
        ...prev,
        address: prev.address && prev.address !== 'Sem endereço informado'
          ? `${prev.address} (GPS: ${extractedMeta.latitude?.toFixed(5)}, ${extractedMeta.longitude?.toFixed(5)})`
          : `Localização GPS: ${extractedMeta.latitude?.toFixed(6)}, ${extractedMeta.longitude?.toFixed(6)}`,
      }));
    }
  };

  // Multiple photos upload for Section 5
  const handleMultiplePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const files = Array.from(e.target.files) as File[];
    setIsUploadingMultiple(true);
    setMultipleUploadStatus(`Enviando 0 de ${files.length} fotos para o Drive...`);

    try {
      let count = 0;
      for (const file of files) {
        await uploadFileToDrive(file, formData.photosFolderDriveId);
        count++;
        setMultipleUploadStatus(`Enviando ${count} de ${files.length} fotos para o Drive...`);
      }
      setMultipleUploadStatus(`${count} fotos enviadas com sucesso para o Drive!`);
      setTimeout(() => setMultipleUploadStatus(null), 4000);
    } catch (err: unknown) {
      setMultipleUploadStatus(
        err instanceof Error ? err.message : 'Erro ao enviar fotos para o Google Drive'
      );
    } finally {
      setIsUploadingMultiple(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // No fields are mandatory as requested by user
    const now = new Date().toISOString();
    const finalProperty: PropertyListing = {
      id: propertyToEdit?.id || `prop-${Date.now()}`,
      adImageName: formData.adImageName?.trim() || 'Foto da Placa',
      adImageUrl: formData.adImageUrl?.trim() || '',
      adImageDriveId: formData.adImageDriveId,
      ownerName: formData.ownerName?.trim() || 'Sem nome informado',
      ownerType: formData.ownerType || 'PROPRIETARIO',
      ownerPhone: formData.ownerPhone?.trim() || '',
      ownerEmail: formData.ownerEmail?.trim() || '',
      address: formData.address?.trim() || 'Sem endereço informado',
      neighborhood: formData.neighborhood?.trim() || '',
      city: formData.city?.trim() || '',
      propertyType: formData.propertyType || 'LOJA',
      status: (formData.status as PropertyStatus) || 'NOVO_ANUNCIO',
      notes: formData.notes?.trim() || '',
      estimatedPrice: formData.estimatedPrice?.trim() || '',
      areaSize: formData.areaSize?.trim() || '',
      photosFolderUrl: formData.photosFolderUrl?.trim() || '',
      photosFolderDriveId: formData.photosFolderDriveId,
      referrerName: formData.referrerName?.trim() || '',
      referrerContact: formData.referrerContact?.trim() || '',
      createdAt: propertyToEdit?.createdAt || now,
      updatedAt: now,
    };

    onSave(finalProperty);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <div
          id="property-form-modal"
          className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  {propertyToEdit ? 'Editar Captação de Imóvel' : 'Nova Captação de Imóvel Comercial'}
                </h3>
                <p className="text-xs text-slate-500">
                  Upload direto do aparelho com leitura automática de metadados EXIF/GPS
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* Section 1: Foto do Anúncio / Placa com Upload do Aparelho */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isDragging
                  ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-300'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Fotografia do Anúncio de Telefone / Placa no Local
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {/* Hidden file input supporting camera or file picker */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Device upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processando Foto...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>📸 Upload do Aparelho / Câmera</span>
                      </>
                    )}
                  </button>

                  {/* Drive browser button */}
                  <button
                    type="button"
                    onClick={() => setDriveModalMode('SELECT_PHOTO')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-blue-500 text-blue-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    Buscar no Drive
                  </button>
                </div>
              </div>

              {/* Upload & Dropzone Helper */}
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                <span>
                  💡 Tire uma foto com seu celular ou envie da galeria/computador. Extraímos data, modelo do aparelho e GPS automaticamente!
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-blue-700 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={autoTransferMeta}
                    onChange={(e) => setAutoTransferMeta(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Transferir metadados para observações</span>
                </label>
              </div>

              {uploadError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {uploadError}
                </div>
              )}

              {/* Extracted Metadata Card */}
              {extractedMeta && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Metadados Detectados na Foto
                    </span>
                    <button
                      type="button"
                      onClick={handleAppendMetaToNotes}
                      className="text-[11px] font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Inserir nas Observações
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700 pt-1">
                    {extractedMeta.dateTime && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate" title={extractedMeta.dateTime}>
                          {extractedMeta.dateTime}
                        </span>
                      </div>
                    )}
                    {extractedMeta.device && (
                      <div className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate" title={extractedMeta.device}>
                          {extractedMeta.device}
                        </span>
                      </div>
                    )}
                    {extractedMeta.googleMapsUrl ? (
                      <div className="flex items-center gap-1 sm:col-span-2">
                        <Navigation className="w-3 h-3 text-emerald-600 shrink-0" />
                        <a
                          href={extractedMeta.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline font-semibold flex items-center gap-0.5 truncate"
                          title="Abrir coordenadas no Google Maps"
                        >
                          GPS: {extractedMeta.latitude?.toFixed(4)}, {extractedMeta.longitude?.toFixed(4)} ↗
                        </a>
                        <button
                          type="button"
                          onClick={handleUseGpsInAddress}
                          className="ml-1 text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded transition-colors"
                          title="Usar coordenadas no campo de endereço"
                        >
                          Copiar para Endereço
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Sem GPS no arquivo</div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nome do Arquivo da Imagem
                  </label>
                  <input
                    type="text"
                    value={formData.adImageName || ''}
                    onChange={(e) => setFormData({ ...formData, adImageName: e.target.value })}
                    placeholder="Ex: placa_loja_paulista.jpg"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Link da Imagem (Google Drive / Web)
                  </label>
                  <input
                    type="text"
                    value={formData.adImageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, adImageUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {formData.adImageUrl && (
                <div className="flex items-center justify-between gap-3 pt-1 p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                      <img
                        src={formData.adImageUrl}
                        alt="Prévia da Placa"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-medium text-slate-800 block truncate max-w-xs">
                        {formData.adImageName || 'Foto vinculada'}
                      </span>
                      <a
                        href={formData.adImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        Abrir foto original <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        adImageUrl: '',
                        adImageName: '',
                        adImageDriveId: undefined,
                      })
                    }
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remover foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Contatos do Proprietário / Imobiliária */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Contato do Proprietário ou Imobiliária Parceira
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo de Contato
                  </label>
                  <select
                    value={formData.ownerType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownerType: e.target.value as PropertyListing['ownerType'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="PROPRIETARIO">Proprietário Direto</option>
                    <option value="IMOBILIARIA_PARCEIRA">Imobiliária Parceira</option>
                    <option value="CORRETOR_PARCEIRO">Corretor(a) Parceiro(a)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nome do Proprietário / Imobiliária
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="Ex: Carlos Eduardo ou Imobiliária Prime"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Telefone de Contato (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={formData.ownerPhone || ''}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Endereço & Características */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Endereço e Dados do Imóvel Comercial
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Endereço Completo (Rua, Número, Bairro, Cidade)
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Av. Paulista, 1420 - Bela Vista, São Paulo/SP"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo do Imóvel Comercial
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        propertyType: e.target.value as PropertyListing['propertyType'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="LOJA">Loja Comercial de Rua</option>
                    <option value="SALA_COMERCIAL">Conjunto / Sala Comercial</option>
                    <option value="GALPAO">Galpão Logístico / Industrial</option>
                    <option value="PREDIO_INTEIRO">Prédio Inteiro / Monousuário</option>
                    <option value="TERRENO_COMERCIAL">Terreno Comercial / BTS</option>
                    <option value="OUTRO">Outro Imóvel Comercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Área Estimada (m²)
                  </label>
                  <input
                    type="text"
                    value={formData.areaSize || ''}
                    onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                    placeholder="Ex: 220"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Valores Pretendidos (Locação / Venda)
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedPrice || ''}
                    onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                    placeholder="Ex: Aluguel: R$ 18.000/mês ou Venda: R$ 3.2M"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Status da Captação & Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Status da Captação (Triagem)
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as PropertyStatus,
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-semibold border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50/50 text-blue-900"
                >
                  <option value="NOVO_ANUNCIO">1. Novo Anúncio (Placa / Telefone)</option>
                  <option value="CONTATO_REALIZADO">2. Contato Realizado</option>
                  <option value="EM_TRIAGEM">3. Em Triagem de Dados</option>
                  <option value="NEGOCIACAO_PARCERIA">4. Negociação de Parceria</option>
                  <option value="CAPTACAO_AUTORIZADA">5. Captação Autorizada</option>
                  <option value="FOTOS_REALIZADAS">6. Fotos Realizadas</option>
                  <option value="EM_DIVULGACAO">7. Em Divulgação Ativa</option>
                  <option value="CONCLUIDO">8. Negócio Concluído</option>
                  <option value="ARQUIVADO">9. Arquivado / Sem Acordo</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Observações Comerciais & Metadados
                  </label>
                  {extractedMeta && (
                    <span className="text-[10px] text-blue-600 font-medium">
                      ✓ Metadados da foto integrados
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalhes comerciais, pé direito, carência, IPTU, comissão acordada ou metadados da foto..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                />
              </div>
            </div>

            {/* Section 5: Link da Pasta das Fotos no Google Drive & Upload em Lote */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    5. Pasta das Imagens do Imóvel (Google Drive)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {/* Hidden multiple file upload input */}
                  <input
                    type="file"
                    ref={multiplePhotosInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleMultiplePhotosUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => multiplePhotosInputRef.current?.click()}
                    disabled={isUploadingMultiple}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-amber-300 hover:border-amber-500 text-amber-900 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                  >
                    {isUploadingMultiple ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                        <span>Enviando fotos...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
                        <span>Subir Várias Fotos do Aparelho</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDriveModalMode('SELECT_FOLDER')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Navegar / Escolher Pasta no Drive
                  </button>
                </div>
              </div>

              {multipleUploadStatus && (
                <div className="p-2 bg-amber-100/70 border border-amber-300 rounded text-xs text-amber-900 font-medium">
                  {multipleUploadStatus}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Link / URL da Pasta de Fotos no Google Drive (caso já tenha tirado as fotos)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.photosFolderUrl || ''}
                    onChange={(e) => setFormData({ ...formData, photosFolderUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                  {formData.photosFolderUrl && (
                    <div className="flex items-center gap-1">
                      <a
                        href={formData.photosFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        Abrir <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            photosFolderUrl: '',
                            photosFolderDriveId: undefined,
                          })
                        }
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover pasta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Indicação do Imóvel */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  6. Indicação do Imóvel
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nome da Pessoa que Indicou
                  </label>
                  <input
                    type="text"
                    value={formData.referrerName || ''}
                    onChange={(e) => setFormData({ ...formData, referrerName: e.target.value })}
                    placeholder="Ex: Marcos Vinicius (Zelador)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Contato do Indicador (Telefone / WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={formData.referrerContact || ''}
                    onChange={(e) => setFormData({ ...formData, referrerContact: e.target.value })}
                    placeholder="Ex: (11) 97123-8899"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {propertyToEdit ? 'Salvar Alterações' : 'Cadastrar Captação'}
            </button>
          </div>
        </div>
      </div>

      {/* Drive Browser Sub-Modal */}
      {driveModalMode && (
        <DriveBrowserModal
          isOpen={true}
          onClose={() => setDriveModalMode(null)}
          mode={driveModalMode}
          title={
            driveModalMode === 'SELECT_PHOTO'
              ? 'Navegar no Drive & Selecionar Foto da Placa'
              : 'Navegar no Drive & Vincular Pasta de Fotos'
          }
          defaultFolderName={
            formData.address && formData.address !== 'Sem endereço informado'
              ? `Imóvel - ${formData.address.split(',')[0]} (Fotos)`
              : 'Fotos do Imóvel Comercial'
          }
          isAuthenticated={isAuthenticated}
          onRequireAuth={onRequireAuth}
          onSelect={(item) => {
            if (driveModalMode === 'SELECT_PHOTO') {
              setFormData((prev) => ({
                ...prev,
                adImageName: item.name,
                adImageUrl: item.url,
                adImageDriveId: item.driveId,
              }));
            } else {
              setFormData((prev) => ({
                ...prev,
                photosFolderUrl: item.url,
                photosFolderDriveId: item.driveId,
              }));
            }
          }}
        />
      )}
    </>
  );
};
