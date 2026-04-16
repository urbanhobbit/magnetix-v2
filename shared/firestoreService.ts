import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  name: string;
  createdBy: string;
  status: 'l1' | 'preprocessing' | 'l2' | 'l3';
  createdAt?: any;
}

export async function createSession(session: Omit<Session, 'createdAt'>): Promise<void> {
  await setDoc(doc(db, 'sessions', session.id), {
    ...session,
    createdAt: serverTimestamp(),
  });
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const snap = await getDoc(doc(db, 'sessions', sessionId));
  return snap.exists() ? (snap.data() as Session) : null;
}

export async function listSessions(): Promise<Session[]> {
  const snap = await getDocs(collection(db, 'sessions'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
}

export async function updateSessionStatus(sessionId: string, status: Session['status']): Promise<void> {
  await setDoc(doc(db, 'sessions', sessionId), { status }, { merge: true });
}

// ─── T1: L1 Notes ────────────────────────────────────────────────────────────

export interface FirestoreL1Note {
  sessionId: string;
  expertName: string;
  text: string;
  timestamp: string;
}

export async function saveL1Note(sessionId: string, expertName: string, text: string): Promise<void> {
  const docId = `${sessionId}_${expertName.replace(/\s+/g, '_')}`;
  await setDoc(doc(db, 'l1_notes', docId), {
    sessionId,
    expertName,
    text,
    timestamp: new Date().toISOString(),
  });
}

export async function getL1Notes(sessionId: string): Promise<FirestoreL1Note[]> {
  const q = query(collection(db, 'l1_notes'), where('sessionId', '==', sessionId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as FirestoreL1Note);
}

// ─── T2: Preprocessed ────────────────────────────────────────────────────────

export interface FirestorePreprocessed {
  sessionId: string;
  preprocessedBy: string;
  groups: { name: string; needs: { text: string; frequency: number; experts: string[] }[] }[];
  unassigned: { text: string; frequency: number; experts: string[] }[];
  timestamp: string;
}

export async function savePreprocessed(sessionId: string, data: Omit<FirestorePreprocessed, 'sessionId' | 'timestamp'>): Promise<void> {
  await setDoc(doc(db, 'preprocessed', sessionId), {
    sessionId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

export async function getPreprocessed(sessionId: string): Promise<FirestorePreprocessed | null> {
  const snap = await getDoc(doc(db, 'preprocessed', sessionId));
  return snap.exists() ? (snap.data() as FirestorePreprocessed) : null;
}

// ─── T3: L2 Results ──────────────────────────────────────────────────────────

export interface FirestoreL2Result {
  sessionId: string;
  expertName: string;
  needs: { id: string; text: string; stage: string; groupId?: string }[];
  groups: { id: string; name: string; stage: string }[];
  timestamp: string;
}

export async function saveL2Result(sessionId: string, expertName: string, data: Omit<FirestoreL2Result, 'sessionId' | 'timestamp'>): Promise<void> {
  const docId = `${sessionId}_${expertName.replace(/\s+/g, '_')}`;
  await setDoc(doc(db, 'l2_results', docId), {
    sessionId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

export async function getL2Results(sessionId: string): Promise<FirestoreL2Result[]> {
  const q = query(collection(db, 'l2_results'), where('sessionId', '==', sessionId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as FirestoreL2Result);
}
