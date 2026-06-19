import { db } from './firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import type { Checklist } from '../types';

const COLLECTION = 'checklists';

export const isRemoteAvailable = !!db;

export async function saveChecklistRemote(checklist: Checklist) {
  if (!db) return null;
  const col = collection(db, COLLECTION);
  const payload = { ...checklist, createdAt: Timestamp.now() } as any;
  try {
    const ref = await addDoc(col, payload);
    console.log('[backend] saveChecklistRemote created doc:', ref.id);
    return ref;
  } catch (e) {
    console.error('[backend] saveChecklistRemote failed:', e);
    throw e;
  }
}

export function subscribeToRemoteChecklists(onUpdate: (items: Checklist[]) => void) {
  if (!db) return () => {};
  const col = collection(db, COLLECTION);
  const q = query(col, orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const items: Checklist[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: data.id || doc.id,
        date: data.date,
        time: data.time,
        driverId: data.driverId,
        driverName: data.driverName,
        vehicleId: data.vehicleId,
        vehicleName: data.vehicleName,
        vehicleType: data.vehicleType,
        items: data.items || {},
        observations: data.observations || '',
        photos: data.photos || [],
        signature: data.signature || '',
        overallStatus: data.overallStatus || 'OK',
      });
    });
    console.log('[backend] onSnapshot received items:', items.length);
    onUpdate(items);
  }, (err) => {
    console.error('[backend] onSnapshot error:', err);
  });
  return unsub;
}

export async function getRemoteChecklists(): Promise<Checklist[]> {
  if (!db) return [];
  const col = collection(db, COLLECTION);
  const q = query(col, orderBy('createdAt', 'desc'));
  try {
    const snap = await getDocs(q);
    const items: Checklist[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: data.id || doc.id,
        date: data.date,
        time: data.time,
        driverId: data.driverId,
        driverName: data.driverName,
        vehicleId: data.vehicleId,
        vehicleName: data.vehicleName,
        vehicleType: data.vehicleType,
        items: data.items || {},
        observations: data.observations || '',
        photos: data.photos || [],
        signature: data.signature || '',
        overallStatus: data.overallStatus || 'OK',
      });
    });
    console.log('[backend] getRemoteChecklists returned:', items.length);
    return items;
  } catch (e) {
    console.error('[backend] getRemoteChecklists failed:', e);
    return [];
  }
}
