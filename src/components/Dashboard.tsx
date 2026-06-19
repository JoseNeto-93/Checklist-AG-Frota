import React, { useState, useMemo } from 'react';
import { Checklist, Vehicle, Driver, HealthStatus } from '../types';
import { CHECKLIST_CATEGORIES } from '../utils/storage';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Gauge,
  Filter,
  Download,
  Calendar,
  X,
  Search,
  Eye,
  Plus,
  Moon,
  Sun,
  Truck,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  checklists: Checklist[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onAddChecklist: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function Dashboard({
  checklists,
  vehicles,
  drivers,
  onAddChecklist,
  isDarkMode,
  onToggleTheme
}: DashboardProps) {
  // Filter States
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [filterVehicle, setFilterVehicle] = useState<string>('');
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Selected Checklist for Detailed Visual Modal
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);

  // 1. Filtered checklist dataset
  const filteredChecklists = useMemo(() => {
    return checklists.filter(item => {
      if (dateStart && item.date < dateStart) return false;
      if (dateEnd && item.date > dateEnd) return false;
      if (filterVehicle && item.vehicleId !== filterVehicle) return false;
      if (filterDriver && item.driverId !== filterDriver) return false;
      if (filterStatus && item.overallStatus !== filterStatus) return false;
      return true;
    });
  }, [checklists, dateStart, dateEnd, filterVehicle, filterDriver, filterStatus]);

  // 2. Compute dynamic KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const checklistsToday = checklists.filter(c => c.date === today);

    // Count vehicles actively registered
    const totalVehicles = vehicles.length;

    // Count how many equipment items currently show issues ('Crítico' or 'Atenção')
    const vehiclesWithProblems = vehicles.filter(v => v.status === 'Crítico' || v.status === 'Atenção').length;

    // Critical list submitted today
    let criticalToday = 0;
    checklistsToday.forEach(c => {
      if (c.overallStatus === 'Crítico') {
        criticalToday++;
      }
    });

    return {
      totalVehicles,
      checklistsToday: checklistsToday.length,
      criticalToday,
      vehiclesWithProblems,
      activeDrivers: drivers.length
    };
  }, [checklists, vehicles, drivers]);

  // 3. Overall visual gauge for Fleet Health (🟢 Operacional, 🟡 Atenção, 🔴 Crítico)
  const fleetHealth = useMemo(() => {
    const criticals = vehicles.filter(v => v.status === 'Crítico').length;
    const attentions = vehicles.filter(v => v.status === 'Atenção').length;

    if (criticals > 0) {
      return {
        label: 'Crítico',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-900',
        dot: 'bg-red-500',
        summary: 'Atenção: A frota possui veículos em estado crítico e necessita de manutenção imediata.'
      };
    } else if (attentions > 0) {
      return {
        label: 'Atenção',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
        dot: 'bg-amber-500',
        summary: 'Observação: Existem veículos operando com itens sob estado de atenção.'
      };
    }
    return {
      label: 'Operacional',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-950/40 border-green-200 dark:border-green-900',
      dot: 'bg-green-500',
      summary: 'Frota segura: Todos os equipamentos inspecionados estão operando regularmente.'
    };
  }, [vehicles]);

  // 4. CHART DATA GENERATORS
  // A. Checklists per day (last 7 days containing checklist reports)
  const chartChecklistsPerDay = useMemo(() => {
    const datesMap: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(day => {
      datesMap[day] = 0;
    });

    checklists.forEach(c => {
      if (datesMap[c.date] !== undefined) {
        datesMap[c.date]++;
      }
    });

    return Object.entries(datesMap).map(([date, count]) => {
      const [, month, day] = date.split('-');
      return {
        data: `${day}/${month}`,
        Inspeções: count
      };
    });
  }, [checklists]);

  // B. Critical items per specific vehicle
  const chartCriticalPerVehicle = useMemo(() => {
    const vehicleIssues: Record<string, number> = {};
    vehicles.forEach(v => {
      vehicleIssues[v.name] = 0;
    });

    checklists.forEach(c => {
      let count = 0;
      Object.entries(c.items).forEach(([, status]) => {
        if (status === 'Crítico') count++;
      });
      if (vehicleIssues[c.vehicleName] !== undefined) {
        vehicleIssues[c.vehicleName] += count;
      }
    });

    return Object.entries(vehicleIssues)
      .map(([name, count]) => ({ Veículo: name.split(' ')[0], Críticos: count }))
      .filter(item => item.Críticos > 0);
  }, [checklists, vehicles]);

  // C. Occurrences by Equipment Type
  const chartEquipmentCriticals = useMemo(() => {
    const equipmentMap: Record<string, { ok: number; warning: number; critical: number }> = {};
    vehicles.forEach(v => {
      if (!equipmentMap[v.type]) {
        equipmentMap[v.type] = { ok: 0, warning: 0, critical: 0 };
      }
    });

    checklists.forEach(c => {
      if (!equipmentMap[c.vehicleType]) {
        equipmentMap[c.vehicleType] = { ok: 0, warning: 0, critical: 0 };
      }
      if (c.overallStatus === 'Crítico') {
        equipmentMap[c.vehicleType].critical++;
      } else if (c.overallStatus === 'Atenção') {
        equipmentMap[c.vehicleType].warning++;
      } else {
        equipmentMap[c.vehicleType].ok++;
      }
    });

    return Object.entries(equipmentMap).map(([type, status]) => ({
      name: type,
      Problemas: status.critical + status.warning,
      Crítico: status.critical,
      Atenção: status.warning
    }));
  }, [checklists, vehicles]);

  // D. Fleet Status Breakdown ratios
  const chartFleetRatios = useMemo(() => {
    let ok = 0;
    let attention = 0;
    let critical = 0;

    vehicles.forEach(v => {
      if (v.status === 'Crítico') critical++;
      else if (v.status === 'Atenção') attention++;
      else ok++;
    });

    return [
      { name: 'Operacional', value: ok, color: '#16A34A' },
      { name: 'Atenção', value: attention, color: '#F59E0B' },
      { name: 'Crítico', value: critical, color: '#DC2626' }
    ];
  }, [vehicles]);

  // EXPORTS:
  // 1. CSV Download
  const handleExportExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID;Data;Hora;Veículo;Equipamento;Motorista;Status Geral;Observações\n';

    filteredChecklists.forEach(c => {
      const obsSafe = c.observations.replace(/;/g, ',').replace(/\n/g, ' ');
      csvContent += `${c.id};${c.date};${c.time};${c.vehicleName};${c.vehicleType};${c.driverName};${c.overallStatus};"${obsSafe}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Relatorio_Frota_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Direct PDF Document Generation with custom branding
  const handlePrintPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const slateDark = [15, 23, 42]; // #0F172A

    // Header band
    doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.rect(0, 0, pageWidth, 22, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('AG MATERIAIS DE CONSTRUÇÃO', 15, 13);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('FROTA CHECKLIST - RELATÓRIO DE INSPEÇÃO CONSOLIDADO', 15, 18);

    // Generation Info on the top-right
    const dateText = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
    doc.setFontSize(8.5);
    doc.setTextColor(200, 200, 200);
    doc.text(dateText, pageWidth - 15, 14, { align: 'right' });

    // Active filters Section
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('Filtros Aplicados no Relatório', 15, 31);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    let filterDescription = '';
    if (dateStart && dateEnd) {
      filterDescription += `Período: de ${dateStart.split('-').reverse().join('/')} até ${dateEnd.split('-').reverse().join('/')}`;
    } else if (dateStart) {
      filterDescription += `A partir de: ${dateStart.split('-').reverse().join('/')}`;
    } else if (dateEnd) {
      filterDescription += `Até: ${dateEnd.split('-').reverse().join('/')}`;
    } else {
      filterDescription += 'Todos os períodos cadastrados';
    }

    if (filterVehicle) {
      const v = vehicles.find(item => item.id === filterVehicle);
      filterDescription += ` | Veículo: ${v ? v.name : 'Selecionado'}`;
    }
    if (filterDriver) {
      const d = drivers.find(item => item.id === filterDriver);
      filterDescription += ` | Motorista: ${d ? d.name : 'Selecionado'}`;
    }
    if (filterStatus) {
      filterDescription += ` | Status Geral: ${filterStatus}`;
    }

    doc.text(filterDescription, 15, 36);

    // Dynamic stats blocks
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    
    // Grid boxes background
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(15, 41, 62, 10, 'F');
    doc.rect(82, 41, 62, 10, 'F');
    doc.rect(149, 41, 62, 10, 'F');
    doc.rect(216, 41, 66, 10, 'F');

    doc.setFontSize(8);
    doc.setTextColor(110, 110, 115);
    doc.text('CHECKLISTS SELECIONADOS', 17, 45);
    doc.text('COM STATUS OK', 84, 45);
    doc.text('COM ALERTA ATENÇÃO', 151, 45);
    doc.text('EM ESTADO CRÍTICO', 218, 45);

    // Calculate totals
    const totalSelected = filteredChecklists.length;
    const okSelected = filteredChecklists.filter(c => c.overallStatus === 'OK').length;
    const attentionSelected = filteredChecklists.filter(c => c.overallStatus === 'Atenção').length;
    const criticalSelected = filteredChecklists.filter(c => c.overallStatus === 'Crítico').length;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(String(totalSelected), 71, 47.5, { align: 'right' });
    
    doc.setTextColor(22, 163, 74); // green-600
    doc.text(String(okSelected), 138, 47.5, { align: 'right' });

    doc.setTextColor(217, 119, 6); // warning-600
    doc.text(String(attentionSelected), 205, 47.5, { align: 'right' });

    doc.setTextColor(220, 38, 38); // red-600
    doc.text(String(criticalSelected), 276, 47.5, { align: 'right' });

    // Table Content mapping
    const tableHeaders = [['ID', 'Data / Hora', 'Veículo / Equipamento', 'Motorista / Operador', 'Status Geral', 'Observações / Anotações']];
    const tableData = filteredChecklists.map((c) => {
      const formatStatus = (s: string) => {
        if (s === 'OK') return '🟢 OK (Operacional)';
        if (s === 'Atenção') return '🟡 Atenção';
        return '🔴 Crítico';
      };
      return [
        c.id.toUpperCase(),
        `${c.date.split('-').reverse().join('/')} - ${c.time}`,
        `${c.vehicleName}\n(${c.vehicleType})`,
        c.driverName,
        formatStatus(c.overallStatus),
        c.observations || 'Nenhuma obs.'
      ];
    });

    // Draw standard autoTable
    autoTable(doc, {
      startY: 55,
      head: tableHeaders,
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129], // Emerald-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 32 },
        2: { cellWidth: 42 },
        3: { cellWidth: 50 },
        4: { cellWidth: 30, fontStyle: 'bold' },
        5: { cellWidth: 'auto' }
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        // Page footer numbering
        const str = `Página ${data.pageNumber}`;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(str, pageWidth - 15, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      }
    });

    doc.save(`Relatorio_Checklist_Frota_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate beautiful, individual-checklist PDF report with full items, observations, and signature
  const handlePrintSingleChecklist = (c: Checklist) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Accent Colors
    const slateDark = [15, 23, 42]; // #0F172A
    
    // 1. Top dark header bar
    doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('AG MATERIAIS DE CONSTRUÇÃO - CHECKLIST', 15, 12);
    
    // Description line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Ficha de Inspeção do Veículo - Nº ${c.id.toUpperCase()}`, 15, 18);

    // Generation Timestamp on the top right
    const timestampText = `Impresso: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    doc.text(timestampText, pageWidth - 15, 12, { align: 'right' });

    // 2. Info Card Section: Equipment and Driver Details
    doc.setFillColor(248, 250, 252); // extremely soft light gray-slate
    doc.rect(15, 32, pageWidth - 30, 26, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.2);
    doc.rect(15, 32, pageWidth - 30, 26, 'S');

    // Section Content
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('INFORMAÇÕES DE CADASTRO E TURNO', 18, 38);

    // Grid Column 1: Vehicle & Operator Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Equipamento:', 18, 44);
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.vehicleName} (${c.vehicleType})`, 38, 44);

    doc.setFont('helvetica', 'normal');
    doc.text('Tipo do Veículo:', 18, 49);
    doc.setFont('helvetica', 'bold');
    doc.text(c.vehicleType, 38, 49);

    doc.setFont('helvetica', 'normal');
    doc.text('Data e Hora:', 18, 54);
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.date.split('-').reverse().join('/')} às ${c.time}`, 38, 54);

    // Grid Column 2: Driver Info
    doc.setFont('helvetica', 'normal');
    doc.text('Operador / Motorista:', 110, 44);
    doc.setFont('helvetica', 'bold');
    doc.text(c.driverName, 142, 44);

    const relatedDriver = drivers.find(d => d.id === c.driverId);
    doc.setFont('helvetica', 'normal');
    doc.text('Matrícula:', 110, 49);
    doc.setFont('helvetica', 'bold');
    doc.text(relatedDriver ? relatedDriver.registration : 'MTR-1004', 142, 49);

    doc.setFont('helvetica', 'normal');
    doc.text('Status Geral:', 110, 54);
    doc.setFont('helvetica', 'bold');
    if (c.overallStatus === 'OK') {
      doc.setTextColor(22, 163, 74); // green
      doc.text('🟢 OPERACIONAL (OK)', 142, 54);
    } else if (c.overallStatus === 'Atenção') {
      doc.setTextColor(217, 119, 6); // amber
      doc.text('🟡 ATENÇÃO', 142, 54);
    } else {
      doc.setTextColor(220, 38, 38); // red
      doc.text('🔴 CRÍTICO / RETIDO', 142, 54);
    }

    // 3. Items inspection list table
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ITENS INSPECIONADOS NESTA AUDITORIA', 15, 66);

    const itemRows: string[][] = [];
    CHECKLIST_CATEGORIES.forEach(category => {
      category.items.forEach(item => {
        const itemStatus = c.items[item.id] || 'OK';
        let formattedStatus = '';
        if (item.id === 'veiculo_engraxado') {
          formattedStatus = itemStatus === 'OK' ? '🟢 Sim' : '🟡 Não';
        } else {
          formattedStatus = itemStatus === 'OK' ? '🟢 OK' : itemStatus === 'Atenção' ? '🟡 Atenção' : '🔴 Crítico';
        }
        itemRows.push([
          category.title,
          item.label,
          formattedStatus
        ]);
      });
    });

    autoTable(doc, {
      startY: 70,
      head: [['Categoria', 'Item Avaliado', 'Status de Integridade']],
      body: itemRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
        cellPadding: 2.2
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 100 },
        2: { cellWidth: 40, fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 },
    });

    const tableFinalY = (doc as any).lastAutoTable.finalY + 10;

    // Check if we need to add a new page because of height
    let cursorY = tableFinalY;
    if (cursorY + 60 > pageHeight) {
      doc.addPage();
      cursorY = 20;
    }

    // 4. Driver's Notes / Observations
    doc.setFillColor(250, 250, 250);
    doc.rect(15, cursorY, pageWidth - 30, 18, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, cursorY, pageWidth - 30, 18, 'S');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('ANOTAÇÕES / OBSERVAÇÕES DO OPERADOR', 18, cursorY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const observationText = doc.splitTextToSize(c.observations || 'Nenhuma anotação adicional registrada.', pageWidth - 36);
    doc.text(observationText, 18, cursorY + 11);

    cursorY += 26;

    // 5. Photos if present
    if (c.photos && c.photos.length > 0) {
      if (cursorY + 45 > pageHeight) {
        doc.addPage();
        cursorY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('EVIDÊNCIAS DE FOTO EM ANEXO', 15, cursorY);
      cursorY += 4;

      // Draw photos
      let startX = 15;
      c.photos.forEach((photo, index) => {
        try {
          if (photo && photo.startsWith('data:image')) {
            doc.addImage(photo, 'JPEG', startX, cursorY, 32, 24);
            startX += 36;
          }
        } catch (e) {
          console.error('Error adding photo to single PDF', e);
        }
      });
      cursorY += 28;
    }

    // 6. Signature Section
    if (cursorY + 35 > pageHeight) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(15, cursorY + 15, pageWidth - 15, cursorY + 15);

    // Operator Title under the line
    doc.setTextColor(100, 110, 120);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('ASSINATURA DO OPERADOR / MOTORISTA RESPONSÁVEL', 15, cursorY + 19);
    doc.text(c.driverName, 15, cursorY + 23);

    const formattedSignDate = `Data do Envio: ${c.date.split('-').reverse().join('/')} às ${c.time}`;
    doc.text(formattedSignDate, pageWidth - 15, cursorY + 19, { align: 'right' });

    // Draw the actual signature image on top of the line
    if (c.signature && c.signature.startsWith('data:image')) {
      try {
        doc.addImage(c.signature, 'PNG', 15, cursorY - 2, 45, 15);
      } catch (err) {
        console.error('Error rendering signature in single PDF', err);
      }
    }

    doc.save(`Checklist_${c.vehicleName.replace(/\s+/g, '_')}_${c.driverName.replace(/\s+/g, '_')}_${c.date}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12 print:px-0" id="admin_dashboard">
      {/* Dynamic Visual Alarms (Alert banner for critical issues) */}
      {kpis.criticalToday > 0 && (
        <div className="bg-red-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg animate-pulse print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">⚠️ Alerta Urgente: Veículo necessita manutenção imediata.</p>
              <p className="text-xs text-red-100 font-medium">Foram registrados {kpis.criticalToday} checklists em estado crítico hoje.</p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('Crítico')}
            className="hidden sm:block px-3.5 py-1.5 bg-white text-red-600 font-bold rounded-xl text-xs shadow hover:bg-red-50 transition"
          >
            Filtrar Críticos
          </button>
        </div>
      )}

      {/* Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5 print:border-none">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white leading-tight">Gestão de Checklists da Frota</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Supervisão em tempo real e status pré-operacionais dos veículos de carga e escavação.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3 print:hidden">
          {/* Theme toggler */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition"
            title="Alternar tema"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onAddChecklist}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo Checklist
          </button>
        </div>
      </div>

      {/* Fleet health big progress circle banner */}
      <div className={`p-5 rounded-2xl border ${fleetHealth.bg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-4 h-4 rounded-full ${fleetHealth.dot} flex-shrink-0 animate-pulse`} />
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              Visual de Saúde da Frota: <span className={fleetHealth.color}>{fleetHealth.label}</span>
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed font-medium">
              {fleetHealth.summary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <span>{vehicles.filter(v => v.status === 'OK').length} OK</span>
          <span>•</span>
          <span>{vehicles.filter(v => v.status === 'Atenção').length} Atenção</span>
          <span>•</span>
          <span>{vehicles.filter(v => v.status === 'Crítico').length} Crítico</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total Frota</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white">{kpis.totalVehicles}</span>
            <span className="p-1 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Registros Hoje</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white">{kpis.checklistsToday}</span>
            <span className="p-1 bg-green-50 dark:bg-green-950 text-green-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Alerta Crítico Hoje</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400">{kpis.criticalToday}</span>
            <span className={`p-1 rounded-lg ${kpis.criticalToday > 0 ? 'bg-red-100 text-red-600 dark:bg-red-950' : 'bg-gray-100 text-gray-600'}`}>
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Problemáticos</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-500">{kpis.vehiclesWithProblems}</span>
            <span className="p-1 bg-amber-50 dark:bg-amber-950 text-amber-500 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm text-left col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Motoristas Ativos</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white">{kpis.activeDrivers}</span>
            <span className="p-1 bg-blue-50 dark:bg-blue-950 text-blue-500 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* RECHARTS PLOTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Graph 1: Checklists volumes daily */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-left">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">Volume de Checklists por dia</h3>
          </div>
          <div className="h-64">
            {checklists.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Nenhum dado gravado.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartChecklistsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="data" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: isDarkMode ? '#1F2937' : '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '11px', color: isDarkMode ? '#FFF' : '#000' }} />
                  <Line type="monotone" dataKey="Inspeções" stroke="#16A34A" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 2: Critical items mapped per vehicle */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-left">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">Itens críticos acumulados por veículo</h3>
          </div>
          <div className="h-64">
            {chartCriticalPerVehicle.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Excelente! Nenhum item crítico registrado.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartCriticalPerVehicle} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="Veículo" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: isDarkMode ? '#1F2937' : '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '11px', color: isDarkMode ? '#FFF' : '#000' }} />
                  <Bar dataKey="Críticos" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 3: Problems by Machine Type */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-left">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide font-sans">Ocorrências por Tipo de Equipamento</h3>
          </div>
          <div className="h-64">
            {checklists.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Nenhum dado gravado.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartEquipmentCriticals} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: isDarkMode ? '#1F2937' : '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '11px', color: isDarkMode ? '#FFF' : '#000' }} />
                  <Legend verticalAlign="top" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Crítico" stackId="stack" fill="#DC2626" />
                  <Bar dataKey="Atenção" stackId="stack" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 4: Fleet general share */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-left">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">Distribuição de Status da Frota</h3>
          </div>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-full h-44 sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ background: isDarkMode ? '#1F2937' : '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '11px', color: isDarkMode ? '#FFF' : '#000' }} />
                  <Pie
                    data={chartFleetRatios}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartFleetRatios.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {chartFleetRatios.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-gray-500 font-medium">{r.name}:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{r.value} ({vehicles.length ? Math.round((r.value / vehicles.length) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER PANEL AND TABLES */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 text-left print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4 border-gray-100 dark:border-gray-800 print:hidden">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Registros de Checklist Enviados</h2>
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold px-2.5 py-0.5 rounded-full text-xs">
              {filteredChecklists.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition shadow-sm"
              title="Exportar CSV"
            >
              <Download className="w-3.5 h-3.5" /> Planilha Excel
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition shadow-sm"
              title="Imprimir"
            >
              <Calendar className="w-3.5 h-3.5" /> Gerar PDF (Imprimir)
            </button>
          </div>
        </div>

        {/* Filters Select Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 print:hidden">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data Início</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-xl px-2.5 py-2"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data Fim</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-xl px-2.5 py-2"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Veículo</label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="">Todos</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Motorista</label>
            <select
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="">Todos</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
              <option value="motorista">Carlos Silva (motorista)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="">Todos</option>
              <option value="OK">OK (Regular)</option>
              <option value="Atenção">Atenção</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
        </div>

        {/* Clear Filters helper */}
        {(dateStart || dateEnd || filterVehicle || filterDriver || filterStatus) && (
          <button
            onClick={() => {
              setDateStart('');
              setDateEnd('');
              setFilterVehicle('');
              setFilterDriver('');
              setFilterStatus('');
            }}
            className="text-xs text-red-600 hover:text-red-700 font-bold mb-4 flex items-center gap-1 outline-none print:hidden"
          >
            <X className="w-3.5 h-3.5" /> Limpar Filtros
          </button>
        )}

        {/* Checklist data grid */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-850">
          <table className="w-full border-collapse text-xs sm:text-sm text-left">
            <thead>
              <tr className="bg-gray-55 dark:bg-gray-850 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 font-bold lowercase">
                <th className="p-3 text-left uppercase tracking-wider text-[10px]">Data / Hora</th>
                <th className="p-3 text-left uppercase tracking-wider text-[10px]">Equipamento</th>
                <th className="p-3 text-left uppercase tracking-wider text-[10px]">Motorista</th>
                <th className="p-3 text-center uppercase tracking-wider text-[10px]">Condição</th>
                <th className="p-3 text-left uppercase tracking-wider text-[10px] print:hidden">Observações</th>
                <th className="p-3 text-center uppercase tracking-wider text-[10px] print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredChecklists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400 text-xs">
                    Nenhum checklist localizado correspondente aos filtros.
                  </td>
                </tr>
              ) : (
                filteredChecklists.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="p-3 whitespace-nowrap text-gray-800 dark:text-gray-250">
                      <p className="font-bold">{new Date(c.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{c.time}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      <p className="font-bold">{c.vehicleName}</p>
                      <p className="text-[10px] text-gray-400">{c.vehicleType}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                      {c.driverName}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {c.overallStatus === 'Crítico' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-200/50 dark:border-red-900/50">
                          🔴 Crítico
                        </span>
                      ) : c.overallStatus === 'Atenção' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/50">
                          🟡 Atenção
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200/50 dark:border-green-900/50">
                          🟢 OK
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-left max-w-xs truncate text-gray-500 dark:text-gray-400 print:hidden text-xs">
                      {c.observations || 'Sem observações.'}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap print:hidden">
                      <button
                        onClick={() => setSelectedChecklist(c)}
                        className="p-1 px-2 text-xs bg-gray-100 hover:bg-green-50 hover:text-green-600 dark:bg-gray-800 dark:hover:bg-green-950 dark:hover:text-green-400 text-gray-600 dark:text-gray-400 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" /> Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VIEW FOR DETAILED CHECKLISTS */}
      {selectedChecklist && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Visualizar Checklist #{selectedChecklist.id.slice(-6)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Registrado no dia {new Date(selectedChecklist.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {selectedChecklist.time}
                </p>
              </div>

              <button
                onClick={() => setSelectedChecklist(null)}
                className="p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto space-y-6 text-left">
              {/* Equipment and driver card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Equipamento</h4>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{selectedChecklist.vehicleName}</p>
                  <p className="text-xs text-gray-500">Tipo: {selectedChecklist.vehicleType}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Operador</h4>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{selectedChecklist.driverName}</p>
                  <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                    ID: {selectedChecklist.id.split('_')[1] || selectedChecklist.id}
                  </p>
                </div>
              </div>

              {/* Status Header Checklist */}
              <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Condição Geral do Equipamento:</span>
                {selectedChecklist.overallStatus === 'Crítico' ? (
                  <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 text-xs font-bold border border-red-200/40">
                    🔴 Crítico (Manutenção Necessária)
                  </span>
                ) : selectedChecklist.overallStatus === 'Atenção' ? (
                  <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-xs font-bold border border-amber-200/40">
                    🟡 Atenção (Revisar em breve)
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 text-xs font-bold border border-green-200/40">
                    🟢 OK (Operacional)
                  </span>
                )}
              </div>

              {/* Categorized Detailed Items status mapping */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-950 dark:text-white uppercase tracking-wider mb-2">Relatório de Itens Avaliados</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {CHECKLIST_CATEGORIES.map(category => (
                    <div key={category.key} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs mb-3">
                      <div className="bg-gray-100/50 dark:bg-gray-850 px-3 py-2 font-bold text-gray-700 dark:text-gray-300">
                        {category.title}
                      </div>

                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {category.items.map(item => {
                          const status = selectedChecklist.items[item.id] || 'OK';
                          return (
                            <div key={item.id} className="flex justify-between items-center px-3 py-2 bg-white dark:bg-gray-900">
                              <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                              {item.id === 'veiculo_engraxado' ? (
                                status === 'OK' ? (
                                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-450 px-2 py-0.5 rounded">SIM</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">NÃO</span>
                                )
                              ) : status === 'Crítico' ? (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded">CRÍTICO</span>
                              ) : status === 'Atenção' ? (
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">ATENÇÃO</span>
                              ) : (
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-450 px-2 py-0.5 rounded">OK</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra visual indicators (Attached photos) */}
              {selectedChecklist.photos && selectedChecklist.photos.length > 0 && (
                <div className="space-y-2 border-t pt-4 border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-850 dark:text-white uppercase tracking-wider">Fotos Anexadas</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedChecklist.photos.map((photo, index) => (
                      <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden">
                        <img referrerPolicy="no-referrer" src={photo} alt={`Anexo ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Free format notes */}
              <div className="border-t pt-4 border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Anotações do Motorista</h4>
                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl text-xs text-gray-700 dark:text-gray-350 min-h-[50px] leading-relaxed">
                  {selectedChecklist.observations || 'Nenhuma anotação inserida para este checklist.'}
                </div>
              </div>

              {/* Signature display */}
              {selectedChecklist.signature && (
                <div className="border-t pt-4 border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Assinatura do Operador</h4>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-bold">{selectedChecklist.driverName}</p>
                  </div>
                  <div className="bg-white p-2 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-xs h-16 w-48 flex items-center justify-center">
                    <img referrerPolicy="no-referrer" src={selectedChecklist.signature} alt="Assinatura" className="max-h-full max-w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-850 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => {
                  handlePrintSingleChecklist(selectedChecklist);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-350 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition"
              >
                Gerar PDF (Imprimir Ficha)
              </button>
              <button
                onClick={() => setSelectedChecklist(null)}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
