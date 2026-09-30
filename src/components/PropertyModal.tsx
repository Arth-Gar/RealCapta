import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Folder,
  User,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Maximize2,
  Building,
  UserCheck,
  HardDrive,
  FolderPlus,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { PropertyListing, PropertyStatus } from '../types';
import { DriveBrowserModal } from './DriveBrowserModal';

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

  useEffect(() => {
    if (propertyToEdit) {
      setFormData({ ...propertyToEdit });
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
    }
  }, [propertyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address?.trim() || !formData.ownerPhone?.trim()) {
      alert('Por favor, preencha pelo menos o Endereço e o Telefone de contato.');
      return;
    }

    const now = new Date().toISOString();
    const finalProperty: PropertyListing = {
      id: propertyToEdit?.id || `prop-${Date.now()}`,
      adImageName: formData.adImageName || 'Foto da Placa',
      adImageUrl: formData.adImageUrl || '',
      adImageDriveId: formData.adImageDriveId,
      ownerName: formData.ownerName || 'A identificar',
      ownerType: formData.ownerType || 'PROPRIETARIO',
      ownerPhone: formData.ownerPhone || '',
      ownerEmail: formData.ownerEmail || '',
      address: formData.address || '',
      neighborhood: formData.neighborhood || '',
      city: formData.city || '',
      propertyType: formData.propertyType || 'LOJA',
      status: (formData.status as PropertyStatus) || 'NOVO_ANUNCIO',
      notes: formData.notes || '',
      estimatedPrice: formData.estimatedPrice || '',
      areaSize: formData.areaSize || '',
      photosFolderUrl: formData.photosFolderUrl || '',
      photosFolderDriveId: formData.photosFolderDriveId,
      referrerName: formData.referrerName || '',
      referrerContact: formData.referrerContact || '',
      createdAt: propertyToEdit?.createdAt || now,
      updatedAt: now,
    };

    onSave(finalProperty);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
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
                  Cadastre os dados da placa/anúncio, contatos, fotos e triagem
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
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Section 1: Foto do Anúncio / Placa */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Fotografia do Anúncio de Telefone / Placa no Local
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setDriveModalMode('SELECT_PHOTO')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 text-blue-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  Buscar no Google Drive
                </button>
              </div>

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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {formData.adImageUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-14 h-14 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-300">
                    <img
                      src={formData.adImageUrl}
                      alt="Prévia da Placa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700 block">Prévia da imagem vinculada</span>
                    <a
                      href={formData.adImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      Abrir arquivo original <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Telefone de Contato (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerPhone || ''}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    Endereço Completo (Rua, Número, Bairro, Cidade) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Av. Paulista, 1420 - Bela Vista, São Paulo/SP"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Observações Comerciais & Condições
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalhes comerciais, pé direito, carência, IPTU, comissão acordada..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Section 5: Link da Pasta das Fotos no Google Drive */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    5. Pasta das Imagens do Imóvel (Google Drive)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setDriveModalMode('SELECT_FOLDER')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 hover:border-amber-500 text-amber-900 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                  Vincular / Criar Pasta no Drive
                </button>
              </div>

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
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  {formData.photosFolderUrl && (
                    <a
                      href={formData.photosFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                    >
                      Abrir <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          defaultFolderName={
            formData.address ? `Imóvel - ${formData.address.split(',')[0]} (Fotos)` : 'Fotos do Imóvel Comercial'
          }
          isAuthenticated={isAuthenticated}
          onRequireAuth={onRequireAuth}
          onSelect={(item) => {
            if (driveModalMode === 'SELECT_PHOTO') {
              setFormData({
                ...formData,
                adImageName: item.name,
                adImageUrl: item.url,
                adImageDriveId: item.driveId,
              });
            } else {
              setFormData({
                ...formData,
                photosFolderUrl: item.url,
                photosFolderDriveId: item.driveId,
              });
            }
          }}
        />
      )}
    </>
  );
};
