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
  return addDoc(col, payload);
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
    onUpdate(items);
  });
  return unsub;
}

export async function getRemoteChecklists(): Promise<Checklist[]> {
  if (!db) return [];
  const col = collection(db, COLLECTION);
  const q = query(col, orderBy('createdAt', 'desc'));
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
  return items;
}
