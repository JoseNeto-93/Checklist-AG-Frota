export type VehicleType = 'Caminhão' | 'Pá Carregadeira' | 'Escavadeira' | 'Trator' | 'Retroescavadeira' | 'Empilhadeira' | 'Outro';

export type HealthStatus = 'OK' | 'Atenção' | 'Crítico';

export interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  licensePlate: string; // Placa
  model: string;
  brand: string; // Marca
  year: string;
  status: HealthStatus;
}

export interface Driver {
  id: string;
  name: string;
  registration: string; // Matrícula
  phone: string;
  role: string; // Função
}

export type ChecklistItemStatus = 'OK' | 'Atenção' | 'Crítico';

export interface ChecklistCategory {
  title: string;
  key: string;
  items: {
    id: string;
    label: string;
  }[];
}

export interface Checklist {
  id: string;
  date: string;
  time: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleName: string;
  vehicleType: VehicleType;
  items: Record<string, ChecklistItemStatus>;
  observations: string;
  photos: string[]; // array of base64 data URLs
  signature: string; // base64 data URL
  overallStatus: HealthStatus;
}

export type UserRole = 'motorista' | 'administrador';

export interface UserSession {
  username: string;
  role: UserRole;
  fullName: string;
}
