import { Vehicle, Driver, Checklist, ChecklistCategory, HealthStatus } from '../types';

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    title: 'Parte Mecânica',
    key: 'mecanica',
    items: [
      { id: 'motor', label: 'Motor' },
      { id: 'freios', label: 'Freios' },
      { id: 'direcao', label: 'Direção' },
      { id: 'embreagem', label: 'Embreagem' },
      { id: 'suspensao', label: 'Suspensão' },
      { id: 'vazamentos', label: 'Vazamentos' },
      { id: 'veiculo_engraxado', label: 'Veículo Engraxado? (Lubrificação)' },
    ],
  },
  {
    title: 'Pneus',
    key: 'pneus',
    items: [
      { id: 'estado_pneus', label: 'Estado dos pneus' },
      { id: 'calibragem', label: 'Calibragem' },
    ],
  },
  {
    title: 'Sistema Elétrico',
    key: 'eletrico',
    items: [
      { id: 'farol_esquerdo', label: 'Farol (Lado Esquerdo)' },
      { id: 'farol_direito', label: 'Farol (Lado Direito)' },
      { id: 'lanterna_esquerda', label: 'Lanterna (Lado Esquerdo)' },
      { id: 'lanterna_direita', label: 'Lanterna (Lado Direito)' },
      { id: 'setas', label: 'Setas' },
      { id: 'buzina', label: 'Buzina' },
      { id: 'bateria', label: 'Bateria' },
    ],
  },
  {
    title: 'Segurança',
    key: 'seguranca',
    items: [
      { id: 'extintor', label: 'Extintor' },
      { id: 'cinto', label: 'Cinto de segurança' },
      { id: 'retrovisores', label: 'Retrovisores' },
      { id: 'limpador', label: 'Limpador de para-brisa' },
      { id: 'alarme_re', label: 'Alarme de ré' },
    ],
  },
  {
    title: 'Cabine',
    key: 'cabine',
    items: [
      { id: 'banco', label: 'Banco do operador' },
      { id: 'painel', label: 'Painel' },
      { id: 'ar_condicionado', label: 'Ar-condicionado' },
    ],
  },
  {
    title: 'Implementos',
    key: 'implementos',
    items: [
      { id: 'cacamba', label: 'Caçamba' },
      { id: 'garfos', label: 'Garfos' },
      { id: 'bracos_hidraulicos', label: 'Braços hidráulicos' },
    ],
  },
];

const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', type: 'Caminhão', name: 'Volvo FH 460', licensePlate: '', model: 'FH 460', brand: 'Volvo', year: '', status: 'OK' },
  { id: 'v2', type: 'Caminhão', name: 'Mercedes 1720', licensePlate: '', model: '1720', brand: 'Mercedes-Benz', year: '', status: 'OK' },
  { id: 'v3', type: 'Caminhão', name: 'Mercedes 1113', licensePlate: '', model: '1113', brand: 'Mercedes-Benz', year: '', status: 'OK' },
  { id: 'v4', type: 'Caminhão', name: 'Mercedes 608', licensePlate: '', model: '608', brand: 'Mercedes-Benz', year: '', status: 'OK' },
  { id: 'v5', type: 'Caminhão', name: 'Volkswagen 6-90', licensePlate: '', model: '6-90', brand: 'Volkswagen', year: '', status: 'OK' },
  { id: 'v6', type: 'Outro', name: 'Fiat Strada', licensePlate: '', model: 'Strada', brand: 'Fiat', year: '', status: 'OK' },
  { id: 'v7', type: 'Empilhadeira', name: 'Empilhadeira Forza 2.5T', licensePlate: '', model: '2.5T', brand: 'Forza', year: '', status: 'OK' },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Édson Lacerda', registration: '', phone: '', role: '' },
  { id: 'd2', name: 'Alessandro Antunes', registration: '', phone: '', role: '' },
  { id: 'd3', name: 'Wagner', registration: '', phone: '', role: '' },
  { id: 'd4', name: 'Adriano', registration: '', phone: '', role: '' },
];

// Helper to get formatted date relative to today (YYYY-MM-DD)
const getRelativeDateString = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return d.toISOString().split('T')[0];
};

// Start with no pre-existing checklists after clearing drivers
const INITIAL_CHECKLISTS: Checklist[] = [];

// Local Storage Hooks
export const getVehicles = (): Vehicle[] => {
  // Always reset to the canonical initial vehicles so all visitors see the same fleet
  localStorage.setItem('fleet_vehicles', JSON.stringify(INITIAL_VEHICLES));
  return INITIAL_VEHICLES;
};

export const saveVehicles = (vehicles: Vehicle[]) => {
  localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
};

export const getDrivers = (): Driver[] => {
  // Always reset to the canonical initial drivers so all visitors see the same list
  localStorage.setItem('fleet_drivers', JSON.stringify(INITIAL_DRIVERS));
  return INITIAL_DRIVERS;
};

export const saveDrivers = (drivers: Driver[]) => {
  localStorage.setItem('fleet_drivers', JSON.stringify(drivers));
};

export const getChecklists = (): Checklist[] => {
  // Reset checklists to the canonical initial set (currently empty) so there are no stale refs
  localStorage.setItem('fleet_checklists', JSON.stringify(INITIAL_CHECKLISTS));
  return INITIAL_CHECKLISTS;
};

export const saveChecklists = (checklists: Checklist[]) => {
  localStorage.setItem('fleet_checklists', JSON.stringify(checklists));
};

/**
 * Calculates and updates fleet vehicle statuses based on the last checklist submitted for each vehicle.
 * Ensures the visual indicators synchronize perfectly.
 */
export const recalculateVehicleStatuses = () => {
  const vehicles = getVehicles();
  const checklists = getChecklists();

  // Sort checklists descending by date and time
  const sortedChecklists = [...checklists].sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time}`;
    const dateTimeB = `${b.date}T${b.time}`;
    return dateTimeB.localeCompare(dateTimeA);
  });

  const updatedVehicles = vehicles.map(vehicle => {
    // Find the latest checklist for this vehicle
    const latest = sortedChecklists.find(c => c.vehicleId === vehicle.id);
    if (latest) {
      return {
        ...vehicle,
        status: latest.overallStatus
      };
    }
    return vehicle;
  });

  saveVehicles(updatedVehicles);
  return updatedVehicles;
};
