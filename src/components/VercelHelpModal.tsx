import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Server,
  Key,
  Globe,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { firebaseConfig } from '../services/auth';

interface VercelHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetrySignIn?: () => void;
  initialError?: string | null;
}

export const VercelHelpModal: React.FC<VercelHelpModalProps> = ({
  isOpen,
  onClose,
  onRetrySignIn,
  initialError,
}) => {
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedVercelWildcard, setCopiedVercelWildcard] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'seu-app.vercel.app';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://seu-app.vercel.app';
  const isVercelDomain = currentHost.includes('vercel.app');
  const projectId = firebaseConfig.projectId || 'tem2015bs';

  const firebaseAuthUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
  const gcpCredentialsUrl = `https://console.cloud.google.com/apis/credentials?project=${projectId}`;

  const copyToClipboard = async (text: string, type: 'domain' | 'wildcard' | 'env') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'domain') {
        setCopiedDomain(true);
        setTimeout(() => setCopiedDomain(false), 2000);
      } else if (type === 'wildcard') {
        setCopiedVercelWildcard(true);
        setTimeout(() => setCopiedVercelWildcard(false), 2000);
      } else if (type === 'env') {
        setCopiedEnv(true);
        setTimeout(() => setCopiedEnv(false), 2000);
      }
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const envContent = `# Variáveis de Ambiente para a Vercel (Project Settings > Environment Variables)
VITE_FIREBASE_API_KEY="${firebaseConfig.apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${firebaseConfig.authDomain}"
VITE_FIREBASE_PROJECT_ID="${firebaseConfig.projectId}"
VITE_FIREBASE_STORAGE_BUCKET="${firebaseConfig.storageBucket}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${firebaseConfig.messagingSenderId}"
VITE_FIREBASE_APP_ID="${firebaseConfig.appId}"
VITE_FIREBASE_OAUTH_CLIENT_ID="${firebaseConfig.oAuthClientId}"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/20">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Conexão Google & Firebase no Vercel
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                  Solução
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Como autorizar o login do Google quando seu app está rodando no Vercel ou em domínio próprio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-slate-700 text-xs sm:text-sm">
          {/* Error explanation banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 text-xs sm:text-sm">
                Por que o Google não conecta na Vercel?
              </h3>
              <p className="text-amber-800 text-xs leading-relaxed">
                Por segurança, o Firebase bloqueia operações de autenticação OAuth em qualquer site que não esteja explicitamente cadastrado na lista de <strong>Domínios Autorizados</strong> do Firebase Console (erro <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px] font-mono">auth/unauthorized-domain</code>).
              </p>
              {initialError && (
                <div className="mt-2 p-2 bg-amber-100/70 rounded text-[11px] font-mono text-amber-950 border border-amber-200">
                  <strong>Erro reportado:</strong> {initialError}
                </div>
              )}
            </div>
          </div>

          {/* Current Domain Quick Copy */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900 text-xs">Domínio Atual Detectado:</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {isVercelDomain ? 'Vercel Deployment' : 'Ambiente Local / Preview'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs text-slate-800 break-all select-all">
                {currentHost}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(currentHost, 'domain')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-2xs"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {isVercelDomain && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-600">
                  Dica: Adicionar <strong>vercel.app</strong> autoriza todos os previews da sua conta Vercel!
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('vercel.app', 'wildcard')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                >
                  {copiedVercelWildcard ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedVercelWildcard ? 'Copiado vercel.app!' : 'Copiar vercel.app'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Step 1: Firebase Console */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Adicionar Domínio Autorizado no Firebase Console (Obrigatório)
                </h4>
              </div>
              <a
                href={firebaseAuthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold shrink-0"
              >
                <span>Abrir Firebase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 ml-1">
              <li>
                Acesse o Firebase Console no projeto <strong>{projectId}</strong>.
              </li>
              <li>
                Vá no menu lateral em <strong>Criação &gt; Authentication</strong> (Autenticação).
              </li>
              <li>
                Clique na aba <strong>Configurações (Settings)</strong> e desça até <strong>Domínios autorizados (Authorized domains)</strong>.
              </li>
              <li>
                Clique no botão <strong>Adicionar domínio</strong>.
              </li>
              <li>
                Cole <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-bold">{currentHost}</code> (ou simplesmente <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-bold">vercel.app</code>) e salve.
              </li>
            </ol>
          </div>

          {/* Step 2: Google Cloud Console OAuth */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Verificar Origens JavaScript no Google Cloud Console (OAuth 2.0)
                </h4>
              </div>
              <a
                href={gcpCredentialsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold shrink-0"
              >
                <span>Abrir Google Cloud</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-slate-600">
              Para o Google Drive e Google Sheets funcionarem no seu app:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 ml-1">
              <li>
                Em <strong>APIs e Serviços &gt; Credenciais</strong>, localize seu <strong>ID do cliente OAuth 2.0</strong> (tipo Aplicativo Web).
              </li>
              <li>
                Em <strong>Origens JavaScript autorizadas</strong>, certifique-se de que constam:
                <div className="mt-1 ml-4 space-y-0.5 font-mono text-[11px] text-slate-700">
                  <div>• <code className="bg-slate-100 px-1 py-0.5 rounded">https://{firebaseConfig.authDomain}</code></div>
                  <div>• <code className="bg-slate-100 px-1 py-0.5 rounded">{currentOrigin}</code></div>
                </div>
              </li>
              <li>
                Em <strong>URIs de redirecionamento autorizados</strong>, deve constar:
                <div className="mt-1 ml-4 font-mono text-[11px] text-slate-700">
                  <div>• <code className="bg-slate-100 px-1 py-0.5 rounded">https://{firebaseConfig.authDomain}/__/auth/handler</code></div>
                </div>
              </li>
            </ul>
          </div>

          {/* Step 3: Vercel Environment Variables */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Variáveis de Ambiente na Vercel (Opcional)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(envContent, 'env')}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
              >
                {copiedEnv ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copiado .env!' : 'Copiar Variáveis'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600">
              O projeto já lê automaticamente o arquivo <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">firebase-applet-config.json</code>. Caso queira usar as variáveis de ambiente da Vercel (Dashboard &gt; Settings &gt; Environment Variables), basta colar:
            </p>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] overflow-x-auto select-all">
              {envContent}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <span className="text-[11px] text-slate-500">
            Após salvar o domínio no Firebase, o efeito é quase imediato (10 a 30 segundos).
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
            {onRetrySignIn && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetrySignIn();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Testar Conectar Google Agora</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
