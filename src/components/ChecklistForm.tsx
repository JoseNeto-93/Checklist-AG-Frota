import React, { useState } from 'react';
import { CHECKLIST_CATEGORIES } from '../utils/storage';
import { Vehicle, VehicleType, Checklist, ChecklistItemStatus, HealthStatus } from '../types';
import SignatureCanvas from './SignatureCanvas';
import { Camera, Image as ImageIcon, Send, ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, Trash } from 'lucide-react';

interface ChecklistFormProps {
  driverName: string;
  driverId: string;
  vehicles: Vehicle[];
  initialVehicleId?: string;
  onSubmitSuccess: (newChecklist: Checklist) => void;
  onCancel: () => void;
}

export default function ChecklistForm({ driverName, driverId, vehicles, initialVehicleId = '', onSubmitSuccess, onCancel }: ChecklistFormProps) {
  const initialVehicle = vehicles.find(v => v.id === initialVehicleId);
  const [selectedType, setSelectedType] = useState<VehicleType | ''>(initialVehicle ? initialVehicle.type : '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);
  const [itemsStatus, setItemsStatus] = useState<Record<string, ChecklistItemStatus>>({});
  const [observations, setObservations] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Filter vehicles depending on the active type chosen
  const filteredVehicles = vehicles.filter(v => v.type === selectedType);

  // Initialize all items in categories to 'OK' by default to simplify filling it in
  const initializeAllOk = () => {
    const initial: Record<string, ChecklistItemStatus> = {};
    CHECKLIST_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        initial[item.id] = 'OK';
      });
    });
    setItemsStatus(initial);
  };

  React.useEffect(() => {
    initializeAllOk();
  }, [selectedType]);

  const handleStatusChange = (itemId: string, status: ChecklistItemStatus) => {
    setItemsStatus(prev => ({
      ...prev,
      [itemId]: status,
    }));
  };

  // Convert files to base64 to store or display locally
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + files.length > 5) {
      alert('Você pode anexar no máximo 5 fotos por checklist.');
      return;
    }

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Count items by status currently selected
  const criticalCount = Object.values(itemsStatus).filter(s => s === 'Crítico').length;
  const attentionCount = Object.values(itemsStatus).filter(s => s === 'Atenção').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!selectedType) newErrors.push('Selecione o tipo de equipamento.');
    if (!selectedVehicleId) newErrors.push('Selecione um veículo cadastrado.');
    if (!signature) newErrors.push('A assinatura digital do operador é obrigatória.');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      // scroll to top of errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);

    // Determine overall fleet checklist health
    let overallStatus: HealthStatus = 'OK';
    if (criticalCount > 0) {
      overallStatus = 'Crítico';
    } else if (attentionCount > 0) {
      overallStatus = 'Atenção';
    }

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)!;

    const newChecklist: Checklist = {
      id: 'chk_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      driverId,
      driverName,
      vehicleId: selectedVehicleId,
      vehicleName: selectedVehicle.name,
      vehicleType: selectedType as VehicleType,
      items: itemsStatus,
      observations,
      photos,
      signature,
      overallStatus,
    };

    setSubmitted(true);
    // Let animation or modal show up, then propagate
    setTimeout(() => {
      onSubmitSuccess(newChecklist);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" id="checklist_form_view">
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-fade-in">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-full text-green-600 dark:text-green-400 animate-bounce">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Checklist Enviado!</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-sm">
            O checklist para o veículo <span className="font-semibold">{vehicles.find(v => v.id === selectedVehicleId)?.name}</span> foi processado e salvo com sucesso.
          </p>
          {criticalCount > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Itens críticos detectados. Manutenção e supervisores alertados.</span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 border-gray-200 dark:border-gray-800">
            <div>
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors mb-1"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Checklist Pré-Operacional</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Motorista: <span className="font-semibold text-gray-700 dark:text-gray-300">{driverName}</span> | {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Validation Alert */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/25 border-l-4 border-red-500 rounded-r-xl space-y-1">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-400 font-semibold text-sm">
                <AlertCircle className="w-4.5 h-4.5" />
                <span>Por favor, corrija os erros para continuar:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-0.5 ml-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Equipment Selector */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">1</span>
              Seleção do Equipamento
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Tipo de Equipamento <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value as VehicleType);
                    setSelectedVehicleId('');
                  }}
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  required
                >
                  <option value="">-- Selecione o Tipo --</option>
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
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Veículo Cadastrado <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={!selectedType}
                  required
                >
                  <option value="">
                    {!selectedType ? 'Selecione o Tipo primeiro' : '-- Selecione o Veículo --'}
                  </option>
                  {filteredVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.licensePlate})
                    </option>
                  ))}
                </select>
                {selectedType && filteredVehicles.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">Nenhum veículo cadastrado para este tipo.</p>
                )}
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          {selectedType && selectedVehicleId && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">2</span>
                    Avaliação dos Itens
                  </h2>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span> OK
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Atenção
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span> Crítico
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  Todos os itens foram automaticamente sinalizados como <strong className="text-green-600 dark:text-green-400">OK</strong> para preenchimento rápido. Altere o status de qualquer item que apresente desvios ou riscos operacionais.
                </p>

                <div className="space-y-6">
                  {CHECKLIST_CATEGORIES.map(category => {
                    // Check if category is "Implementos" and the equipment lacks attachments.
                    // For example, forklift forks or buckets depend on types, but we show them or let operators mark them.
                    return (
                      <div key={category.key} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 dark:bg-gray-850 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                            {category.title}
                          </h3>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                          {category.items.map(item => {
                            const currentStatus = itemsStatus[item.id] || 'OK';

                            return (
                              <div
                                key={item.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2 transition-colors ${
                                  currentStatus === 'Crítico'
                                    ? 'bg-rose-50/20 dark:bg-rose-950/10'
                                    : currentStatus === 'Atenção'
                                    ? 'bg-amber-50/20 dark:bg-amber-950/10'
                                    : ''
                                }`}
                              >
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {item.label}
                                </span>

                                {/* Evaluation segment buttons (OK/Atenção/Crítico) */}
                                {item.id === 'veiculo_engraxado' ? (
                                  <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg w-fit">
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(item.id, 'OK')}
                                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        currentStatus === 'OK'
                                          ? 'bg-green-600 text-white shadow-sm'
                                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                      }`}
                                    >
                                      Sim
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(item.id, 'Atenção')}
                                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        currentStatus === 'Atenção'
                                          ? 'bg-amber-500 text-white shadow-sm'
                                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-200'
                                      }`}
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg w-fit">
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(item.id, 'OK')}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        currentStatus === 'OK'
                                          ? 'bg-green-600 text-white shadow-sm'
                                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                      }`}
                                    >
                                      OK
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(item.id, 'Atenção')}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        currentStatus === 'Atenção'
                                          ? 'bg-amber-500 text-white shadow-sm'
                                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-200'
                                      }`}
                                    >
                                      Atenção
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(item.id, 'Crítico')}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        currentStatus === 'Crítico'
                                          ? 'bg-red-600 text-white shadow-sm'
                                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-200'
                                      }`}
                                    >
                                      Crítico
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photos & Notes & Signature */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">3</span>
                  Registros e Assinatura
                </h2>

                {/* Photo attachment slots */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Registro Fotográfico <span className="text-gray-400 font-normal">(Opcional, até 5 fotos)</span>
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-video sm:aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-700">
                        <img referrerPolicy="no-referrer" src={photo} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {photos.length < 5 && (
                      <label className="flex flex-col items-center justify-center aspect-video sm:aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-green-500 cursor-pointer bg-gray-50/50 hover:bg-gray-50 dark:bg-gray-800/30 dark:hover:bg-gray-800 transition">
                        <Camera className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Adicionar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          capture="environment"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Observações / Comentários
                  </label>
                  <textarea
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Ex: Pequeno vazamento de óleo hidráulico ou lâmpada da lanterna traseira queimada..."
                    className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
                  />
                </div>

                {/* Digital Signature Canvas */}
                <SignatureCanvas
                  onSave={(dataUrl) => setSignature(dataUrl)}
                  onClear={() => setSignature('')}
                />
              </div>

              {/* Submit panel summary */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-white">Resumo dos status de segurança:</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {criticalCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 bg-red-100/60 dark:bg-red-950/40 px-2 py-1 rounded-md font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> {criticalCount} Item(ns) Crítico(s) detectado(s)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-100/60 dark:bg-green-950/40 px-2 py-1 rounded-md font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sem alertas graves
                      </span>
                    )}

                    {attentionCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 px-2 py-1 rounded-md font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> {attentionCount} Atenção requerida
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full md:w-auto px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all text-sm shadow-sm"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all text-sm shadow-md hover:shadow-lg focus:ring-4 focus:ring-green-400/40"
                  >
                    <Send className="w-4 h-4" /> Enviar Checklist
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
