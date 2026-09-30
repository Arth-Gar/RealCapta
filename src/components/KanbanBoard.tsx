import React, { useState } from 'react';
import {
  Building,
  Users,
  MapPin,
  Phone,
  MessageSquare,
  Folder,
  Calendar,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Plus,
} from 'lucide-react';
import {
  PropertyListing,
  PropertyStatus,
  ClientLead,
  ClientAttendanceStatus,
} from '../types';
import { STATUS_LABELS, ATTENDANCE_STATUS_LABELS } from '../services/sheetsService';

interface KanbanBoardProps {
  properties: PropertyListing[];
  clients: ClientLead[];
  onUpdatePropertyStatus: (propertyId: string, newStatus: PropertyStatus) => void;
  onUpdateClientStatus: (clientId: string, newStatus: ClientAttendanceStatus) => void;
  onEditProperty: (property: PropertyListing) => void;
  onEditClient: (client: ClientLead) => void;
  onOpenWhatsAppProperty: (
    property: PropertyListing,
    mode: 'PROPERTY_OWNER' | 'PROPERTY_REFERRER'
  ) => void;
  onOpenWhatsAppClient: (client: ClientLead) => void;
  onOpenNewProperty: () => void;
  onOpenNewClient: () => void;
}

const PROPERTY_STAGES: { id: PropertyStatus; label: string; color: string }[] = [
  { id: 'NOVO_ANUNCIO', label: '1. Novo Anúncio (Placa)', color: 'border-t-amber-500 bg-amber-50/30' },
  { id: 'CONTATO_REALIZADO', label: '2. Contato Feito', color: 'border-t-blue-500 bg-blue-50/30' },
  { id: 'NEGOCIACAO_PARCERIA', label: '3. Parceria / Triagem', color: 'border-t-purple-500 bg-purple-50/30' },
  { id: 'CAPTACAO_AUTORIZADA', label: '4. Captação Autorizada', color: 'border-t-teal-500 bg-teal-50/30' },
  { id: 'FOTOS_REALIZADAS', label: '5. Fotos Realizadas (Drive)', color: 'border-t-emerald-500 bg-emerald-50/30' },
  { id: 'EM_DIVULGACAO', label: '6. Em Divulgação Ativa', color: 'border-t-sky-500 bg-sky-50/30' },
];

