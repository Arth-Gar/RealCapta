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
  Flame,
  Images,
  Maximize2,
  Star,
} from 'lucide-react';
import { PropertyListing, PropertyStatus, PropertyPhotoItem } from '../types';
import { DriveBrowserModal } from './DriveBrowserModal';
import { extractImageMetadata, ExtractedImageMeta } from '../services/imageMetaService';
import {
  uploadPropertyImage,
  ImageUploadDestination,
  getDisplayImageUrl,
} from '../services/imageStorageService';

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
    adImageDriveId: undefined,
    adImageStoragePath: undefined,
    adImageStorageProvider: 'both',
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
    photosFolderDriveId: undefined,
    photosList: [],
    referrerName: '',
    referrerContact: '',
  });

  const [driveModalMode, setDriveModalMode] = useState<'SELECT_PHOTO' | 'SELECT_FOLDER' | null>(
    null
  );

  // Preferred upload destination: BOTH (recommended), FIREBASE, or DRIVE
  const [uploadDestination, setUploadDestination] = useState<ImageUploadDestination>('BOTH');

  // Device Upload & Metadata Extraction State
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const multiplePhotosInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedMeta, setExtractedMeta] = useState<ExtractedImageMeta | null>(null);
  const [autoTransferMeta, setAutoTransferMeta] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Section 5 multiple upload state
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const [multipleUploadStatus, setMultipleUploadStatus] = useState<string | null>(null);

  // Lightbox preview within modal
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (propertyToEdit) {
      setFormData({
        ...propertyToEdit,
        photosList: propertyToEdit.photosList || [],
      });
      setExtractedMeta(null);
      setUploadSuccessMsg(null);
      setUploadError(null);
    } else {
      setFormData({
        adImageName: '',
        adImageUrl: '',
        adImageDriveId: undefined,
        adImageStoragePath: undefined,
        adImageStorageProvider: 'both',
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
        photosFolderDriveId: undefined,
        photosList: [],
        referrerName: '',
        referrerContact: '',
      });
      setExtractedMeta(null);
      setUploadSuccessMsg(null);
      setUploadError(null);
    }
  }, [propertyToEdit, isOpen]);

  if (!isOpen) return null;

  // Process file upload from device
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

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

      // 3. Upload to Google Drive, Firebase Storage, or Both based on preference
      const result = await uploadPropertyImage(file, uploadDestination, {
        propertyId: propertyToEdit?.id,
        parentDriveFolderId: formData.photosFolderDriveId,
        isDriveAuthenticated: isAuthenticated,
      });

      setFormData((prev) => ({
        ...prev,
        adImageName: result.name,
        adImageUrl: result.url,
        adImageDriveId: result.driveId,
        adImageStoragePath: result.storagePath,
        adImageStorageProvider: result.provider,
      }));

      // Feedback message
      if (result.provider === 'both') {
        setUploadSuccessMsg('✓ Foto enviada com sucesso para o Google Drive e para o Firebase!');
      } else if (result.provider === 'firebase') {
        setUploadSuccessMsg('✓ Foto salva com sucesso no Firebase Cloud Storage!');
      } else {
        setUploadSuccessMsg('✓ Foto salva com sucesso no seu Google Drive!');
      }
      setTimeout(() => setUploadSuccessMsg(null), 5000);
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
        address:
          prev.address && prev.address !== 'Sem endereço informado'
            ? `${prev.address} (GPS: ${extractedMeta.latitude?.toFixed(5)}, ${extractedMeta.longitude?.toFixed(5)})`
            : `Localização GPS: ${extractedMeta.latitude?.toFixed(6)}, ${extractedMeta.longitude?.toFixed(6)}`,
      }));
    }
  };

  // Multiple photos upload for Section 5 (Gallery)
  const handleMultiplePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files) as File[];
    setIsUploadingMultiple(true);
    setMultipleUploadStatus(`Enviando 0 de ${files.length} fotos...`);

    try {
      let count = 0;
      const newPhotoItems: PropertyPhotoItem[] = [];

      for (const file of files) {
        const result = await uploadPropertyImage(file, uploadDestination, {
          propertyId: propertyToEdit?.id,
          parentDriveFolderId: formData.photosFolderDriveId,
          isDriveAuthenticated: isAuthenticated,
        });

        newPhotoItems.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: result.url,
          driveId: result.driveId,
          storagePath: result.storagePath,
          provider: result.provider,
          createdAt: new Date().toISOString(),
        });

        count++;
        setMultipleUploadStatus(`Enviando ${count} de ${files.length} fotos (${uploadDestination === 'BOTH' ? 'Drive + Firebase' : uploadDestination})...`);
      }

      setFormData((prev) => {
        const currentList = prev.photosList || [];
        const updatedList = [...currentList, ...newPhotoItems];
        return {
          ...prev,
          photosList: updatedList,
          photosCount: updatedList.length,
        };
      });

      setMultipleUploadStatus(`✓ ${count} fotos enviadas com sucesso!`);
      setTimeout(() => setMultipleUploadStatus(null), 4000);
    } catch (err: unknown) {
      setMultipleUploadStatus(
        err instanceof Error ? err.message : 'Erro ao enviar fotos'
      );
    } finally {
      setIsUploadingMultiple(false);
    }
  };

  // Remove a photo from gallery
  const handleRemoveGalleryPhoto = (photoId: string) => {
    setFormData((prev) => {
      const updatedList = (prev.photosList || []).filter((p) => p.id !== photoId);
      return {
        ...prev,
        photosList: updatedList,
        photosCount: updatedList.length,
      };
    });
  };

  // Set gallery photo as main ad image
  const handleSetAsMainPhoto = (photo: PropertyPhotoItem) => {
    setFormData((prev) => ({
      ...prev,
      adImageName: photo.name,
      adImageUrl: photo.url,
      adImageDriveId: photo.driveId,
      adImageStoragePath: photo.storagePath,
      adImageStorageProvider: photo.provider === 'local' ? 'firebase' : photo.provider,
    }));
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
      adImageStoragePath: formData.adImageStoragePath,
      adImageStorageProvider: formData.adImageStorageProvider || 'both',
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
      photosCount: formData.photosList?.length || formData.photosCount || 0,
      photosList: formData.photosList || [],
      referrerName: formData.referrerName?.trim() || '',
      referrerContact: formData.referrerContact?.trim() || '',
      createdAt: propertyToEdit?.createdAt || now,
      updatedAt: now,
    };

    onSave(finalProperty);
    onClose();
  };

  const mainDisplayUrl = getDisplayImageUrl(formData.adImageUrl, formData.adImageDriveId);

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
                  Cadastre dados da placa, contatos, fotos no Google Drive e Firebase (campos opcionais)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Imagem do Anúncio / Placa (Drive & Firebase) */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isDragging
                  ? 'bg-blue-100/70 border-blue-500 ring-2 ring-blue-300'
                  : 'bg-blue-50/50 border-blue-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Fotografia do Anúncio de Telefone / Placa no Local
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Hidden file input for Photo Gallery (NO capture attribute) */}
                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Hidden file input for direct Camera capture */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Gallery upload button */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                    title="Navegar e escolher uma foto da galeria do seu aparelho"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando Foto...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Galeria do Aparelho</span>
                      </>
                    )}
                  </button>

                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                    title="Abrir a câmera diretamente para tirar uma nova foto agora"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tirar Foto</span>
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

              {/* Destination selector: BOTH, FIREBASE, or DRIVE */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-200/60">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-700">Onde salvar as imagens:</span>
                  <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100/90 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setUploadDestination('BOTH')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                        uploadDestination === 'BOTH'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Salva no Google Drive pessoal e também no Firebase Cloud Storage"
                    >
                      <span>⚡ Ambos (Drive + Firebase)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadDestination('FIREBASE')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all inline-flex items-center gap-1 ${
                        uploadDestination === 'FIREBASE'
                          ? 'bg-orange-600 text-white shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Salva na nuvem do Firebase (acesso rápido e seguro)"
                    >
                      <Flame className="w-3 h-3" />
                      <span>Firebase Storage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadDestination('DRIVE')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all inline-flex items-center gap-1 ${
                        uploadDestination === 'DRIVE'
                          ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Salva diretamente no seu Google Drive"
                    >
                      <HardDrive className="w-3 h-3" />
                      <span>Google Drive</span>
                    </button>
                  </div>
                </div>

                <label className="inline-flex items-center gap-1.5 cursor-pointer text-blue-700 text-xs font-medium select-none">
                  <input
                    type="checkbox"
                    checked={autoTransferMeta}
                    onChange={(e) => setAutoTransferMeta(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Transferir metadados para observações</span>
                </label>
              </div>

              {uploadSuccessMsg && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {uploadError}
                </div>
              )}

              {/* Extracted Metadata Card */}
              {extractedMeta && (
                <div className="p-3 bg-white border border-blue-200 rounded-lg text-xs space-y-1.5 shadow-2xs">
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
                    Link da Imagem (Google Drive / Firebase)
                  </label>
                  <input
                    type="text"
                    value={formData.adImageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, adImageUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... ou https://firebasestorage..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono text-[11px]"
                  />
                </div>
              </div>

              {formData.adImageUrl && (
                <div className="flex items-center justify-between gap-3 pt-1 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() =>
                        setPreviewPhoto({
                          url: mainDisplayUrl || formData.adImageUrl || '',
                          name: formData.adImageName || 'Foto da Placa',
                        })
                      }
                      className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center cursor-pointer group relative"
                      title="Clique para ampliar"
                    >
                      <img
                        src={mainDisplayUrl || formData.adImageUrl}
                        alt="Prévia da Placa"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 block truncate max-w-xs">
                          {formData.adImageName || 'Foto da placa'}
                        </span>
                        {formData.adImageStorageProvider === 'both' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            ⚡ Drive + Firebase
                          </span>
                        ) : formData.adImageStorageProvider === 'firebase' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                            🔥 Firebase
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            📁 Google Drive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={formData.adImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          Ver original <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewPhoto({
                              url: mainDisplayUrl || formData.adImageUrl || '',
                              name: formData.adImageName || 'Foto da Placa',
                            })
                          }
                          className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 text-[11px]"
                        >
                          Ampliar
                        </button>
                      </div>
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
                        adImageStoragePath: undefined,
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
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Dados de Localização do Imóvel */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Localização do Imóvel Comercial
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Av. Paulista, 1420 - Bela Vista"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood || ''}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Ex: Bela Vista"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: São Paulo"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo de Imóvel Comercial
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
                    <option value="LOJA">Loja Comercial</option>
                    <option value="SALA_COMERCIAL">Sala / Conjunto Comercial</option>
                    <option value="GALPAO">Galpão / Depósito Logístico</option>
                    <option value="PREDIO_INTEIRO">Prédio Inteiro / Monousuário</option>
                    <option value="TERRENO_COMERCIAL">Terreno Comercial</option>
                    <option value="OUTRO">Outro Comercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Área Estimada (m²)
                  </label>
                  <input
                    type="text"
                    value={formData.areaSize || ''}
                    onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                    placeholder="Ex: 220"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Triagem & Condições Comerciais */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  4. Triagem e Valores Comerciais
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Status Atual da Captação
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as PropertyStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="NOVO_ANUNCIO">Novo Anúncio (Placa Identificada)</option>
                    <option value="CONTATO_REALIZADO">Contato Realizado</option>
                    <option value="EM_TRIAGEM">Em Triagem</option>
                    <option value="NEGOCIACAO_PARCERIA">Negociação de Parceria</option>
                    <option value="CAPTACAO_AUTORIZADA">Captação Autorizada</option>
                    <option value="FOTOS_REALIZADAS">Fotos Realizadas</option>
                    <option value="EM_DIVULGACAO">Em Divulgação</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="ARQUIVADO">Arquivado / Descartado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Valor Pretendido (Locação / Venda)
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedPrice || ''}
                    onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                    placeholder="Ex: Aluguel R$ 18.000 ou Venda R$ 3.2M"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600">
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

            {/* Section 5: Galeria de Fotos & Pasta do Google Drive / Firebase */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Images className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    5. Galeria de Imagens do Imóvel & Pasta do Drive
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    Vincular Pasta no Drive
                  </button>
                </div>
              </div>

              {multipleUploadStatus && (
                <div className="p-2 bg-amber-100/70 border border-amber-300 rounded text-xs text-amber-900 font-medium">
                  {multipleUploadStatus}
                </div>
              )}

              {/* Uploaded Gallery Photos Grid */}
              {formData.photosList && formData.photosList.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-amber-200">
                  <div className="flex items-center justify-between text-xs text-amber-900 font-semibold">
                    <span>Fotos salvas nesta captação ({formData.photosList.length}):</span>
                    <span className="text-[11px] text-amber-700 font-normal">
                      Clique em uma foto para ampliar ou torná-la a foto principal
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {formData.photosList.map((photo) => {
                      const displayUrl = getDisplayImageUrl(photo.url, photo.driveId);
                      const isMain = formData.adImageUrl === photo.url;

                      return (
                        <div
                          key={photo.id}
                          className={`relative rounded-lg border overflow-hidden bg-white shadow-2xs group flex flex-col ${
                            isMain ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'
                          }`}
                        >
                          <div
                            onClick={() =>
                              setPreviewPhoto({
                                url: displayUrl || photo.url,
                                name: photo.name,
                              })
                            }
                            className="aspect-video w-full bg-slate-100 cursor-pointer overflow-hidden relative"
                          >
                            <img
                              src={displayUrl || photo.url}
                              alt={photo.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Maximize2 className="w-4 h-4" />
                            </div>

                            {/* Provider Tag */}
                            <div className="absolute top-1 left-1">
                              {photo.provider === 'both' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600/90 text-white shadow-2xs">
                                  ⚡ Ambos
                                </span>
                              ) : photo.provider === 'firebase' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-600/90 text-white shadow-2xs flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5" /> Firebase
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600/90 text-white shadow-2xs">
                                  📁 Drive
                                </span>
                              )}
                            </div>

                            {isMain && (
                              <div className="absolute top-1 right-1 bg-blue-600 text-white p-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-current" />
                              </div>
                            )}
                          </div>

                          <div className="p-1.5 flex items-center justify-between text-[11px] bg-slate-50 gap-1 border-t border-slate-100">
                            <span className="truncate text-slate-700 font-medium" title={photo.name}>
                              {photo.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {!isMain && (
                                <button
                                  type="button"
                                  onClick={() => handleSetAsMainPhoto(photo)}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                                  title="Definir esta foto como imagem principal da placa"
                                >
                                  Principal
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryPhoto(photo.id)}
                                className="text-slate-400 hover:text-red-600 p-0.5 rounded"
                                title="Remover foto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Link / URL da Pasta de Fotos no Google Drive
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

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                {propertyToEdit ? 'Salvar Alterações' : 'Cadastrar Captação'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lightbox / Preview modal for any photo clicked inside the modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 text-white">
              <span className="text-xs font-semibold truncate max-w-md">
                {previewPhoto.name}
              </span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-hidden bg-black/50">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[70vh] w-auto object-contain rounded shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 text-white text-xs border-t border-slate-800">
              <a
                href={previewPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Abrir em nova aba <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Browser Modal */}
      {driveModalMode && (
        <DriveBrowserModal
          isOpen={true}
          onClose={() => setDriveModalMode(null)}
          mode={driveModalMode}
          onSelect={(item) => {
            if (driveModalMode === 'SELECT_PHOTO') {
              setFormData((prev) => ({
                ...prev,
                adImageName: item.name,
                adImageUrl: item.url,
                adImageDriveId: item.driveId,
                adImageStorageProvider: 'drive',
              }));
            } else if (driveModalMode === 'SELECT_FOLDER') {
              setFormData((prev) => ({
                ...prev,
                photosFolderUrl: item.url,
                photosFolderDriveId: item.driveId,
              }));
            }
          }}
          defaultFolderName={
            formData.address && formData.address !== 'Sem endereço informado'
              ? `Fotos - ${formData.address.replace(/[^\w\s-]/gi, '').trim()}`
              : 'Fotos - Nova Captação'
          }
          currentPhotosFolderId={formData.photosFolderDriveId}
        />
      )}
    </>
  );
};
