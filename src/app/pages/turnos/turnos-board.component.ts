import { Component, computed, input, output, inject } from '@angular/core';
import { Turno } from '../../models/turno';
import { TurnoService } from '../../services/turno.service';
import { MatIconModule } from '@angular/material/icon';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-turnos-board',
  standalone: true,
  imports: [MatIconModule, UpperCasePipe],
  template: `
    <div class="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-12rem)] items-start bg-slate-50 p-2">
      @for (estado of columnasTableroQuirurgico(); track estado) {
        <div class="flex-shrink-0 w-80 flex flex-col h-full">
          <!-- Col Header -->
          <div class="flex justify-between items-center mb-4 px-2 py-1 rounded bg-slate-200/50">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-700">{{ estado }}</span>
              <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">{{ getTurnosPorEstado(estado).length }}</span>
            </div>
          </div>
          
          <!-- Cards Scroll -->
          <div class="flex-1 overflow-y-auto pr-2 pb-2 space-y-3 scrollbar-hide">
            @for (t of getTurnosPorEstado(estado); track t.id; let i = $index) {
              <!-- Tarjeta de Turno -->
              <div (click)="turnoClick.emit(t)" 
                   (keyup.enter)="turnoClick.emit(t)"
                   tabindex="0"
                   role="button"
                   class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all cursor-pointer relative overflow-hidden group">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                
                <!-- Badge de Enumeración -->
                <div class="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg border-l border-b border-slate-200">
                  #{{ i + 1 }}
                </div>

                <div class="pl-2">
                  <div class="flex justify-between items-start mb-3">
                    <!-- Diseño exacto de widget de Fecha/Hora reducido -->
                    <div class="flex flex-col items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Fecha</span>
                      <span class="font-mono text-[13px] text-emerald-600 leading-none mb-1">{{ formatearHora(t.hora_24_h) }}</span>
                      <span class="text-[9px] font-medium text-slate-600 leading-none">{{ formatearFecha(t.fecha) }}</span>
                    </div>
                    <span class="text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm mt-1" [class]="getPrioridadClass(t.prioridad)">{{ t.prioridad | uppercase }}</span>
                  </div>
                  
                  <h3 class="text-[11px] font-bold text-slate-800 truncate" title="{{ t.paciente }}">{{ t.paciente }}</h3>
                  <div class="text-[9px] text-slate-500 mb-2 truncate">
                    CC: {{ t.documento }} • {{ t.edad }} {{ t.edad_en === 'AÑOS' ? 'A' : t.edad_en }} • {{ t.eps }}
                  </div>
                  
                  <p class="text-[10px] text-slate-600 line-clamp-2 mb-2 leading-tight" title="{{ t.cups_descripcion }}">
                    <span class="font-semibold text-slate-700">Proc:</span> {{ t.cups_descripcion }}
                    @if (getProcedimientosCount(t.n_ingreso, t.documento) > 1) {
                      <span class="ml-1 inline-block text-[8px] font-bold bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200">
                        +{{ getProcedimientosCount(t.n_ingreso, t.documento) - 1 }} más
                      </span>
                    }
                  </p>

                  @if (t.autorizador) {
                    <div class="mb-3 inline-flex items-center gap-1 px-2 py-1 bg-emerald-50/50 text-emerald-800 border-l-2 border-emerald-500 rounded-sm text-[8px] font-bold uppercase tracking-tighter">
                      <mat-icon class="text-[10px] w-2.5 h-2.5 text-emerald-600">verified_user</mat-icon>
                      <span class="leading-tight">{{ t.autorizador }}</span>
                    </div>
                  }
                  
                  <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div class="flex flex-col overflow-hidden">
                      <span class="text-[8px] text-slate-400 uppercase">Especialista</span>
                      <span class="text-[10px] font-medium text-slate-700 truncate" title="{{ t.especialista }}">{{ t.especialista }}</span>
                    </div>
                    <div class="flex flex-col text-right overflow-hidden">
                      <span class="text-[8px] text-slate-400 uppercase">Ubicación</span>
                      <span class="text-[10px] font-mono text-slate-700 truncate" title="{{ t.servicio_actual }} - {{ t.cama }}">{{ t.cama }}</span>
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <span class="text-xs text-slate-400">Sin turnos</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class TurnosBoardComponent {
  turnos = input.required<Turno[]>();
  turnoClick = output<Turno>();
  turnoService = inject(TurnoService);

  getProcedimientosCount(n_ingreso: string | null, documento: string | null): number {
    if (!n_ingreso || !documento) return 0;
    return this.turnoService.turnos().filter(t => t.n_ingreso === n_ingreso && t.documento === documento).length;
  }

  columnasTableroQuirurgico = computed(() => {
    const turnos = this.turnos();
    if (turnos.length === 0) return ['Programado', 'Preparación', 'En Cirugía', 'Recuperación'];
    const estadosEnDb = [...new Set(turnos.map(t => t.estado).filter((e): e is string => !!e && e.trim() !== ''))];
    return estadosEnDb.length > 0 ? estadosEnDb : ['Programado', 'Preparación', 'En Cirugía', 'Recuperación'];
  });

  getTurnosPorEstado(estado: string | null) {
    if (!estado) return [];
    return this.turnos()
       .filter(t => t.estado === estado)
       .sort((a, b) => (a.hora_24_h?.toString() || '').localeCompare(b.hora_24_h?.toString() || ''));
  }

  getPrioridadClass(prioridad: string | null): string {
    const p = prioridad?.toUpperCase() || '';
    if (p.includes('URGENCIA') || p.includes('EMERGENCIA')) return 'bg-red-600 text-white border border-red-700';
    if (p.includes('REGULAR') || p.includes('PROGRAMADA')) return 'bg-green-800 text-white border border-green-900';
    return 'bg-slate-200 text-slate-700 border border-slate-300';
  }

  formatearHora(horaStr: string | null): string {
    if (!horaStr) return '--:--';
    const str = horaStr.toString();
    const match = str.match(/\d{2}:\d{2}(:\d{2})?/);
    return match ? match[0] : str;
  }

  formatearFecha(fechaStr: string | null): string {
    if (!fechaStr) return '';
    const str = fechaStr.toString();
    
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.split('T')[0];
    }

    const date = new Date(str);
    if (isNaN(date.getTime())) return str; // Return original if invalid
    
    // Format as YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
