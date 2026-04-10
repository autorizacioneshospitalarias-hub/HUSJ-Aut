import { Component, input, output, computed, signal, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { Egreso } from '../../models/egreso';
import { EgresoService } from '../../services/egreso.service';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-egresos-list',
  standalone: true,
  imports: [MatIconModule, NgClass, DatePipe, FormsModule],
  template: `
    <div class="h-full p-2 animate-in fade-in duration-300 bg-slate-50 focus:outline-none" (click)="closeAllFilters()" role="button" tabindex="0" (keydown.enter)="closeAllFilters()">
      <div class="rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col" [ngClass]="hasActiveFilters() ? 'bg-slate-100/50' : 'bg-white'">
        <div class="overflow-auto flex-1 scrollbar-hide">
          <table class="w-full text-sm text-left whitespace-nowrap">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th class="px-4 py-3 font-semibold w-10">#</th>
                <th class="px-4 py-3 font-semibold">Fecha Salida</th>
                <th class="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" (click)="sortData('nombre')">
                  <div class="flex items-center gap-1">
                    Paciente
                    <mat-icon class="text-[14px] w-3.5 h-3.5" [class.text-slate-400]="sortColumn() !== 'nombre'" [class.text-black]="sortColumn() === 'nombre'">
                      {{ sortColumn() === 'nombre' && sortDirection() === 'asc' ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </div>
                </th>
                <th class="px-4 py-3 font-semibold">Ingreso</th>
                <th class="px-4 py-3 font-semibold">Servicio / Cama</th>
                <th class="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" (click)="sortData('columna_w')">
                  <div class="flex items-center gap-1">
                    Columna W
                    <mat-icon class="text-[14px] w-3.5 h-3.5" [class.text-slate-400]="sortColumn() !== 'columna_w'" [class.text-black]="sortColumn() === 'columna_w'">
                      {{ sortColumn() === 'columna_w' && sortDirection() === 'asc' ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </div>
                </th>
                <th class="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" (click)="sortData('entidad')">
                  <div class="flex items-center gap-1">
                    Entidad
                    <mat-icon class="text-[14px] w-3.5 h-3.5" [class.text-slate-400]="sortColumn() !== 'entidad'" [class.text-black]="sortColumn() === 'entidad'">
                      {{ sortColumn() === 'entidad' && sortDirection() === 'asc' ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </div>
                </th>
                <th class="px-4 py-3 font-semibold">Municipio</th>
                <th class="px-4 py-3 font-semibold text-center">Días</th>
                <th class="px-4 py-3 font-semibold">HC15</th>
                <th class="px-4 py-3 font-semibold">HC19</th>
                <th class="px-4 py-3 font-semibold">Estado</th>
                <th class="px-4 py-3 font-semibold">Autorizador</th>
                <th class="px-4 py-3 font-semibold">Observación</th>
                <th class="px-4 py-3 font-semibold text-center">Tiempo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600 align-top">
              @for (e of filteredEgresos(); track e.id; let i = $index) {
                <tr (click)="egresoClick.emit(e)" 
                    class="transition-colors cursor-pointer group"
                    [ngClass]="isDelayed(e) ? 'bg-red-50/60 hover:bg-red-100/80' : (hasActiveFilters() ? 'bg-white hover:bg-slate-50' : 'hover:bg-slate-50')">
                  <td class="px-4 py-3 text-center">
                    <span class="text-[10px] font-bold text-slate-400 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      {{ i + 1 }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-[11px]">
                    <span class="font-medium text-slate-700 block">{{ e.fecha_salida | date:'dd/MM/yyyy' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-bold text-[11px] text-slate-900 mb-0.5">{{ e.nombre }}</div>
                    <div class="text-[10px] text-slate-500 hover:text-emerald-600 transition-colors">CC: {{ e.documento }}</div>
                  </td>
                  <td class="px-4 py-3 text-[11px]">
                    <div class="font-mono text-slate-700 mb-0.5 hover:text-emerald-600 transition-colors">Ing: {{ e.ingreso }}</div>
                    <div class="text-[9px] text-slate-400 uppercase">{{ e.hospitalizacion }}</div>
                  </td>
                  <td class="px-4 py-3 text-[11px]">
                    <div class="font-medium text-slate-800 mb-0.5">{{ e.servicio || 'N/A' }}</div>
                    <div class="font-mono text-slate-500">Cama: {{ e.cama || 'N/A' }}</div>
                  </td>
                  <td class="px-4 py-3 text-[11px]">
                    <div class="font-medium text-slate-800">{{ e.columna_w || 'N/A' }}</div>
                  </td>
                  <td class="px-4 py-3 text-[11px] max-w-[200px] whitespace-normal">
                    <div class="font-semibold text-slate-800">{{ e.entidad }}</div>
                  </td>
                  <td class="px-4 py-3 text-[11px] max-w-[150px] whitespace-normal">
                    <div class="font-medium text-slate-800 mb-0.5">{{ e.municipio || 'N/A' }}</div>
                    <div class="text-[10px] text-slate-500 italic">{{ e.contrato || 'Sin contrato' }}</div>
                  </td>
                  <td class="px-4 py-3 text-[11px] text-center">
                    <div class="flex flex-col items-center gap-1">
                      <span class="w-16 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium whitespace-nowrap text-center" title="Días de ingreso">Ing: {{ e.dias_ingreso ?? '-' }}</span>
                      <span class="w-16 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium whitespace-nowrap text-center" title="Días de hospitalización">Hosp: {{ e.dias_hospit || '-' }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-[11px]">
                    @for (line of formatHC15(e.hc15); track line) {
                      <div class="font-mono text-slate-700">{{ line }}</div>
                    } @empty {
                      <div class="font-mono text-slate-300 italic">N/A</div>
                    }
                  </td>
                  <td class="px-4 py-3 text-[11px] max-w-[200px] whitespace-normal">
                    <div class="font-mono text-slate-700 mb-0.5">{{ e.hc19 || 'N/A' }}</div>
                    <div class="text-[10px] text-slate-500 italic leading-tight">{{ e.hc19_des || 'N/A' }}</div>
                  </td>
                  <td class="px-4 py-3 transition-colors" [class.animate-fade-out-red]="egresoService.updatedCells().has(e.id + '-estado_y')">
                    @if (e.estado_y && e.estado_y.trim() !== '') {
                      <mat-icon [class]="getStatusIconColor(e.estado_y)" class="text-[16px] w-4 h-4" [title]="e.estado_y">{{ getStatusIcon(e.estado_y) }}</mat-icon>
                    }
                  </td>
                  <td class="px-4 py-3 text-[11px] transition-colors" [class.animate-fade-out-red]="egresoService.updatedCells().has(e.id + '-autorizador')">
                    @if (e.autorizador) {
                      <div class="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 text-blue-800 border-l-2 border-blue-500 rounded-sm font-bold uppercase tracking-tighter">
                        <span class="leading-tight">{{ e.autorizador }}</span>
                      </div>
                    } @else {
                      <span class="text-slate-300 italic">Sin asignar</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-[11px] max-w-[200px] whitespace-normal transition-colors relative group/obs"
                      [class.animate-fade-out-red]="egresoService.updatedCells().has(e.id + '-observacion')"
                      (click)="$event.stopPropagation()">
                    @if (editingObservationId() === e.id) {
                      <div class="flex flex-col gap-1.5">
                        <textarea 
                          [value]="editObservationText()"
                          (input)="updateEditObservationText($event)"
                          class="w-full text-[10px] p-1.5 border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white min-h-[60px] resize-y"
                          placeholder="Observación..."></textarea>
                        <div class="flex justify-end gap-1">
                          <button (click)="cancelEditingObservation()" class="px-2 py-0.5 text-[9px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors">
                            Cancelar
                          </button>
                          <button (click)="saveObservation(e.id)" [disabled]="isSavingObservation()" class="px-2 py-0.5 text-[9px] font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1">
                            @if (isSavingObservation()) {
                              <mat-icon class="text-[10px] w-2.5 h-2.5 animate-spin">sync</mat-icon>
                            } @else {
                              Guardar
                            }
                          </button>
                        </div>
                      </div>
                    } @else {
                      <div class="flex items-start justify-between gap-1">
                        <div class="text-slate-600 line-clamp-2 flex-1" [title]="e.observacion || ''">{{ e.observacion || 'Sin observación' }}</div>
                        <button (click)="startEditingObservation(e)" class="opacity-0 group-hover/obs:opacity-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0" title="Editar observación">
                          <mat-icon class="text-[8px] w-2 h-2">edit</mat-icon>
                        </button>
                      </div>
                    }
                  </td>
                  <td class="px-4 py-3 text-[11px] text-center font-mono">
                    <span [class.text-amber-600]="getTiempoTranscurrido(e) !== '-'" class="font-medium">
                      {{ getTiempoTranscurrido(e) }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="px-6 py-12 text-center text-slate-500">
                    <div class="flex flex-col items-center gap-2">
                      <mat-icon class="w-8 h-8 text-slate-300 text-[32px]">description</mat-icon>
                      No se encontraron egresos.
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class EgresosListComponent {
  egresos = input.required<Egreso[]>();
  activeFilter = input<{ documento: string | null, ingreso: string | null, nombre: string | null } | null>(null);
  
  egresoClick = output<Egreso>();
  filterCoincidences = output<{ documento: string | null, ingreso: string | null, nombre: string | null }>();
  clearFilter = output<void>();

  egresoService = inject(EgresoService);

  editingObservationId = signal<string | null>(null);
  editObservationText = signal<string>('');
  isSavingObservation = signal<boolean>(false);

  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  hasActiveFilters = computed(() => {
    return !!this.egresoService.searchQuery();
  });

  filteredEgresos = computed(() => {
    const allEgresos = this.egresos();
    const filter = this.activeFilter();
    const searchQuery = this.egresoService.searchQuery();
    
    let result = allEgresos;

    // Default filter: only show PENDIENTE or empty states if no search query
    if (!searchQuery || searchQuery.trim().length === 0) {
      result = result.filter(e => {
        const s = e.estado_y?.trim().toUpperCase();
        return !s || s === 'PENDIENTE';
      });
    }

    if (filter) {
      result = result.filter(e => 
        e.documento === filter.documento && 
        e.ingreso === filter.ingreso && 
        e.nombre === filter.nombre
      );
    }

    // Sorting
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col) {
      result = [...result].sort((a, b) => {
        const valA = (a[col as keyof Egreso] || '').toString().toLowerCase();
        const valB = (b[col as keyof Egreso] || '').toString().toLowerCase();
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  });

  sortData(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  // Removed filter methods

  getStatusIcon(status: string | null): string {
    if (!status || status.trim() === '') return 'pending';
    const s = status.trim().toUpperCase();
    if (s === 'ALTA') return 'check_circle';
    if (s === 'HOSPITALIZADO') return 'local_hospital';
    if (s === 'PENDIENTE') return 'pending';
    if (s === 'TRASLADO') return 'local_shipping';
    return 'info';
  }

  getStatusIconColor(status: string | null): string {
    if (!status || status.trim() === '') return 'text-red-500';
    const s = status.trim().toUpperCase();
    if (s === 'ALTA') return 'text-emerald-500';
    if (s === 'HOSPITALIZADO') return 'text-blue-500';
    if (s === 'PENDIENTE') return 'text-red-500';
    if (s === 'TRASLADO') return 'text-amber-500';
    return 'text-slate-500';
  }

  getStatusClass(status: string | null): string {
    if (!status || status.trim() === '') return 'bg-[#ffe599] text-slate-800';
    const s = status.trim().toUpperCase();
    if (s === 'ALTA') return 'bg-[#1a7441] text-white';
    if (s === 'HOSPITALIZADO') return 'bg-[#0b5394] text-white';
    if (s === 'PENDIENTE') return 'bg-[#ffe599] text-slate-800';
    if (s === 'TRASLADO') return 'bg-[#cfe2f3] text-slate-800';
    return 'bg-slate-100 text-slate-600';
  }

  getTiempoTranscurrido(e: Egreso): string {
    const estado = e.estado_y?.trim().toUpperCase() || '';
    if ((estado !== 'PENDIENTE' && estado !== '') || !e.fecha_salida) {
      return '-';
    }
    
    const fechaSalida = new Date(e.fecha_salida);
    const ahora = new Date();
    
    const diffMs = ahora.getTime() - fechaSalida.getTime();
    if (diffMs < 0) return '0h 0m';
    
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDias > 0) {
      return `${diffDias}d ${diffHoras}h`;
    }
    return `${diffHoras}h ${diffMins}m`;
  }

  isDelayed(e: Egreso): boolean {
    const estado = e.estado_y?.trim().toUpperCase() || '';
    if ((estado !== 'PENDIENTE' && estado !== '') || !e.fecha_salida) {
      return false;
    }
    const fechaSalida = new Date(e.fecha_salida);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaSalida.getTime();
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    return diffDias > 2;
  }

  formatHC15(val: string | null): string[] {
    if (!val || val.trim() === '' || val === 'N/A') return [];
    // Split by comma or space, then filter empty
    const parts = val.split(/[\s,]+/).map(p => p.trim()).filter(p => p.length > 0);
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 3) {
      lines.push(parts.slice(i, i + 3).join(', '));
    }
    return lines;
  }

  startEditingObservation(egreso: Egreso) {
    this.editingObservationId.set(egreso.id);
    this.editObservationText.set(egreso.observacion || '');
  }

  updateEditObservationText(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.editObservationText.set(target.value);
  }

  cancelEditingObservation() {
    this.editingObservationId.set(null);
    this.editObservationText.set('');
  }

  closeAllFilters() {
    // Removed
  }

  async saveObservation(id: string) {
    if (!id) return;
    
    this.isSavingObservation.set(true);
    try {
      await this.egresoService.actualizarObservacion(id, this.editObservationText());
      this.editingObservationId.set(null);
    } catch (error) {
      console.error('Error al guardar la observación:', error);
    } finally {
      this.isSavingObservation.set(false);
    }
  }
}
