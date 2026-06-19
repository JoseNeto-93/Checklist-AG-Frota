import React, { useState } from 'react';
import { Vehicle, VehicleType, HealthStatus } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

interface FleetManagementProps {
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
}

export default function FleetManagement({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}: FleetManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Form states (Add or Edit modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Custom Delete confirmation state
  const [vehicleToDelete, setVehicleToDelete] = useState<{ id: string; name: string } | null>(null);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<VehicleType>('Caminhão');
  const [formPlate, setFormPlate] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formStatus, setFormStatus] = useState<HealthStatus>('OK');

  const [errorMsg, setErrorMsg] = useState('');

  // Open modal for adding a new equipment
  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormName('');
    setFormType('Caminhão');
    setFormPlate('');
    setFormModel('');
    setFormBrand('');
    setFormYear('');
    setFormStatus('OK');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open modal for editing a vehicle
  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormName(v.name);
    setFormType(v.type);
    setFormPlate(v.licensePlate);
    setFormModel(v.model);
    setFormBrand(v.brand);
    setFormYear(v.year);
    setFormStatus(v.status);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formPlate || !formModel || !formBrand || !formYear) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (editingVehicle) {
      // update
      const updated: Vehicle = {
        ...editingVehicle,
        name: formName,
        type: formType,
        licensePlate: formPlate,
        model: formModel,
        brand: formBrand,
        year: formYear,
        status: formStatus,
      };
      onUpdateVehicle(updated);
    } else {
      // create
      const brandNew: Vehicle = {
        id: 'veh_' + Date.now(),
        name: formName,
        type: formType,
        licensePlate: formPlate,
        model: formModel,
        brand: formBrand,
        year: formYear,
        status: formStatus,
      };
      onAddVehicle(brandNew);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setVehicleToDelete({ id, name });
  };

  // Filter lists
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType ? v.type === filterType : true;
    const matchesStatus = filterStatus ? v.status === filterStatus : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12" id="fleet_management_view">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white leading-tight">Gestão da Frota</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Cadastre, edite e acompanhe os caminhões e máquinas pesadas operando na empresa.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Cadastrar Equipamento
        </button>
      </div>

      {/* Query Filter row */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome, placa, modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          />
        </div>

        {/* Categories togglers */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="">Todos os Tipos</option>
              <option value="Caminhão">Caminhões</option>
              <option value="Pá Carregadeira">Pá Carregadeiras</option>
              <option value="Escavadeira">Escavadeiras</option>
              <option value="Trator">Tratores</option>
              <option value="Retroescavadeira">Retroescavadeiras</option>
              <option value="Empilhadeira">Empilhadeiras</option>
              <option value="Outro">Outros</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="">Qualquer Status</option>
              <option value="OK">🟢 Operacional</option>
              <option value="Atenção">🟡 Atenção</option>
              <option value="Crítico">🔴 Crítico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm">
            Nenhum equipamento localizado sob os filtros estabelecidos.
          </div>
        ) : (
          filteredVehicles.map((v) => {
            return (
              <div
                key={v.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow relative flex flex-col justify-between"
              >
                {/* Visual Status strip header */}
                <div
                  className={`h-1.5 w-full ${
                    v.status === 'Crítico'
                      ? 'bg-red-500'
                      : v.status === 'Atenção'
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                  }`}
                />

                {/* Card Body */}
                <div className="p-4 flex-1 text-left space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{v.type}</p>
                      <h3 className="text-base font-extrabold text-gray-950 dark:text-white mb-0.5 line-clamp-1">{v.name}</h3>
                    </div>

                    {v.status === 'Crítico' ? (
                      <span className="p-1 px-2 text-[9px] font-bold text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-400 rounded-md flex items-center gap-0.5 animate-pulse">
                        <Flame className="w-3 h-3" /> CRÍTICO
                      </span>
                    ) : v.status === 'Atenção' ? (
                      <span className="p-1 px-2 text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 rounded-md flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> ATENÇÃO
                      </span>
                    ) : (
                      <span className="p-1 px-2 text-[9px] font-bold text-green-700 bg-green-100 dark:bg-green-950 dark:text-green-400 rounded-md flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> OK
                      </span>
                    )}
                  </div>

                  {/* Machine Specifications */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-1.5 text-xs bg-gray-50 dark:bg-gray-850 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                    <div>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Marca</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{v.brand}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Modelo</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{v.model}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Placa</p>
                      <p className="font-mono font-bold text-gray-800 dark:text-gray-200 truncate">{v.licensePlate}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Ano Fab.</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{v.year}</p>
                    </div>
                  </div>
                </div>

                {/* Edit & Remove Footers */}
                <div className="border-t border-gray-100 dark:border-gray-800/80 p-3 bg-gray-50/50 dark:bg-gray-850/50 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition"
                    title="Editar especificações"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id, v.name)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-lg transition"
                    title="Remover veículo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-850/30">
              <h3 className="text-base font-extrabold text-gray-950 dark:text-white">
                {editingVehicle ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4 text-left">
                {errorMsg && (
                  <p className="text-xs text-red-650 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl">
                    ⚠️ {errorMsg}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Nome de Identificação <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Pá Carregadeira CAT 938 ou Caminhão 04"
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Tipo de Equipamento
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as VehicleType)}
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm"
                    >
                      <option value="Caminhão">Caminhão</option>
                      <option value="Pá Carregadeira">Pá Carregadeira</option>
                      <option value="Escavadeira">Escavadeira</option>
                      <option value="Trator">Trator</option>
                      <option value="Retroescavadeira">Retroescavadeira</option>
                      <option value="Empilhadeira">Empilhadeira</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Placa / Código Identificador <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formPlate}
                      onChange={(e) => setFormPlate(e.target.value)}
                      placeholder="Ex: ABC-1234 ou MCH-0010"
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="Ex: Caterpillar, Scania, Case"
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Modelo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="Ex: FH 540, 580N, L-120"
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Ano de Fabricação <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      placeholder="Ex: 2021"
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Status de Saúde
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as HealthStatus)}
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm"
                    >
                      <option value="OK">🟢 OK (Operacional)</option>
                      <option value="Atenção">🟡 Atenção</option>
                      <option value="Crítico">🔴 Crítico</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Footer Actions */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-55 dark:bg-gray-850 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition"
                >
                  {editingVehicle ? 'Atualizar Dados' : 'Cadastrar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION OVERLAY */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-105 dark:bg-red-950/40 text-red-600 dark:text-red-450 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-950 dark:text-white-900">
                Remover Equipamento?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tem certeza de que deseja remover o equipamento <strong className="font-bold text-gray-800 dark:text-gray-200">"{vehicleToDelete.name}"</strong> da frota? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-250 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteVehicle(vehicleToDelete.id);
                  setVehicleToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
