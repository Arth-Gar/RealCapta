import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import rawConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

// Support both firebase-applet-config.json and Vercel/Vite environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId,
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || rawConfig.oAuthClientId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// In-memory cache for access token (never stored in localStorage as per guidelines)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if returning from a redirect sign-in (e.g. mobile or redirect mode)
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          if (onAuthSuccess) onAuthSuccess(result.user, cachedAccessToken);
        }
      }
    })
    .catch((err) => {
      console.warn('Erro ao processar redirecionamento de autenticação:', err);
    });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If user is signed in with Firebase but token memory was cleared (e.g. page reload),
        // we prompt sign in to re-obtain fresh Workspace token with scopes
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google Workspace');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Erro na autenticação com Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignInRedirect = async (): Promise<void> => {
  try {
    isSigningIn = true;
    await signInWithRedirect(auth, provider);
  } catch (error: unknown) {
    console.error('Erro no redirect com Google:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessTokenInMemory = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export function parseAuthError(error: unknown): {
  code: string;
  message: string;
  isUnauthorizedDomain: boolean;
  isPopupBlocked: boolean;
} {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';
  const rawMessage = err?.message || String(error);

  const isUnauthorizedDomain =
    code === 'auth/unauthorized-domain' ||
    rawMessage.includes('auth/unauthorized-domain') ||
    rawMessage.includes('unauthorized domain');

  const isPopupBlocked =
    code === 'auth/popup-blocked' ||
    rawMessage.includes('popup-blocked') ||
    code === 'auth/cancelled-popup-request';

  let message = rawMessage;

  if (isUnauthorizedDomain) {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'seu-dominio.vercel.app';
    message = `Domínio não autorizado no Firebase (${currentHost}). O Firebase bloqueia logins deste endereço até que ele seja adicionado na lista de Domínios Autorizados no Firebase Console.`;
  } else if (code === 'auth/popup-closed-by-user') {
    message = 'A janela de login do Google foi fechada antes de autorizar os acessos.';
  } else if (code === 'auth/popup-blocked') {
    message = 'O navegador bloqueou a janela pop-up do Google. Por favor, autorize pop-ups para este site.';
  } else if (code === 'auth/network-request-failed') {
    message = 'Falha de conexão com os servidores de autenticação do Google/Firebase. Verifique sua rede.';
  } else if (code === 'auth/operation-not-allowed') {
    message = 'O provedor de login com Google não está ativado no Firebase Console (Authentication > Sign-in method).';
  }

  return {
    code,
    message,
    isUnauthorizedDomain,
    isPopupBlocked,
  };
}
