import React, { useState } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, X, Send } from 'lucide-react';
import { PropertyListing, ClientLead } from '../types';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProperty?: PropertyListing | null;
  targetClient?: ClientLead | null;
  mode: 'PROPERTY_OWNER' | 'PROPERTY_REFERRER' | 'CLIENT_VISIT' | 'CLIENT_PROPOSAL' | 'GENERAL';
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  targetProperty,
  targetClient,
  mode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let defaultPhone = '';
  let defaultName = '';
  let defaultMessage = '';

  if (mode === 'PROPERTY_OWNER' && targetProperty) {
    defaultPhone = targetProperty.ownerPhone;
    defaultName = targetProperty.ownerName;
    const isPartner = targetProperty.ownerType !== 'PROPRIETARIO';
    
    if (isPartner) {
      defaultMessage = `Olá ${defaultName || 'Corretor(a)'}! Tudo bem? Sou corretor comercial e vi a placa/anúncio no imóvel comercial na ${targetProperty.address}. Gostaria de verificar as condições para trabalharmos em parceria na divulgação deste ponto. Poderia me confirmar os valores e disponibilidade?`;
    } else {
      defaultMessage = `Olá ${defaultName || 'Sr(a)'}! Tudo bem? Sou corretor de imóveis comerciais e passei em frente ao seu imóvel na ${targetProperty.address}. Tenho clientes corporativos buscando pontos nessa região e gostaria de confirmar se o imóvel ainda está disponível para locação/venda. Podemos conversar?`;
    }
  } else if (mode === 'PROPERTY_REFERRER' && targetProperty) {
    defaultPhone = targetProperty.referrerContact;
    defaultName = targetProperty.referrerName;
    defaultMessage = `Olá ${defaultName}! Tudo bem? Agradeço muito pela indicação do imóvel na ${targetProperty.address}. Já estamos em contato e fazendo a triagem com o proprietário. Te mantenho informado sobre o andamento!`;
  } else if (mode === 'CLIENT_VISIT' && targetClient) {
    defaultPhone = targetClient.phone;
    defaultName = targetClient.name;
    defaultMessage = `Olá ${defaultName}! Tudo bem? Sobre o imóvel comercial que conversamos (${targetProperty?.address || 'de seu interesse'}), gostaria de confirmar o agendamento de nossa visita técnica. Qual horário fica melhor para você?`;
  } else if (mode === 'CLIENT_PROPOSAL' && targetClient) {
    defaultPhone = targetClient.phone;
    defaultName = targetClient.name;
    defaultMessage = `Olá ${defaultName}! Tudo bem? Estou entrando em contato referente à proposta do imóvel comercial na ${targetProperty?.address || 'região de seu interesse'}. Gostaria de alinhar os últimos detalhes comerciais para formalizarmos com o proprietário.`;
  } else if (targetClient) {
    defaultPhone = targetClient.phone;
    defaultName = targetClient.name;
    defaultMessage = `Olá ${defaultName}! Tudo bem? Gostaria de saber como andam seus planos de expansão/locação comercial e se posso te ajudar com novas opções na região pretendida.`;
  }

  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState(defaultMessage);

  const cleanPhone = phone.replace(/\D/g, '');
  const formattedWhatsAppPhone = cleanPhone.length <= 11 && !cleanPhone.startsWith('55') ? `55${cleanPhone}` : cleanPhone;
  const whatsappUrl = `https://wa.me/${formattedWhatsAppPhone}?text=${encodeURIComponent(message)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="whatsapp-modal"
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-emerald-50/80">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>Enviar Mensagem WhatsApp</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-emerald-100/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Destinatário & Telefone
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <span className="inline-flex items-center px-3 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                {defaultName || 'Contato'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Mensagem Formatada
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {targetProperty && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Imóvel de Referência:</p>
              <p className="truncate">{targetProperty.address}</p>
              {targetProperty.estimatedPrice && (
                <p className="text-emerald-700 font-medium mt-0.5">{targetProperty.estimatedPrice}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Abrir no WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
