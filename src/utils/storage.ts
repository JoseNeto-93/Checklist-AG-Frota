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
  { id: 'v1', type: 'Caminhão', name: 'Caminhão 01', licensePlate: 'ABC-1234', model: 'Constellation', brand: 'Volkswagen', year: '2020', status: 'OK' },
  { id: 'v2', type: 'Caminhão', name: 'Caminhão 02', licensePlate: 'DEF-5678', model: 'FH 540', brand: 'Volvo', year: '2022', status: 'OK' },
  { id: 'v3', type: 'Caminhão', name: 'Caminhão 03', licensePlate: 'GHI-9012', model: 'Actros', brand: 'Mercedes-Benz', year: '2021', status: 'OK' },
  { id: 'v4', type: 'Pá Carregadeira', name: 'Pá Carregadeira CAT 938', licensePlate: 'MCH-0001', model: '938K', brand: 'Caterpillar', year: '2019', status: 'Atenção' },
  { id: 'v5', type: 'Escavadeira', name: 'Escavadeira CAT 320', licensePlate: 'MCH-0002', model: '320 GX', brand: 'Caterpillar', year: '2021', status: 'OK' },
  { id: 'v6', type: 'Trator', name: 'Trator John Deere', licensePlate: 'MCH-0003', model: '6115J', brand: 'John Deere', year: '2020', status: 'Crítico' },
  { id: 'v7', type: 'Retroescavadeira', name: 'Retroescavadeira Case 580N', licensePlate: 'MCH-0004', model: '580N', brand: 'Case', year: '2018', status: 'OK' },
  { id: 'v8', type: 'Empilhadeira', name: 'Empilhadeira Toyota', licensePlate: 'MCH-0005', model: '8FGU25', brand: 'Toyota', year: '2022', status: 'OK' },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Carlos Silva (motorista)', registration: 'MTR-1004', phone: '(11) 98765-4321', role: 'Motorista de Caminhão' },
  { id: 'd2', name: 'José Oliveira', registration: 'OPR-2005', phone: '(11) 97654-3210', role: 'Operador de Escavadeira' },
  { id: 'd3', name: 'Marcos Souza', registration: 'OPR-3008', phone: '(11) 96543-2109', role: 'Operador de Pá Carregadeira' },
  { id: 'd4', name: 'Roberto Santos', registration: 'MTR-1008', phone: '(11) 95432-1098', role: 'Motorista de Caçamba' },
];

// Helper to get formatted date relative to today (YYYY-MM-DD)
const getRelativeDateString = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return d.toISOString().split('T')[0];
};

