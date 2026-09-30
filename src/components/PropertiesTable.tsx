import React, { useState } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  Phone,
  MessageSquare,
  Folder,
  Edit2,
  Trash2,
  Building,
  MapPin,
  Maximize2,
  CheckCircle2,
  HardDrive,
  Eye,
  Plus,
  Users,
  Flame,
  Images,
  X,
} from 'lucide-react';
import { PropertyListing, PropertyStatus } from '../types';
import { STATUS_LABELS } from '../services/sheetsService';
import { getDisplayImageUrl } from '../services/imageStorageService';

interface PropertiesTableProps {
  properties: PropertyListing[];
  onEdit: (property: PropertyListing) => void;
  onDelete: (property: PropertyListing) => void;
  onUpdateStatus: (propertyId: string, newStatus: PropertyStatus) => void;
  onOpenWhatsApp: (property: PropertyListing, mode: 'PROPERTY_OWNER' | 'PROPERTY_REFERRER') => void;
  onLinkClient: (property: PropertyListing) => void;
  onOpenNewProperty: () => void;
}

export const PropertiesTable: React.FC<PropertiesTableProps> = ({
  properties,
  onEdit,
  onDelete,
  onUpdateStatus,
  onOpenWhatsApp,
  onLinkClient,
  onOpenNewProperty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedImagePreview, setSelectedImagePreview] = useState<{
    url: string;
    name: string;
    address: string;
  } | null>(null);
  const [selectedGalleryProperty, setSelectedGalleryProperty] = useState<PropertyListing | null>(null);

  const filteredProperties = properties.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.address || '').toLowerCase().includes(term) ||
      (item.ownerName || '').toLowerCase().includes(term) ||
      (item.ownerPhone || '').includes(searchTerm) ||
      (item.referrerName || '').toLowerCase().includes(term) ||
      ((item.notes || '').toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || item.propertyType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeClass = (status: PropertyStatus) => {
    switch (status) {
      case 'NOVO_ANUNCIO':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 font-bold';
      case 'CONTATO_REALIZADO':
        return 'bg-blue-50 text-blue-700 border-blue-200/80 font-bold';
      case 'EM_TRIAGEM':
        return 'bg-purple-50 text-purple-700 border-purple-200/80 font-bold';
      case 'NEGOCIACAO_PARCERIA':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-bold';
      case 'CAPTACAO_AUTORIZADA':
        return 'bg-teal-50 text-teal-700 border-teal-200/80 font-bold';
      case 'FOTOS_REALIZADAS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-bold';
      case 'EM_DIVULGACAO':
        return 'bg-sky-50 text-sky-700 border-sky-200/80 font-bold';
      case 'CONCLUIDO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'ARQUIVADO':
        return 'bg-slate-100 text-slate-600 border-slate-200 font-medium';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 font-medium';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por endereço, proprietário, telefone, indicador ou notas..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Todos os Status ({properties.length})</option>
              <option value="NOVO_ANUNCIO">Novo Anúncio / Placa</option>
              <option value="CONTATO_REALIZADO">Contato Realizado</option>
              <option value="EM_TRIAGEM">Em Triagem</option>
              <option value="NEGOCIACAO_PARCERIA">Negociação de Parceria</option>
              <option value="CAPTACAO_AUTORIZADA">Captação Autorizada</option>
              <option value="FOTOS_REALIZADAS">Fotos Realizadas</option>
              <option value="EM_DIVULGACAO">Em Divulgação</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="ARQUIVADO">Arquivado</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tipos de Imóveis</option>
              <option value="LOJA">Lojas</option>
              <option value="SALA_COMERCIAL">Salas / Conjuntos</option>
              <option value="GALPAO">Galpões</option>
              <option value="PREDIO_INTEIRO">Prédios Inteiros</option>
              <option value="TERRENO_COMERCIAL">Terrenos / BTS</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewProperty}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Captação</span>
        </button>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-16 text-center">Foto Anúncio</th>
                <th className="py-3 px-4 min-w-[200px]">Endereço do Imóvel</th>
                <th className="py-3 px-3 min-w-[170px]">Proprietário / Imobiliária</th>
                <th className="py-3 px-3 min-w-[140px]">Telefone Contato</th>
                <th className="py-3 px-3 min-w-[170px]">Status da Captação</th>
                <th className="py-3 px-3 min-w-[220px]">Observações & Valores</th>
                <th className="py-3 px-3 min-w-[150px]">Pasta Fotos (Drive)</th>
                <th className="py-3 px-3 min-w-[160px]">Indicação do Imóvel</th>
                <th className="py-3 px-3 text-right w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-xs text-slate-600">Nenhuma captação encontrada</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Adicione uma nova foto de placa ou altere os filtros acima.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProperties.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* 1. Foto do Anúncio (Drive / Firebase) */}
                      <td className="py-3 px-3 text-center align-middle">
                        {p.adImageUrl ? (
                          <div
                            onClick={() => {
                              const displayUrl = getDisplayImageUrl(p.adImageUrl, p.adImageDriveId);
                              setSelectedImagePreview({
                                url: displayUrl || p.adImageUrl,
                                name: p.adImageName,
                                address: p.address,
                              });
                            }}
                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-2xs group-hover:border-blue-400 transition-all mx-auto bg-slate-100"
                            title={`Ver foto: ${p.adImageName}`}
                          >
                            <img
                              src={getDisplayImageUrl(p.adImageUrl, p.adImageDriveId) || p.adImageUrl}
                              alt={p.adImageName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 mx-auto">
                            <Building className="w-4 h-4" />
                          </div>
                        )}
                        <div className="mt-0.5">
                          {p.adImageStorageProvider === 'both' ? (
                            <span className="inline-block text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded" title="Foto salva no Google Drive e Firebase Storage">
                              ⚡ Ambos
                            </span>
                          ) : p.adImageStorageProvider === 'firebase' ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-700 bg-orange-50 px-1 py-0.2 rounded" title="Foto salva no Firebase Cloud Storage">
                              <Flame className="w-2.5 h-2.5" /> Firebase
                            </span>
                          ) : p.adImageStorageProvider === 'drive' ? (
                            <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded" title="Foto salva no Google Drive">
                              📁 Drive
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[70px] mx-auto" title={p.adImageName}>
                              {p.adImageName || 'Placa'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Endereço */}
                      <td className="py-3 px-4 align-middle">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-2">
                          {p.address}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {p.propertyType === 'LOJA'
                              ? 'Loja Comercial'
                              : p.propertyType === 'GALPAO'
                              ? 'Galpão'
                              : p.propertyType === 'SALA_COMERCIAL'
                              ? 'Sala Comercial'
                              : p.propertyType === 'PREDIO_INTEIRO'
                              ? 'Prédio'
                              : p.propertyType === 'TERRENO_COMERCIAL'
                              ? 'Terreno'
                              : 'Comercial'}
                          </span>
                          {p.areaSize && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              {p.areaSize} m²
                            </span>
                          )}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              p.address
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700 inline-flex items-center gap-0.5 text-[10px]"
                            title="Ver no Google Maps"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Mapa</span>
                          </a>
                        </div>
                      </td>

                      {/* 3. Proprietário / Imobiliária */}
                      <td className="py-3 px-3 align-middle">
                        <div className="font-medium text-slate-800 text-xs">
                          {p.ownerName || 'A identificar'}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold mt-0.5 ${
                            p.ownerType === 'IMOBILIARIA_PARCEIRA'
                              ? 'bg-amber-100 text-amber-800'
                              : p.ownerType === 'CORRETOR_PARCEIRO'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.ownerType === 'IMOBILIARIA_PARCEIRA'
                            ? 'Imobiliária Parceira'
                            : p.ownerType === 'CORRETOR_PARCEIRO'
                            ? 'Corretor Parceiro'
                            : 'Proprietário Direto'}
                        </span>
                      </td>

                      {/* 4. Telefone de Contato (WhatsApp) */}
                      <td className="py-3 px-3 align-middle">
                        <div className="font-semibold text-slate-800 text-xs">
                          {p.ownerPhone ? (
                            p.ownerPhone
                          ) : (
                            <span className="text-slate-400 italic font-normal">Não informado</span>
                          )}
                        </div>
                        {p.ownerPhone && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              type="button"
                              onClick={() => onOpenWhatsApp(p, 'PROPERTY_OWNER')}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-200 transition-colors"
                              title="Iniciar conversa no WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 5. Status da Captação (Triagem) */}
                      <td className="py-3 px-3 align-middle">
                        <select
                          value={p.status}
                          onChange={(e) =>
                            onUpdateStatus(p.id, e.target.value as PropertyStatus)
                          }
                          className={`w-full text-xs font-semibold py-1 px-2 rounded-lg border focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusBadgeClass(
                            p.status
                          )}`}
                        >
                          <option value="NOVO_ANUNCIO">Novo Anúncio (Placa)</option>
                          <option value="CONTATO_REALIZADO">Contato Realizado</option>
                          <option value="EM_TRIAGEM">Em Triagem</option>
                          <option value="NEGOCIACAO_PARCERIA">Negociação Parceria</option>
                          <option value="CAPTACAO_AUTORIZADA">Captação Autorizada</option>
                          <option value="FOTOS_REALIZADAS">Fotos Realizadas</option>
                          <option value="EM_DIVULGACAO">Em Divulgação</option>
                          <option value="CONCLUIDO">Negócio Concluído</option>
                          <option value="ARQUIVADO">Arquivado / Descartado</option>
                        </select>
                      </td>

                      {/* 6. Observações & Valores */}
                      <td className="py-3 px-3 align-middle">
                        {p.estimatedPrice && (
                          <div className="font-semibold text-emerald-700 text-xs mb-0.5">
                            {p.estimatedPrice}
                          </div>
                        )}
                        <p className="text-slate-600 text-[11px] line-clamp-2" title={p.notes}>
                          {p.notes || 'Sem observações'}
                        </p>
                      </td>

                      {/* 7. Fotos do Imóvel (Galeria / Pasta Drive) */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col gap-1.5">
                          {p.photosList && p.photosList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedGalleryProperty(p)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs text-left"
                              title="Ver fotos da galeria deste imóvel"
                            >
                              <Images className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{p.photosList.length} {p.photosList.length === 1 ? 'Foto' : 'Fotos'}</span>
                            </button>
                          )}

                          {p.photosFolderUrl ? (
                            <a
                              href={p.photosFolderUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium transition-colors shadow-2xs group/folder"
                            >
                              <Folder className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Pasta Drive</span>
                              <ExternalLink className="w-3 h-3 text-amber-700 opacity-70 group-hover/folder:opacity-100" />
                            </a>
                          ) : (
                            (!p.photosList || p.photosList.length === 0) && (
                              <span className="text-[11px] text-slate-400 italic">
                                Fotos pendentes
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* 8. Indicação do Imóvel */}
                      <td className="py-3 px-3 align-middle">
                        {p.referrerName ? (
                          <div>
                            <div className="font-medium text-slate-800 text-xs">
                              {p.referrerName}
                            </div>
                            {p.referrerContact && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[11px] text-slate-500">
                                  {p.referrerContact}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onOpenWhatsApp(p, 'PROPERTY_REFERRER')}
                                  className="text-emerald-600 hover:text-emerald-700"
                                  title="Enviar WhatsApp ao Indicador"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Captação direta
                          </span>
                        )}
                      </td>

                      {/* 9. Ações */}
                      <td className="py-3 px-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onLinkClient(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Vincular Cliente Interessado"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Dados"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir Captação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Exibindo <strong>{filteredProperties.length}</strong> de <strong>{properties.length}</strong> captações cadastradas
          </span>
          <span className="text-[11px]">
            Dica: Clique no status para fazer a triagem direta ou use o botão do WhatsApp para abordagem rápida.
          </span>
        </div>
      </div>

      {/* Image Zoom Preview Modal */}
      {selectedImagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative max-w-3xl w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold truncate max-w-md">
                  {selectedImagePreview.name} — {selectedImagePreview.address}
                </span>
              </div>
              <button
                onClick={() => setSelectedImagePreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={selectedImagePreview.url}
                alt={selectedImagePreview.name}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white text-xs border-t border-slate-800">
              <a
                href={selectedImagePreview.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Abrir imagem no Google Drive / Nova aba <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setSelectedImagePreview(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Full Photo Gallery Modal */}
      {selectedGalleryProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="relative max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Images className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="text-sm font-semibold">
                    Galeria de Fotos do Imóvel ({selectedGalleryProperty.photosList?.length || 0})
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-lg">
                    {selectedGalleryProperty.address}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGalleryProperty(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedGalleryProperty.photosList?.map((photo) => {
                  const displayUrl = getDisplayImageUrl(photo.url, photo.driveId);
                  return (
                    <div
                      key={photo.id}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div
                        onClick={() =>
                          setSelectedImagePreview({
                            url: displayUrl || photo.url,
                            name: photo.name,
                            address: selectedGalleryProperty.address,
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
                        <div className="absolute top-1.5 left-1.5">
                          {photo.provider === 'both' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white shadow-2xs">
                              ⚡ Ambos
                            </span>
                          ) : photo.provider === 'firebase' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-600 text-white shadow-2xs flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> Firebase
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white shadow-2xs">
                              📁 Drive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 bg-white flex items-center justify-between text-[11px] border-t border-slate-100">
                        <span className="truncate font-medium text-slate-700 max-w-[130px]" title={photo.name}>
                          {photo.name}
                        </span>
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-0.5"
                          title="Abrir imagem original"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedGalleryProperty.photosFolderUrl && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-700" />
                    <span className="text-xs text-amber-900 font-medium">
                      Este imóvel também possui uma pasta vinculada no Google Drive.
                    </span>
                  </div>
                  <a
                    href={selectedGalleryProperty.photosFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
                  >
                    <span>Abrir Pasta Completa</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Imagens salvas na nuvem com visualização instantânea.
              </span>
              <button
                type="button"
                onClick={() => setSelectedGalleryProperty(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Fechar Galeria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
