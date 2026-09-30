import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './auth';
import { PropertyListing, ClientLead } from '../types';

/**
 * Validates connection to Firestore at boot time as mandated by Firebase skill
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline ou configuração pendente:', error.message);
      return false;
    }
    // A permission-denied or not-found error still proves the server is reachable
    return true;
  }
}

/**
 * Real-time subscription to user's properties
 */
export const subscribeUserProperties = (
  userId: string,
  onData: (properties: PropertyListing[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!userId) return () => {};

  const colRef = collection(db, 'users', userId, 'properties');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const properties: PropertyListing[] = [];
      snapshot.forEach((docSnap) => {
        properties.push(docSnap.data() as PropertyListing);
      });
      onData(properties);
    },
    (err) => {
      console.error('Erro na sincronização do Firestore (Propriedades):', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
};

/**
 * Real-time subscription to user's client leads
 */
export const subscribeUserClients = (
  userId: string,
  onData: (clients: ClientLead[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!userId) return () => {};

  const colRef = collection(db, 'users', userId, 'clients');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const clients: ClientLead[] = [];
      snapshot.forEach((docSnap) => {
        clients.push(docSnap.data() as ClientLead);
      });
      onData(clients);
    },
    (err) => {
      console.error('Erro na sincronização do Firestore (Clientes):', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
};

/**
 * Save or update a single property in user's cloud collection
 */
export const savePropertyToFirestore = async (
  userId: string,
  property: PropertyListing
): Promise<void> => {
  if (!userId || !property.id) return;
  const docRef = doc(db, 'users', userId, 'properties', property.id);
  await setDoc(docRef, {
    ...property,
    userId,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

/**
 * Delete a property from user's cloud collection
 */
export const deletePropertyFromFirestore = async (
  userId: string,
  propertyId: string
): Promise<void> => {
  if (!userId || !propertyId) return;
  const docRef = doc(db, 'users', userId, 'properties', propertyId);
  await deleteDoc(docRef);
};

/**
 * Save or update a client lead in user's cloud collection
 */
export const saveClientToFirestore = async (
  userId: string,
  client: ClientLead
): Promise<void> => {
  if (!userId || !client.id) return;
  const docRef = doc(db, 'users', userId, 'clients', client.id);
  await setDoc(docRef, {
    ...client,
    userId,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

/**
 * Delete a client lead from user's cloud collection
 */
export const deleteClientFromFirestore = async (
  userId: string,
  clientId: string
): Promise<void> => {
  if (!userId || !clientId) return;
  const docRef = doc(db, 'users', userId, 'clients', clientId);
  await deleteDoc(docRef);
};

/**
 * Seed or migrate local data to Firestore if cloud collection is currently empty
 */
export const seedInitialFirestoreData = async (
  userId: string,
  initialProperties: PropertyListing[],
  initialClients: ClientLead[]
): Promise<void> => {
  if (!userId) return;

  try {
    const propSnap = await getDocs(collection(db, 'users', userId, 'properties'));
    if (propSnap.empty && initialProperties.length > 0) {
      for (const p of initialProperties) {
        await savePropertyToFirestore(userId, p);
      }
    }

    const clientSnap = await getDocs(collection(db, 'users', userId, 'clients'));
    if (clientSnap.empty && initialClients.length > 0) {
      for (const c of initialClients) {
        await saveClientToFirestore(userId, c);
      }
    }
  } catch (err) {
    console.warn('Erro ao inicializar dados no Firestore:', err);
  }
};
