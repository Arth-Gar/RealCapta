import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  FileText,
  CheckSquare,
  Square,
  Plus,
} from 'lucide-react';
import {
  ClientLead,
  ClientAttendanceStatus,
  ClientInterestType,
  PropertyListing,
} from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientLead) => void;
  clientToEdit?: ClientLead | null;
  properties: PropertyListing[];
  preSelectedPropertyId?: string;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
  properties,
  preSelectedPropertyId,
}) => {
  const [formData, setFormData] = useState<Partial<ClientLead>>({
    name: '',
    phone: '',
    email: '',
    companyName: '',
    interestType: 'LOCACAO',
    budget: '',
    desiredArea: '',
    preferredLocations: '',
    interestedPropertyIds: [],
    attendanceStatus: 'PRIMEIRO_CONTATO',
    nextFollowUpDate: '',
    notes: '',
  });

  useEffect(() => {
    if (clientToEdit) {
      setFormData({ ...clientToEdit });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        companyName: '',
        interestType: 'LOCACAO',
        budget: '',
        desiredArea: '',
        preferredLocations: '',
        interestedPropertyIds: preSelectedPropertyId ? [preSelectedPropertyId] : [],
        attendanceStatus: 'PRIMEIRO_CONTATO',
        nextFollowUpDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        notes: '',
      });
    }
  }, [clientToEdit, isOpen, preSelectedPropertyId]);

  if (!isOpen) return null;

  const toggleProperty = (propertyId: string) => {
    const current = formData.interestedPropertyIds || [];
    if (current.includes(propertyId)) {
      setFormData({
        ...formData,
        interestedPropertyIds: current.filter((id) => id !== propertyId),
      });
    } else {
      setFormData({
        ...formData,
        interestedPropertyIds: [...current, propertyId],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      alert('Por favor, informe o Nome e Telefone do cliente interessado.');
      return;
    }

    const now = new Date().toISOString();
    const finalClient: ClientLead = {
      id: clientToEdit?.id || `client-${Date.now()}`,
      name: formData.name || '',
      phone: formData.phone || '',
      email: formData.email || '',
      companyName: formData.companyName || '',
      interestType: (formData.interestType as ClientInterestType) || 'LOCACAO',
      budget: formData.budget || '',
      desiredArea: formData.desiredArea || '',
      preferredLocations: formData.preferredLocations || '',
      interestedPropertyIds: formData.interestedPropertyIds || [],
      attendanceStatus:
        (formData.attendanceStatus as ClientAttendanceStatus) || 'PRIMEIRO_CONTATO',
      nextFollowUpDate: formData.nextFollowUpDate || '',
      notes: formData.notes || '',
      createdAt: clientToEdit?.createdAt || now,
      updatedAt: now,
    };

    onSave(finalClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="client-form-modal"
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-100 bg-indigo-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {clientToEdit ? 'Editar Cliente / Atendimento' : 'Novo Cliente Interessado'}
              </h3>
              <p className="text-xs text-slate-500">
                Cadastre a demanda comercial e controle o status do atendimento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-indigo-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Dados Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Cliente / Decisor *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Renato Sampaio"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 98111-2233"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Empresa / Razão Social
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Ex: Rede Farma Express"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Corporativo
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com.br"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Interesse & Status */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Tipo de Interesse
                </label>
                <div className="flex gap-2">
                  {[
                    { key: 'LOCACAO', label: 'Alugar (Locação)' },
                    { key: 'COMPRA', label: 'Comprar' },
                    { key: 'AMBOS', label: 'Ambos' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          interestType: item.key as ClientInterestType,
                        })
                      }
                      className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                        formData.interestType === item.key
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Status do Atendimento (Múltiplas Opções)
                </label>
                <select
                  value={formData.attendanceStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attendanceStatus: e.target.value as ClientAttendanceStatus,
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-semibold border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-indigo-900"
                >
                  <option value="PRIMEIRO_CONTATO">1. Primeiro Contato</option>
                  <option value="AGENDAMENTO_VISITA">2. Agendamento de Visita</option>
                  <option value="VISITA_REALIZADA">3. Visita Realizada</option>
                  <option value="AGUARDANDO_RETORNO">4. Aguardando Retorno do Cliente/Proprietário</option>
                  <option value="PROPOSTA_ENVIADA">5. Proposta Enviada</option>
                  <option value="PROPOSTA_EM_ANALISE">6. Proposta em Análise</option>
                  <option value="EM_FECHAMENTO">7. Em Fechamento / Análise de Contrato</option>
                  <option value="CONTRATO_ASSINADO">8. Contrato Assinado (Negócio Fechado)</option>
                  <option value="SEM_INTERESSE">9. Sem Interesse</option>
                  <option value="ARQUIVADO">10. Arquivado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Orçamento / Faixa de Valor
                </label>
                <input
                  type="text"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="Ex: Até R$ 35.000/mês"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Área Desejada (m²)
                </label>
                <input
                  type="text"
                  value={formData.desiredArea || ''}
                  onChange={(e) => setFormData({ ...formData, desiredArea: e.target.value })}
                  placeholder="Ex: 200 a 400 m²"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Próximo Agendamento / Retorno
                </label>
                <input
                  type="date"
                  value={formData.nextFollowUpDate || ''}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Imóveis Vinculados da Planilha */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Imóveis de Interesse da Carteira ({formData.interestedPropertyIds?.length || 0} selecionados)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/50">
              {properties.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">Nenhum imóvel cadastrado no momento.</p>
              ) : (
                properties.map((p) => {
                  const isSelected = formData.interestedPropertyIds?.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProperty(p.id)}
                      className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{p.address}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0 ml-2 font-medium">
                        {p.estimatedPrice || p.propertyType}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações do Atendimento & Próximos Passos
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Agendada visita técnica para quinta-feira, cliente solicitou carência de 60 dias..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>

        {/* Footer */}
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
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            {clientToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};
