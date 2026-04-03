import { Component, input, inject, computed } from '@angular/core';
import { Turno } from '../../models/turno';
import { TurnoService } from '../../services/turno.service';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-turno-detail',
  standalone: true,
  imports: [MatIconModule, NgClass],
  host: { class: 'h-full block' },
  template: `
    <div class="h-full overflow-y-auto bg-[#F3F4F6] p-6 animate-in fade-in duration-200">
      <div class="max-w-5xl mx-auto space-y-4">
        
        <!-- Turno Header Card -->
        <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-200 shadow-sm flex justify-between items-start relative overflow-hidden">
          <div class="absolute top-0 right-0 bg-emerald-100/50 text-emerald-600/40 text-[40px] font-black leading-none pr-4 pt-2 pointer-events-none">
            {{ getTurnoIndex() }}
          </div>
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200">
                {{ turno().estado }}
              </span>
              <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm" [ngClass]="getPrioridadClass(turno().prioridad)">
                {{ turno().prioridad }}
              </span>
            </div>
            <h2 class="text-base font-bold text-slate-900 leading-tight mb-1 uppercase">{{ turno().paciente }}</h2>
            <div class="flex flex-wrap items-center gap-3 text-[11px]">
              <span class="font-mono text-slate-600 font-medium">CC: {{ turno().documento }}</span>
              <span class="text-slate-400">•</span>
              <span class="text-slate-600">{{ turno().edad }} {{ turno().edad_en === 'AÑOS' ? 'A' : turno().edad_en }}</span>
              <span class="text-slate-400">•</span>
              <span class="text-slate-600">Sexo: {{ turno().genero }}</span>
              <span class="text-slate-400">•</span>
              <span class="font-bold text-indigo-600">{{ turno().eps }}</span>
            </div>
          </div>
          
          <div class="flex flex-col items-center bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha</span>
            <span class="text-lg font-bold text-emerald-600 font-mono leading-none mb-1">{{ formatearHora(turno().hora_24_h) }}</span>
            <span class="text-[11px] font-medium text-slate-500">{{ formatearFecha(turno().fecha) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Main Info Column -->
          <div class="lg:col-span-2 space-y-5">
            
            <!-- Procedimientos (Agrupados por Folio) -->
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Procedimientos Quirúrgicos</h3>
                <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Folio: {{ turno().folio }}</span>
              </div>
              
              <div class="space-y-4">
                @for (proc of procedimientosFolio(); track proc.id) {
                  <div class="group relative pl-4 border-l-2 border-slate-100 hover:border-emerald-400 transition-colors pb-1">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-mono text-[10px] font-bold bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{{ proc.cups }}</span>
                          <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{{ proc.anestesia }}</span>
                        </div>
                        <p class="text-xs font-bold text-slate-800 leading-snug">{{ proc.cups_descripcion }}</p>
                      </div>
                      
                      <!-- Estado & Check de Autorización Moderno -->
                      <div class="shrink-0 flex items-center gap-3">
                        <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60 tracking-wider">
                          {{ proc.estado }}
                        </span>
                        @if (proc.autorizador) {
                          <div class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 shadow-sm" title="Autorizado">
                            <mat-icon class="text-[16px] w-4 h-4">verified</mat-icon>
                          </div>
                        } @else {
                          <div class="w-6 h-6"></div> <!-- Spacer for alignment -->
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
              
              <div class="pt-4 mt-4 border-t border-slate-100">
                <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Diagnóstico Principal ({{ turno().dx }})</p>
                <p class="text-[11px] text-slate-700 leading-relaxed">{{ turno().dx_descr }}</p>
              </div>
            </div>

            <!-- Personal y Observaciones -->
            <div class="grid grid-cols-2 gap-5">
              <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Equipo Médico</h3>
                <p class="text-[10px] text-slate-400 mb-0.5">Especialista Principal</p>
                <p class="font-bold text-sm text-slate-800">{{ turno().especialista }}</p>
                <p class="text-[11px] font-medium text-indigo-600 mt-0.5">{{ turno().especialidad }}</p>
              </div>
              
              <div class="bg-amber-50 rounded-xl p-5 border border-amber-200 shadow-sm flex flex-col">
                <h3 class="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <mat-icon class="text-[14px] w-3.5 h-3.5">info</mat-icon>
                  Observaciones
                </h3>
                <p class="text-[11px] text-amber-900 flex-1 italic leading-relaxed">{{ turno().observacion || 'Ninguna observación registrada para este turno.' }}</p>
              </div>
            </div>
          </div>

          <!-- Side Column -->
          <div class="space-y-5">
            <!-- Ubicación -->
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Ubicación</h3>
              <p class="text-[10px] text-slate-400 mb-0.5">Servicio Actual</p>
              <p class="font-bold text-xs text-slate-800 mb-3">{{ turno().servicio_actual }}</p>
              
              <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <p class="text-[10px] text-slate-500 mb-0.5">Cama Asignada</p>
                <p class="text-lg font-bold font-mono text-indigo-600 leading-none">{{ turno().cama }}</p>
              </div>
            </div>

            <!-- Administrativo -->
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Ingreso</h3>
              <div class="space-y-2.5">
                <div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase">Número de Ingreso</p>
                  <p class="font-mono text-xs text-indigo-600 font-bold">{{ turno().n_ingreso }}</p>
                </div>
                <div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase">Folio</p>
                  <p class="font-mono text-xs text-slate-700 font-medium">{{ turno().folio }}</p>
                </div>
                <div class="pt-3 border-t border-slate-100">
                  <p class="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Autorizado Por</p>
                  @if (turno().autorizador) {
                    <div class="inline-flex items-center gap-2.5 px-3 py-2 bg-white border-l-4 border-emerald-500 rounded-r-lg shadow-sm ring-1 ring-slate-200">
                      <mat-icon class="text-emerald-600 text-[18px] w-4.5 h-4.5">verified_user</mat-icon>
                      <span class="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide whitespace-normal">{{ turno().autorizador }}</span>
                    </div>
                  } @else {
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg italic">
                      <span class="text-[11px] text-slate-400 font-medium">Pendiente de asignación</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TurnoDetailComponent {
  turno = input.required<Turno>();
  turnoService = inject(TurnoService);

  procedimientosFolio = computed(() => {
    const currentIngreso = this.turno().n_ingreso;
    const currentDocumento = this.turno().documento;
    return this.turnoService.turnos()
      .filter(t => t.n_ingreso === currentIngreso && t.documento === currentDocumento);
  });

  getTurnoIndex(): number {
    const turnos = this.turnoService.turnos();
    // Group by ingreso and documento to match the main list enumeration
    const groupedKeys = Array.from(new Set(turnos.map(t => `${t.n_ingreso}_${t.documento}`)));
    return groupedKeys.indexOf(`${this.turno().n_ingreso}_${this.turno().documento}`) + 1;
  }

  getPrioridadClass(prioridad: string | null): string {
    const p = prioridad?.toUpperCase() || '';
    if (p.includes('URGENCIA') || p.includes('EMERGENCIA')) return 'bg-red-600 text-white border border-red-700';
    if (p.includes('REGULAR') || p.includes('PROGRAMADA')) return 'bg-green-800 text-white border border-green-900';
    return 'bg-slate-200 text-slate-700 border border-slate-300';
  }

  formatearHora(horaStr: string | null): string {
    if (!horaStr) return '--:--';
    const match = horaStr.match(/\d{2}:\d{2}(:\d{2})?/);
    return match ? match[0] : horaStr;
  }

  formatearFecha(fechaStr: string | null): string {
    if (!fechaStr) return '';
    
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
      return fechaStr.split('T')[0];
    }

    const date = new Date(fechaStr);
    if (isNaN(date.getTime())) return fechaStr; // Return original if invalid
    
    // Format as YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
