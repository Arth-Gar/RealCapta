import React, { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Building,
  Phone,
  MessageSquare,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  ClientLead,
  ClientAttendanceStatus,
  PropertyListing,
} from '../types';
import { ATTENDANCE_STATUS_LABELS } from '../services/sheetsService';

interface ClientsManagerProps {
  clients: ClientLead[];
  properties: PropertyListing[];
  onOpenNewClient: () => void;
  onEditClient: (client: ClientLead) => void;
  onDeleteClient: (client: ClientLead) => void;
  onUpdateStatus: (clientId: string, newStatus: ClientAttendanceStatus) => void;
  onOpenWhatsApp: (
    client: ClientLead,
    mode: 'CLIENT_VISIT' | 'CLIENT_PROPOSAL' | 'GENERAL'
  ) => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  properties,
  onOpenNewClient,
  onEditClient,
  onDeleteClient,
  onUpdateStatus,
  onOpenWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [interestFilter, setInterestFilter] = useState<string>('ALL');

  const propMap = new Map<string, PropertyListing>(properties.map((p) => [p.id, p]));

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.attendanceStatus === statusFilter;
    const matchesInterest = interestFilter === 'ALL' || c.interestType === interestFilter;

    return matchesSearch && matchesStatus && matchesInterest;
  });

  const getAttendanceBadgeClass = (status: ClientAttendanceStatus) => {
    switch (status) {
      case 'PRIMEIRO_CONTATO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AGENDAMENTO_VISITA':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'VISITA_REALIZADA':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'AGUARDANDO_RETORNO':
        return 'bg-orange-50 text-orange-800 border-orange-200 font-semibold';
      case 'PROPOSTA_ENVIADA':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      case 'PROPOSTA_EM_ANALISE':
        return 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold';
      case 'EM_FECHAMENTO':
        return 'bg-teal-50 text-teal-800 border-teal-300 font-bold';
      case 'CONTRATO_ASSINADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'SEM_INTERESSE':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'ARQUIVADO':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, empresa, telefone ou anotações..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Todos os Status ({clients.length})</option>
              <option value="PRIMEIRO_CONTATO">Primeiro Contato</option>
              <option value="AGENDAMENTO_VISITA">Agendamento de Visita</option>
              <option value="VISITA_REALIZADA">Visita Realizada</option>
              <option value="AGUARDANDO_RETORNO">Aguardando Retorno</option>
              <option value="PROPOSTA_ENVIADA">Proposta Enviada</option>
              <option value="PROPOSTA_EM_ANALISE">Proposta em Análise</option>
              <option value="EM_FECHAMENTO">Em Fechamento</option>
              <option value="CONTRATO_ASSINADO">Contrato Assinado (Ganho)</option>
              <option value="SEM_INTERESSE">Sem Interesse</option>
            </select>

            <select
              value={interestFilter}
              onChange={(e) => setInterestFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Todos os Interesses</option>
              <option value="LOCACAO">Apenas Locação (Alugar)</option>
              <option value="COMPRA">Apenas Compra</option>
              <option value="AMBOS">Compra ou Locação</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewClient}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 min-w-[200px]">Cliente / Empresa</th>
                <th className="py-3 px-3 min-w-[130px]">Contato & WhatsApp</th>
                <th className="py-3 px-3 min-w-[110px]">Interesse</th>
                <th className="py-3 px-3 min-w-[200px]">Status do Atendimento</th>
                <th className="py-3 px-3 min-w-[220px]">Imóveis de Interesse</th>
                <th className="py-3 px-3 min-w-[130px]">Próximo Retorno</th>
                <th className="py-3 px-3 min-w-[200px]">Observações</th>
                <th className="py-3 px-3 text-right w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-xs text-slate-600">Nenhum cliente encontrado</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cadastre interessados em alugar ou comprar seus imóveis captados.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => {
                  const isOverdue =
                    c.nextFollowUpDate &&
                    new Date(c.nextFollowUpDate) < new Date(new Date().setHours(0, 0, 0, 0));
                  const isToday =
                    c.nextFollowUpDate &&
                    new Date(c.nextFollowUpDate).toDateString() === new Date().toDateString();

                  return (
                    <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors">
                      {/* 1. Cliente / Empresa */}
                      <td className="py-3 px-4 align-middle">
                        <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                        {c.companyName && (
                          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                            {c.companyName}
                          </div>
                        )}
                        {c.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {c.email}
                          </div>
                        )}
                      </td>

                      {/* 2. Contato & WhatsApp */}
                      <td className="py-3 px-3 align-middle">
                        <div className="font-semibold text-slate-800 text-xs">{c.phone}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(c, 'GENERAL')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-200 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                            WhatsApp
                          </button>
                        </div>
                      </td>

                      {/* 3. Interesse & Orçamento */}
                      <td className="py-3 px-3 align-middle">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.interestType === 'LOCACAO'
                              ? 'bg-blue-100 text-blue-800'
                              : c.interestType === 'COMPRA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {c.interestType === 'LOCACAO'
                            ? 'Alugar'
                            : c.interestType === 'COMPRA'
                            ? 'Comprar'
                            : 'Compra/Aluguel'}
                        </span>
                        {c.budget && (
                          <div className="text-[10px] text-slate-600 font-medium mt-1">
                            {c.budget}
                          </div>
                        )}
                        {c.desiredArea && (
                          <div className="text-[10px] text-slate-400">{c.desiredArea}</div>
                        )}
                      </td>

                      {/* 4. Status do Atendimento (Múltiplas opções) */}
                      <td className="py-3 px-3 align-middle">
                        <select
                          value={c.attendanceStatus}
                          onChange={(e) =>
                            onUpdateStatus(c.id, e.target.value as ClientAttendanceStatus)
                          }
                          className={`w-full text-xs font-semibold py-1.5 px-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 cursor-pointer ${getAttendanceBadgeClass(
                            c.attendanceStatus
                          )}`}
                        >
                          <option value="PRIMEIRO_CONTATO">1. Primeiro Contato</option>
                          <option value="AGENDAMENTO_VISITA">2. Agendamento de Visita</option>
                          <option value="VISITA_REALIZADA">3. Visita Realizada</option>
                          <option value="AGUARDANDO_RETORNO">4. Aguardando Retorno</option>
                          <option value="PROPOSTA_ENVIADA">5. Proposta Enviada</option>
                          <option value="PROPOSTA_EM_ANALISE">6. Proposta em Análise</option>
                          <option value="EM_FECHAMENTO">7. Em Fechamento / Contrato</option>
                          <option value="CONTRATO_ASSINADO">8. Contrato Assinado (Ganho)</option>
                          <option value="SEM_INTERESSE">9. Sem Interesse</option>
                          <option value="ARQUIVADO">10. Arquivado</option>
                        </select>
                      </td>

                      {/* 5. Imóveis de Interesse Vinculados */}
                      <td className="py-3 px-3 align-middle">
                        {c.interestedPropertyIds.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">
                            Nenhum imóvel vinculado
                          </span>
                        ) : (
                          <div className="space-y-1 max-w-xs">
                            {c.interestedPropertyIds.map((pid) => {
                              const prop = propMap.get(pid);
                              return (
                                <div
                                  key={pid}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded text-[10px] font-medium mr-1 mb-0.5 truncate max-w-full"
                                  title={prop ? prop.address : pid}
                                >
                                  <Building className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate">{prop ? prop.address : 'Imóvel'}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* 6. Próximo Retorno */}
                      <td className="py-3 px-3 align-middle">
                        {c.nextFollowUpDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isOverdue
                                  ? 'text-red-600'
                                  : isToday
                                  ? 'text-amber-600 font-bold'
                                  : 'text-slate-400'
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isOverdue
                                  ? 'text-red-700 font-bold'
                                  : isToday
                                  ? 'text-amber-800 font-bold'
                                  : 'text-slate-700'
                              }`}
                            >
                              {new Date(c.nextFollowUpDate).toLocaleDateString('pt-BR')}
                            </span>
                            {isOverdue && (
                              <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-bold">
                                Atrasado
                              </span>
                            )}
                            {isToday && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">
                                Hoje
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* 7. Observações */}
                      <td className="py-3 px-3 align-middle">
                        <p className="text-[11px] text-slate-600 line-clamp-2" title={c.notes}>
                          {c.notes || 'Sem anotações'}
                        </p>
                      </td>

                      {/* 8. Ações */}
                      <td className="py-3 px-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditClient(c)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar Cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteClient(c)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir Cliente"
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

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Exibindo <strong>{filteredClients.length}</strong> de <strong>{clients.length}</strong> clientes em atendimento
          </span>
          <span className="text-[11px]">
            Dica: Acompanhe os agendamentos e propostas para não perder o timing das negociações comerciais.
          </span>
        </div>
      </div>
    </div>
  );
};