const INITIAL_CHECKLISTS: Checklist[] = [
  {
    id: 'c1',
    date: getRelativeDateString(2),
    time: '07:15',
    driverId: 'd1',
    driverName: 'Carlos Silva (motorista)',
    vehicleId: 'v1',
    vehicleName: 'Caminhão 01',
    vehicleType: 'Caminhão',
    items: {
      motor: 'OK', freios: 'OK', direcao: 'OK', embreagem: 'OK', suspensao: 'OK', vazamentos: 'OK', veiculo_engraxado: 'OK',
      estado_pneus: 'OK', calibragem: 'OK',
      farol_esquerdo: 'OK', farol_direito: 'OK', lanterna_esquerda: 'OK', lanterna_direita: 'OK', setas: 'OK', buzina: 'OK', bateria: 'OK',
      extintor: 'OK', cinto: 'OK', retrovisores: 'OK', limpador: 'OK', alarme_re: 'OK',
      banco: 'OK', painel: 'OK', ar_condicionado: 'OK',
      cacamba: 'OK', garfos: 'OK', bracos_hidraulicos: 'OK'
    },
    observations: 'Tudo em perfeitas condições para início do turno. Engraxamento em dia.',
    photos: [],
    signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><text x="10" y="20" font-family="cursive" font-size="12">Carlos S.</text></svg>',
    overallStatus: 'OK'
  },
  {
    id: 'c2',
    date: getRelativeDateString(1),
    time: '08:05',
    driverId: 'd2',
    driverName: 'José Oliveira',
    vehicleId: 'v4',
    vehicleName: 'Pá Carregadeira CAT 938',
    vehicleType: 'Pá Carregadeira',
    items: {
      motor: 'OK', freios: 'OK', direcao: 'OK', embreagem: 'OK', suspensao: 'OK', vazamentos: 'Atenção', veiculo_engraxado: 'OK',
      estado_pneus: 'OK', calibragem: 'OK',
      farol_esquerdo: 'OK', farol_direito: 'OK', lanterna_esquerda: 'OK', lanterna_direita: 'OK', setas: 'OK', buzina: 'OK', bateria: 'OK',
      extintor: 'OK', cinto: 'OK', retrovisores: 'OK', limpador: 'Atenção', alarme_re: 'OK',
      banco: 'OK', painel: 'OK', ar_condicionado: 'OK',
      cacamba: 'OK', garfos: 'OK', bracos_hidraulicos: 'OK'
    },
    observations: 'Leve umidade de óleo próximo à mangueira hidráulica. Limpador dianteiro ruidoso.',
    photos: [],
    signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><text x="10" y="20" font-family="cursive" font-size="12">Jose O.</text></svg>',
    overallStatus: 'Atenção'
  },
  {
    id: 'c3',
    date: getRelativeDateString(0),
    time: '06:40',
    driverId: 'd3',
    driverName: 'Marcos Souza',
    vehicleId: 'v6',
    vehicleName: 'Trator John Deere',
    vehicleType: 'Trator',
    items: {
      motor: 'Crítico', freios: 'OK', direcao: 'Atenção', embreagem: 'OK', suspensao: 'OK', vazamentos: 'Crítico', veiculo_engraxado: 'Atenção',
      estado_pneus: 'OK', calibragem: 'OK',
      farol_esquerdo: 'OK', farol_direito: 'OK', lanterna_esquerda: 'OK', lanterna_direita: 'OK', setas: 'OK', buzina: 'OK', bateria: 'OK',
      extintor: 'OK', cinto: 'OK', retrovisores: 'OK', limpador: 'OK', alarme_re: 'OK',
      banco: 'OK', painel: 'OK', ar_condicionado: 'OK',
      cacamba: 'OK', garfos: 'OK', bracos_hidraulicos: 'OK'
    },
    observations: 'Vazamento pesado de óleo sob o motor. Ruído forte de batida metálica ao ligar. Veículo não foi engraxado hoje.',
    photos: [],
    signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><text x="10" y="20" font-family="cursive" font-size="12">Marcos S.</text></svg>',
    overallStatus: 'Crítico'
  }
];

// Local Storage Hooks
export const getVehicles = (): Vehicle[] => {
  const data = localStorage.getItem('fleet_vehicles');
  if (!data) {
    localStorage.setItem('fleet_vehicles', JSON.stringify(INITIAL_VEHICLES));
    return INITIAL_VEHICLES;
  }
  return JSON.parse(data);
};

export const saveVehicles = (vehicles: Vehicle[]) => {
  localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
};

export const getDrivers = (): Driver[] => {
  const data = localStorage.getItem('fleet_drivers');
  if (!data) {
    localStorage.setItem('fleet_drivers', JSON.stringify(INITIAL_DRIVERS));
    return INITIAL_DRIVERS;
  }
  return JSON.parse(data);
};

export const saveDrivers = (drivers: Driver[]) => {
  localStorage.setItem('fleet_drivers', JSON.stringify(drivers));
};

export const getChecklists = (): Checklist[] => {
  const data = localStorage.getItem('fleet_checklists');
  if (!data) {
    localStorage.setItem('fleet_checklists', JSON.stringify(INITIAL_CHECKLISTS));
    return INITIAL_CHECKLISTS;
  }
  return JSON.parse(data);
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