const CLIENT_STAGES: { id: ClientAttendanceStatus; label: string; color: string }[] = [
  { id: 'PRIMEIRO_CONTATO', label: '1. Primeiro Contato', color: 'border-t-blue-500 bg-blue-50/30' },
  { id: 'AGENDAMENTO_VISITA', label: '2. Agendamento Visita', color: 'border-t-amber-500 bg-amber-50/30' },
  { id: 'VISITA_REALIZADA', label: '3. Visita Realizada', color: 'border-t-purple-500 bg-purple-50/30' },
  { id: 'AGUARDANDO_RETORNO', label: '4. Aguardando Retorno', color: 'border-t-orange-500 bg-orange-50/30' },
  { id: 'PROPOSTA_EM_ANALISE', label: '5. Proposta em Análise', color: 'border-t-cyan-500 bg-cyan-50/30' },
  { id: 'EM_FECHAMENTO', label: '6. Em Fechamento / Contrato', color: 'border-t-emerald-500 bg-emerald-50/30' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  properties,
  clients,
  onUpdatePropertyStatus,
  onUpdateClientStatus,
  onEditProperty,
  onEditClient,
  onOpenWhatsAppProperty,
  onOpenWhatsAppClient,
  onOpenNewProperty,
  onOpenNewClient,
}) => {
  const [boardType, setBoardType] = useState<'PROPERTIES' | 'CLIENTS'>('PROPERTIES');

  const propMap = new Map<string, PropertyListing>(properties.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      {/* Board Selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBoardType('PROPERTIES')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 ${
              boardType === 'PROPERTIES'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Funil de Captação de Imóveis ({properties.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setBoardType('CLIENTS')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 ${
              boardType === 'CLIENTS'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Funil de Atendimento de Clientes ({clients.length})</span>
          </button>
        </div>

        {boardType === 'PROPERTIES' ? (
          <button
            type="button"
            onClick={onOpenNewProperty}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Captação
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenNewClient}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        )}
      </div>

      {/* Kanban Columns */}
      {boardType === 'PROPERTIES' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 min-h-[600px] overflow-x-auto pb-4">
          {PROPERTY_STAGES.map((stage) => {
            const stageProperties = properties.filter((p) => p.status === stage.id);
            return (
              <div
                key={stage.id}
                className={`flex flex-col rounded-xl border border-slate-200 bg-slate-100/60 border-t-4 ${stage.color} p-3 min-w-[240px] shadow-2xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={stage.label}>
                    {stage.label}
                  </h4>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[10px] font-bold border border-slate-200">
                    {stageProperties.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {stageProperties.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/40">
                      Nenhum imóvel nesta etapa
                    </div>
                  ) : (
                    stageProperties.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onEditProperty(p)}
                        className="p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer transition-all space-y-2 group"
                      >
                        {p.adImageUrl && (
                          <div className="h-20 w-full bg-slate-100 rounded overflow-hidden relative">
                            <img
                              src={p.adImageUrl}
                              alt={p.adImageName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                              Foto da Placa
                            </div>
                          </div>
                        )}

                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {p.propertyType || 'Comercial'}
                          </span>
                          <h5 className="font-bold text-xs text-slate-900 line-clamp-2 mt-1">
                            {p.address}
                          </h5>
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <p className="font-semibold text-slate-800 truncate">
                            {p.ownerName || 'Proprietário'}
                          </p>
                          <p className="text-slate-500">{p.ownerPhone}</p>
                        </div>

                        {p.estimatedPrice && (
                          <div className="text-xs font-bold text-emerald-700">
                            {p.estimatedPrice}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                          {p.photosFolderUrl ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <Folder className="w-3 h-3" /> Fotos no Drive
                            </span>
                          ) : (
                            <span className="text-slate-400">Sem fotos</span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenWhatsAppProperty(p, 'PROPERTY_OWNER');
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Clients Kanban */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 min-h-[600px] overflow-x-auto pb-4">
          {CLIENT_STAGES.map((stage) => {
            const stageClients = clients.filter((c) => c.attendanceStatus === stage.id);
            return (
              <div
                key={stage.id}
                className={`flex flex-col rounded-xl border border-slate-200 bg-slate-100/60 border-t-4 ${stage.color} p-3 min-w-[240px] shadow-2xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={stage.label}>
                    {stage.label}
                  </h4>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[10px] font-bold border border-slate-200">
                    {stageClients.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {stageClients.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/40">
                      Nenhum atendimento nesta etapa
                    </div>
                  ) : (
                    stageClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onEditClient(c)}
                        className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xs cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="font-bold text-xs text-slate-900">{c.name}</h5>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              c.interestType === 'LOCACAO'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {c.interestType === 'LOCACAO' ? 'Locação' : 'Compra'}
                          </span>
                        </div>

                        {c.companyName && (
                          <div className="text-[11px] font-semibold text-indigo-700">
                            {c.companyName}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-600">
                          <p>{c.phone}</p>
                          {c.budget && (
                            <p className="font-semibold text-slate-700 mt-0.5">{c.budget}</p>
                          )}
                        </div>

                        {c.interestedPropertyIds.length > 0 && (
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-[10px] text-slate-600 truncate">
                            <span className="font-medium text-slate-700">Interesse: </span>
                            {c.interestedPropertyIds
                              .map((id) => propMap.get(id)?.address.split(',')[0] || 'Imóvel')
                              .join(', ')}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                          {c.nextFollowUpDate ? (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(c.nextFollowUpDate).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Sem data</span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenWhatsAppClient(c);
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
