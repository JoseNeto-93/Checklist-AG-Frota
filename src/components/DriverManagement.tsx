import React, { useState } from 'react';
import { Driver } from '../types';
import { Search, Plus, Edit2, Trash2, X, Users, Phone, ShieldAlert } from 'lucide-react';

interface DriverManagementProps {
  drivers: Driver[];
  onAddDriver: (driver: Driver) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

export default function DriverManagement({
  drivers,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
}: DriverManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Roster form states (Add or Edit modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Custom Delete confirmation state
  const [driverToDelete, setDriverToDelete] = useState<{ id: string; name: string } | null>(null);

  const [formName, setFormName] = useState('');
  const [formRegistration, setFormRegistration] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormName('');
    setFormRegistration('');
    setFormPhone('');
    setFormRole('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setFormName(d.name);
    setFormRegistration(d.registration);
    setFormPhone(d.phone);
    setFormRole(d.role);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formRegistration || !formPhone || !formRole) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (editingDriver) {
      const updated: Driver = {
        ...editingDriver,
        name: formName,
        registration: formRegistration,
        phone: formPhone,
        role: formRole,
      };
      onUpdateDriver(updated);
    } else {
      const brandNew: Driver = {
        id: 'drv_' + Date.now(),
        name: formName,
        registration: formRegistration,
        phone: formPhone,
        role: formRole,
      };
      onAddDriver(brandNew);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDriverToDelete({ id, name });
  };

  const filteredDrivers = drivers.filter(d => {
    return (
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12" id="driver_management_view">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white leading-tight">Gestão de Motoristas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Controle a equipe de operadores de máquinas pesadas e motoristas habilitados.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Cadastrar Motorista
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
            placeholder="Pesquisar por nome, matrícula, função..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          />
        </div>

        <div className="text-gray-400 text-xs font-semibold flex items-center gap-1">
          <Users className="w-4 h-4 text-green-600" />
          <span>Total cadastrados: {drivers.length}</span>
        </div>
      </div>

      {/* Operator cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDrivers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm">
            Nenhum motorista localizado com as palavras pesquisadas.
          </div>
        ) : (
          filteredDrivers.map(d => (
            <div
              key={d.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Profile Card Header */}
              <div className="p-5 text-left space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 flex items-center justify-center font-extrabold text-base border dark:border-green-800/45">
                    {d.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-950 dark:text-white text-base leading-tight">{d.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{d.role}</p>
                  </div>
                </div>

                {/* Technical fields */}
                <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Matrícula:</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-350">{d.registration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Contato:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-350 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-green-600" />
                      {d.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-850/50 flex justify-end gap-2.5">
                <button
                  onClick={() => handleOpenEdit(d)}
                  className="p-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(d.id, d.name)}
                  className="p-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-450 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-850/30">
              <h3 className="text-base font-extrabold text-gray-950 dark:text-white">
                {editingDriver ? 'Editar Motorista' : 'Cadastrar Novo Motorista/Operador'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4 text-left font-sans">
                {errorMsg && (
                  <p className="text-xs text-red-650 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl">
                    ⚠️ {errorMsg}
                  </p>
                )}

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: João da Silva Reis"
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Matrícula Funcional <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formRegistration}
                      onChange={(e) => setFormRegistration(e.target.value)}
                      placeholder="Ex: MTR-9003"
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Telefone de Contato <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="Ex: (11) 98888-7777"
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Função na Operação <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      placeholder="Ex: Motorista de Caminhão, Operador de Munck..."
                      className="w-full bg-white dark:bg-gray-805 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Form Footer Actions */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-55 dark:bg-gray-850 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-350 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition"
                >
                  {editingDriver ? 'Salvar Edição' : 'Cadastrar Motorista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION OVERLAY */}
      {driverToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-105 dark:bg-red-950/40 text-red-600 dark:text-red-450 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-950 dark:text-white-900">
                Remover Motorista/Operador?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tem certeza de que deseja remover o motorista/operador <strong className="font-bold text-gray-800 dark:text-gray-200">"{driverToDelete.name}"</strong> do sistema? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDriverToDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-250 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDriver(driverToDelete.id);
                  setDriverToDelete(null);
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
