import React, { useState, useEffect } from 'react';
import {
  getVehicles,
  getDrivers,
  getChecklists,
  saveChecklists,
  recalculateVehicleStatuses,
  saveVehicles,
  saveDrivers,
  enableRemoteSync,
} from './utils/storage';
import { saveChecklistRemote, isRemoteAvailable as remoteAvailable } from './utils/backend';
import { Vehicle, Driver, Checklist, UserSession, UserRole } from './types';
import Dashboard from './components/Dashboard';
import FleetManagement from './components/FleetManagement';
import DriverManagement from './components/DriverManagement';
import ChecklistForm from './components/ChecklistForm';
import {
  Truck,
  Users,
  LayoutDashboard,
  ClipboardCheck,
  LogOut,
  Moon,
  Sun,
  Lock,
  User,
  Menu,
  X,
  FileSpreadsheet,
  AlertOctagon,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function App() {
  // Quick debug route: visit /__debug/env to see which VITE_FIREBASE_* were embedded at build time
  if (typeof window !== 'undefined' && window.location.pathname === '/__debug/env') {
    const env = {
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || null,
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || null,
      VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || null,
      VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || null,
      VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || null,
      VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || null,
    } as Record<string, string | null>;

    const mask = (v: string | null) => {
      if (!v) return 'null';
      if (v.length <= 8) return '***';
      return `${v.slice(0, 4)}...${v.slice(-4)}`;
    };

    return (
      <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <h2>Debug: VITE_FIREBASE_* (build-time)</h2>
        <p>These values are replaced at build time by Vite. If they are <strong>null</strong> here, the build didn't include them.</p>
        <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 800 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Variable</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Value (masked)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(env).map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: 8, borderBottom: '1px solid #f4f4f4' }}>{k}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f4f4f4', fontFamily: 'monospace' }}>{mask(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 12 }}>If any values are <strong>null</strong>, please confirm the environment variables are set in Vercel and trigger a full rebuild.</p>
      </div>
    );
  }
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_dark');
    return saved === 'true';
  });

  // Auth States
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('fleet_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Fleet collections state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  // Navigation states
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'fleet' | 'drivers'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);

  // Selected driver and vehicle states for the operator checklist
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => {
    return localStorage.getItem('fleet_active_driver_id') || '';
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    return localStorage.getItem('fleet_active_vehicle_id') || '';
  });

  // Keep state and localStorage in sync
  useEffect(() => {
    if (selectedDriverId) {
      localStorage.setItem('fleet_active_driver_id', selectedDriverId);
    } else {
      localStorage.removeItem('fleet_active_driver_id');
    }
  }, [selectedDriverId]);

  useEffect(() => {
    if (selectedVehicleId) {
      localStorage.setItem('fleet_active_vehicle_id', selectedVehicleId);
    } else {
      localStorage.removeItem('fleet_active_vehicle_id');
    }
  }, [selectedVehicleId]);

  // Load and sync database collections on startup
  useEffect(() => {
    const v = getVehicles();
    const d = getDrivers();
    const c = getChecklists();
    setVehicles(v);
    setDrivers(d);
    setChecklists(c);

    // Initial vehicle health update based on history
    recalculateVehicleStatuses();
    // Enable remote sync (if configured) so mobile submissions propagate
    try {
      const unsub = enableRemoteSync();
      console.log('[app] remoteAvailable:', remoteAvailable, 'VITE_FIREBASE_PROJECT_ID=', !!import.meta.env.VITE_FIREBASE_PROJECT_ID, 'VITE_FIREBASE_API_KEY=', !!import.meta.env.VITE_FIREBASE_API_KEY);
      // When remote updates mirror to localStorage, listen and update state
      const handler = () => {
        const updated = getChecklists();
        setChecklists(updated);
        recalculateVehicleStatuses();
      };
      window.addEventListener('fleet_checklists_updated', handler);
      return () => {
        window.removeEventListener('fleet_checklists_updated', handler);
        if (typeof unsub === 'function') unsub();
      };
    } catch (e) {
      // ignore if remote not configured
    }
  }, []);

  // Sync theme with DOM classes smoothly
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_dark', 'false');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const u = usernameInput.trim().toLowerCase();
    const p = passwordInput;

    if (u === 'motorista' && p === '12345') {
      const user: UserSession = {
        username: 'motorista',
        role: 'motorista',
        fullName: 'Carlos Silva (motorista)'
      };
      setSession(user);
      localStorage.setItem('fleet_session', JSON.stringify(user));
    } else if (u === 'administrador' && p === '12345') {
      const admin: UserSession = {
        username: 'administrador',
        role: 'administrador',
        fullName: 'Administrador Geral'
      };
      setSession(admin);
      localStorage.setItem('fleet_session', JSON.stringify(admin));
    } else {
      setAuthError('Usuário ou senha inválidos. Use as credenciais sugeridas.');
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('fleet_session');
    setSelectedDriverId('');
    setSelectedVehicleId('');
    localStorage.removeItem('fleet_active_driver_id');
    localStorage.removeItem('fleet_active_vehicle_id');
    setIsCreatingChecklist(false);
    setIsMobileMenuOpen(false);
  };

  // Callback after operator submits checklist sheet successfully
  const handleChecklistSubmit = (newChecklist: Checklist) => {
    // 1. Save new checkup to collection
    const updatedHistory = [newChecklist, ...checklists];
    setChecklists(updatedHistory);
    saveChecklists(updatedHistory);

    // Also attempt to persist remotely so other devices receive it
    try {
      if (remoteAvailable) saveChecklistRemote(newChecklist).catch(() => {});
    } catch (e) {
      // ignore remote errors
    }

    // 2. Refresh vehicle status
    const updatedVehicles = recalculateVehicleStatuses();
    setVehicles(updatedVehicles);

    // 3. Stop form view after brief success delay
    setTimeout(() => {
      setIsCreatingChecklist(false);
    }, 1200);
  };

  // Fleet mutation handlers
  const handleAddVehicle = (newV: Vehicle) => {
    const updated = [newV, ...vehicles];
    setVehicles(updated);
    saveVehicles(updated);
  };

  const handleUpdateVehicle = (editedV: Vehicle) => {
    const updated = vehicles.map(v => (v.id === editedV.id ? editedV : v));
    setVehicles(updated);
    saveVehicles(updated);
  };

  const handleDeleteVehicle = (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    setVehicles(updated);
    saveVehicles(updated);
  };

  // Driver mutation handlers
  const handleAddDriver = (newD: Driver) => {
    const updated = [newD, ...drivers];
    setDrivers(updated);
    saveDrivers(updated);
  };

  const handleUpdateDriver = (editedD: Driver) => {
    const updated = drivers.map(d => (d.id === editedD.id ? editedD : d));
    setDrivers(updated);
    saveDrivers(updated);
  };

  const handleDeleteDriver = (id: string) => {
    const updated = drivers.filter(d => d.id !== id);
    setDrivers(updated);
    saveDrivers(updated);
  };

  // Filter lists specifically for the current driver when logged in as operator
  const myChecklists = checklists.filter(c => c.driverId === selectedDriverId);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans transition-colors duration-200">
      
      {/* 1. NOT LOGGED IN VIEW -> Premium SaaS LoginForm */}
      {!session ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500/10 via-gray-100 to-gray-200 dark:from-emerald-950/20 dark:via-gray-950 dark:to-gray-910">
          <div className="absolute top-4 right-4 print:hidden">
            <button
              onClick={handleToggleTheme}
              className="p-2.5 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/55 transition hover:bg-gray-50 focus:outline-none"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
          </div>

          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-250/50 dark:border-gray-800/80 overflow-hidden transform transition duration-300">
            {/* Title banner */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-center space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Truck className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">AG Materiais de Construção</h2>
              <p className="text-xs text-emerald-100">Checklist de Frota &amp; Controle Operacional</p>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">Acesse sua Conta</h3>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-r-xl text-xs text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nome de Usuário</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <User className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Ex: motorista ou administrador"
                      className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl pl-9.5 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Senha de Acesso</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="•••••"
                      className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl pl-9.5 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-150 text-sm shadow hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
              >
                Entrar no Sistema
              </button>

              {/* DEMO PROFILE COMPANION CARDS (to permit ultra-fast testing clicking) */}
              <div className="border-t border-gray-150 dark:border-gray-800 pt-4 space-y-2">
                <p className="text-[10px] uppercase font-bold text-gray-400 text-center tracking-widest">Contas de Teste Rápido</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('motorista');
                      setPasswordInput('12345');
                    }}
                    className="p-2.5 bg-gray-50 hover:bg-emerald-55/40 dark:bg-gray-800/50 dark:hover:bg-emerald-950/20 border border-gray-200 dark:border-gray-700 rounded-xl text-left transition"
                  >
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Perfil Motorista</p>
                    <p className="text-[10px] text-gray-500">Usuário: motorista</p>
                    <p className="text-[10px] text-gray-400">Senha: 12345</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('administrador');
                      setPasswordInput('12345');
                    }}
                    className="p-2.5 bg-gray-50 hover:bg-emerald-55/40 dark:bg-gray-800/50 dark:hover:bg-emerald-950/20 border border-gray-200 dark:border-gray-700 rounded-xl text-left transition"
                  >
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Administrador</p>
                    <p className="text-[10px] text-gray-500">Usuário: administrador</p>
                    <p className="text-[10px] text-gray-400">Senha: 12345</p>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* 2. LOGGED IN SYSTEM WRAPPERS */
        <div className="flex h-screen overflow-hidden">
          
          {/* A. SIDEBAR NAVIGATION FOR ADMIN ROLE */}
          {session.role === 'administrador' && (
            <aside className="hidden lg:flex flex-col w-64 bg-gray-900 border-r border-gray-800 text-white h-full justify-between print:hidden">
              <div className="space-y-6">
                {/* Brand Banner */}
                <div className="p-5 border-b border-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-xl">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-xs uppercase tracking-wider text-white">AG Materiais</h2>
                    <p className="text-[9px] text-gray-400 font-semibold tracking-widest uppercase">de Construção</p>
                  </div>
                </div>

                {/* Tabs selection */}
                <nav className="px-3.5 space-y-1 text-left">
                  <button
                    onClick={() => setActiveAdminTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-bold rounded-xl transition ${
                      activeAdminTab === 'dashboard'
                        ? 'bg-green-600 text-white shadow'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Painel Principal / Relatórios
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('fleet')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-bold rounded-xl transition ${
                      activeAdminTab === 'fleet'
                        ? 'bg-green-600 text-white shadow'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    Gerar e Controlar Frota
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('drivers')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-bold rounded-xl transition ${
                      activeAdminTab === 'drivers'
                        ? 'bg-green-600 text-white shadow'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Gerenciar Motoristas
                  </button>
                </nav>
              </div>

              {/* Sidebar bottom drawer */}
              <div className="p-4 border-t border-gray-800 space-y-3 bg-gray-950/40 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white font-extrabold flex items-center justify-center text-xs">
                    AD
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold truncate text-white">{session.fullName}</p>
                    <p className="text-[10px] text-gray-400 truncate">Administrador</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 font-semibold py-2 px-3 hover:bg-red-950/20 rounded-xl transition mt-1 border border-transparent hover:border-red-950/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair do Painel
                </button>
              </div>
            </aside>
          )}

          {/* B. MAIN INTERFACE CONTENT BLOCK SCREEN */}
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Nav Header (Always visible for responsive actions) */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800/80 px-4 py-3 flex items-center justify-between print:hidden">
              
              {/* Left branding */}
              <div className="flex items-center gap-2.5">
                {session.role === 'administrador' && (
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  >
                    <Menu className="w-5 h-5 text-gray-700 dark:text-gray-350" />
                  </button>
                )}
                
                <div className="flex items-center gap-1.5 lg:hidden">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span className="font-extrabold text-sm tracking-tight text-gray-950 dark:text-white">AG Materiais</span>
                </div>

                {session.role === 'motorista' && (
                  <div className="hidden lg:flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    <span className="font-extrabold text-base tracking-tight text-gray-950 dark:text-white">AG Materiais de Construção — Portal do Motorista</span>
                  </div>
                )}
              </div>

              {/* Status information right-side */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-750 text-xs text-gray-500 font-medium">
                  <User className="w-3.5 h-3.5 text-green-600" />
                  Logado: <strong className="text-gray-700 dark:text-gray-300">
                    {session.role === 'motorista'
                      ? (drivers.find(d => d.id === selectedDriverId)?.name || 'Motorista (Não selecionado)')
                      : session.fullName}
                  </strong>
                </span>

                {session.role === 'motorista' && (
                  <button
                    onClick={handleLogout}
                    className="items-center gap-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-2 sm:px-3 text-xs font-bold rounded-xl hover:bg-red-100/80 transition"
                    title="Encerrar sessão"
                  >
                    <LogOut className="w-4 h-4 sm:hidden" />
                    <span className="hidden sm:inline">Encerrar Sessão</span>
                  </button>
                )}
              </div>
            </header>

            {/* C. PAGE BODY CONTAINER */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              
              {/* 2.A CLIENT AND MOBILE INSPECTOR (Creating/Viewing a checklist) */}
              {isCreatingChecklist ? (
                <ChecklistForm
                  driverName={
                    session.role === 'motorista'
                      ? (drivers.find(d => d.id === selectedDriverId)?.name || 'Motorista')
                      : 'Supervisor Administrador'
                  }
                  driverId={
                    session.role === 'motorista'
                      ? selectedDriverId
                      : 'd_admin'
                  }
                  vehicles={vehicles}
                  initialVehicleId={session.role === 'motorista' ? selectedVehicleId : undefined}
                  onSubmitSuccess={handleChecklistSubmit}
                  onCancel={() => setIsCreatingChecklist(false)}
                />
              ) : (
                /* 2.B CHOOSE IN BETWEEN MOTORISTA OR ADMINISTRADOR DASHBOARD VIEWS */
                <div>
                  {session.role === 'administrador' ? (
                    // Admin Tabs
                    activeAdminTab === 'dashboard' ? (
                      <Dashboard
                        checklists={checklists}
                        vehicles={vehicles}
                        drivers={drivers}
                        onAddChecklist={() => setIsCreatingChecklist(true)}
                        isDarkMode={isDarkMode}
                        onToggleTheme={handleToggleTheme}
                      />
                    ) : activeAdminTab === 'fleet' ? (
                      <FleetManagement
                        vehicles={vehicles}
                        onAddVehicle={handleAddVehicle}
                        onUpdateVehicle={handleUpdateVehicle}
                        onDeleteVehicle={handleDeleteVehicle}
                      />
                    ) : (
                      <DriverManagement
                        drivers={drivers}
                        onAddDriver={handleAddDriver}
                        onUpdateDriver={handleUpdateDriver}
                        onDeleteDriver={handleDeleteDriver}
                      />
                    )
                  ) : (
                    // DRIVER HOMEPAGE (Simplificada)
                    <div className="max-w-4xl mx-auto px-4 py-6 text-left space-y-6" id="driver_view">
                      
                      {/* Driver Greetings */}
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm text-left relative overflow-hidden">
                        {/* Background subtle green gradient */}
                        <div className="absolute top-0 right-0 h-48 w-48 bg-emerald-500/5 rounded-full transform translate-x-20 -translate-y-20 pointer-events-none" />

                        <div className="space-y-6">
                          <div className="space-y-1.5">
                            <p className="text-xs text-green-600 dark:text-green-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" /> Portal do Colaborador
                            </p>
                            <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white leading-tight animate-fade-in">
                              {selectedDriverId
                                ? `Olá, ${drivers.find(d => d.id === selectedDriverId)?.name}!`
                                : 'Olá, Motorista!'}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-0.5">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> {new Date().toLocaleDateString('pt-BR')}
                              </span>
                              {selectedDriverId && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    MATRÍCULA: {drivers.find(d => d.id === selectedDriverId)?.registration}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Selection controls for name and vehicle */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-150 dark:border-gray-800/80">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                Motorista / Operador <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={selectedDriverId}
                                onChange={(e) => setSelectedDriverId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 hover:border-gray-300 dark:hover:border-gray-600 transition"
                              >
                                <option value="">-- Selecione seu Nome --</option>
                                {drivers.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} ({d.role})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                Veículo / Equipamento do Turno <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={selectedVehicleId}
                                onChange={(e) => setSelectedVehicleId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 hover:border-gray-300 dark:hover:border-gray-600 transition"
                              >
                                <option value="">-- Selecione o Veículo --</option>
                                {vehicles.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name} ({v.licensePlate} - {v.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* New Checklist start trigger */}
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => setIsCreatingChecklist(true)}
                              disabled={!selectedDriverId || !selectedVehicleId}
                              className={`w-full sm:w-auto font-extrabold px-6 py-3.5 rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 ${
                                selectedDriverId && selectedVehicleId
                                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer hover:shadow-lg focus:ring-4 focus:ring-green-400/40'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none'
                              }`}
                            >
                              <ClipboardCheck className="w-5 h-5 flex-shrink-0" />
                              {selectedDriverId && selectedVehicleId
                                ? 'Iniciar Checklist Pré-Operacional'
                                : 'Selecione Nome e Veículo para Iniciar'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Driver submitted checkups log */}
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-center border-b pb-3 border-gray-150 dark:border-gray-800">
                          <h3 className="font-extrabold text-gray-950 dark:text-white text-base">Meus Checklists Enviados</h3>
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold px-2.5 py-0.5 rounded-full text-xs">
                            {myChecklists.length}
                          </span>
                        </div>

                        {myChecklists.length === 0 ? (
                          <div className="py-12 text-center text-gray-400 text-xs">
                            Você não enviou nenhum checklist hoje. Clique em "Novo Checklist" acima para começar.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-gray-800">
                            <table className="w-full border-collapse text-left text-xs sm:text-sm">
                              <thead>
                                <tr className="bg-gray-50 dark:bg-gray-850 text-gray-500 font-bold border-b border-gray-100 dark:border-gray-800">
                                  <th className="p-3">Data / Hora</th>
                                  <th className="p-3">Equipamento</th>
                                  <th className="p-3 text-center">Status</th>
                                  <th className="p-3">Observações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {myChecklists.map((c) => (
                                  <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                                    <td className="p-3 whitespace-nowrap font-bold text-gray-900 dark:text-gray-200">
                                      {new Date(c.date + 'T00:00:00').toLocaleDateString('pt-BR')} <span className="text-[10px] text-gray-400 block font-normal">{c.time}</span>
                                    </td>
                                    <td className="p-3 whitespace-nowrap font-bold text-gray-800 dark:text-gray-250">
                                      {c.vehicleName}
                                    </td>
                                    <td className="p-3 text-center whitespace-nowrap">
                                      {c.overallStatus === 'Crítico' ? (
                                        <span className="p-1 px-2.5 text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-950/20 rounded-full border border-red-200/50">
                                          🔴 Crítico
                                        </span>
                                      ) : c.overallStatus === 'Atenção' ? (
                                        <span className="p-1 px-2.5 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/20 rounded-full border border-amber-200/50">
                                          🟡 Atenção
                                        </span>
                                      ) : (
                                        <span className="p-1 px-2.5 text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-950/20 rounded-full border border-green-200/50">
                                          🟢 OK
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400 truncate max-w-xs">{c.observations || 'Nenhuma obs.'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* D. MOBILE SLIDEOUT DRAWER MENU FOR ADMIN */}
          {isMobileMenuOpen && session.role === 'administrador' && (
            <div className="fixed inset-0 z-50 overflow-hidden lg:hidden print:hidden">
              {/* overlay backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-gray-900 text-white flex flex-col justify-between shadow-2xl h-full animate-slide-right">
                <div className="space-y-6">
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-green-500" />
                      <span className="font-extrabold text-xs uppercase tracking-wider">AG Materiais de Construção</span>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <nav className="px-3.5 space-y-1.5 text-left">
                    <button
                      onClick={() => {
                        setActiveAdminTab('dashboard');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-bold rounded-xl transition ${
                        activeAdminTab === 'dashboard'
                          ? 'bg-green-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Painel Principal
                    </button>

                    <button
                      onClick={() => {
                        setActiveAdminTab('fleet');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-bold rounded-xl transition ${
                        activeAdminTab === 'fleet'
                          ? 'bg-green-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      Gerenciar Frota
                    </button>

                    <button
                      onClick={() => {
                        setActiveAdminTab('drivers');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-bold rounded-xl transition ${
                        activeAdminTab === 'drivers'
                          ? 'bg-green-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Gerenciar Motoristas
                    </button>
                  </nav>
                </div>

                <div className="p-4 border-t border-gray-800 space-y-4 bg-gray-950/40 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white font-extrabold flex items-center justify-center text-xs">
                      AD
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{session.fullName}</p>
                      <p className="text-[10px] text-gray-400">Supervisor Administrador</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 font-semibold py-2 px-3 hover:bg-red-950/20 rounded-xl transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Encerrar Sessão
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
