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
 * Returns reference to user's isolated analysis interactions collection
 * Complies with firestore.rules: match /users/{userId}/interactions/{interactionId}
 */
function getUserInteractionsCollection(userId: string) {
  return collection(db, 'users', userId, 'interactions');
}

/**
 * Real-time subscription to the user's isolated analysis sessions
 */
export function subscribeToAnalyses(
  userId: string,
  onUpdate: (sessions: InteractionSession[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    getUserInteractionsCollection(userId),
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
      console.error('Error fetching analysis history from Firestore:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Load user analysis sessions one-time
 */
export async function fetchUserAnalyses(userId: string): Promise<InteractionSession[]> {
  if (!userId) return [];
  const q = query(
    getUserInteractionsCollection(userId),
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
 * Persist an analysis interaction session to Firestore
 * Uses defensive undefined-stripping to guarantee zero SDK rejections.
 */
export async function persistAnalysisSession(
  userId: string,
  session: InteractionSession
): Promise<void> {
  if (!userId) throw new Error('Cannot persist without authenticated user ID');
  if (!session.id) throw new Error('Analysis session ID is missing');

  const docRef = doc(db, 'users', userId, 'interactions', session.id);
  const payload = stripUndefined({
    userId,
    title: session.title || 'Business Analytics Query',
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    question: session.question || '',
    analysis: session.analysis || '',
    datasetName: session.datasetName || 'Active Dataset',
    kpisSnapshot: session.kpisSnapshot || {},
    modelUsed: session.modelUsed || 'gemini-3.6-flash',
    entries: session.entries || [],
  });

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Delete an analysis session from Firestore
 */
export async function removeAnalysisSession(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) return;
  const docRef = doc(db, 'users', userId, 'interactions', sessionId);
  await deleteDoc(docRef);
}
