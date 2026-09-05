import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { stripUndefined } from './utils';
import type { InteractionSession } from '../types';

/**
 * Returns reference to user's isolated interactions collection
 */
function getInteractionsCollection(userId: string) {
  return collection(db, 'users', userId, 'interactions');
}

/**
 * Real-time subscription to the user's isolated interactions list
 */
export function subscribeToInteractions(
  userId: string,
  onUpdate: (sessions: InteractionSession[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    getInteractionsCollection(userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: InteractionSession[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<InteractionSession, 'id'>) });
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Error fetching interactions:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Load user interactions one-time
 */
export async function fetchUserInteractions(userId: string): Promise<InteractionSession[]> {
  if (!userId) return [];
  const q = query(
    getInteractionsCollection(userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  const items: InteractionSession[] = [];
  snapshot.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...(docSnap.data() as Omit<InteractionSession, 'id'>) });
  });
  return items;
}

/**
 * Save or update an interaction session to Firestore
 * Uses defensive undefined-stripping to guarantee zero SDK rejections.
 */
export async function persistInteraction(
  userId: string,
  session: InteractionSession
): Promise<void> {
  if (!userId) throw new Error('Cannot persist without authenticated user ID');
  if (!session.id) throw new Error('Session ID is missing');

  const docRef = doc(db, 'users', userId, 'interactions', session.id);
  const payload = stripUndefined({
    userId,
    title: session.title || 'Untitled Reflection',
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entries: session.entries || [],
    summary: session.summary || '',
    tags: session.tags || [],
  });

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Delete an interaction session from Firestore
 */
export async function removeInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  if (!userId || !interactionId) return;
  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(docRef);
}
