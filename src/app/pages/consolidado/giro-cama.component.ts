import { Component, inject, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ConsolidadoService, ConsolidadoRecord, HistorialCambio } from '../../services/consolidado.service';
import { EpsGiroCamaService } from '../../services/eps-giro-cama.service';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

interface GiroCamaRecord extends ConsolidadoRecord {
  cambio: HistorialCambio;
}

@Component({
  selector: 'app-giro-cama',
  standalone: true,
  imports: [HeaderComponent, MatIconModule, DatePipe],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full relative">
      <app-header></app-header>

      <!-- Header de la página -->
      <div class="bg-white border-b border-slate-200 px-6 py-3 relative z-30 shadow-sm">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800 tracking-tight">Giro Cama</h2>
            <p class="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Pacientes con cambio de cama entre ayer y hoy</p>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 relative z-50">
              <mat-icon class="text-slate-400 text-[18px] w-5 h-5">filter_alt</mat-icon>
              <div class="relative">
                <button (click)="isServicioDropdownOpen.set(!isServicioDropdownOpen())" class="flex items-center justify-between w-full text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]">
                  <span class="truncate">{{ getServicioButtonText() }}</span>
                  <mat-icon class="text-[16px] w-4 h-4 text-slate-400">arrow_drop_down</mat-icon>
                </button>

                @if (isServicioDropdownOpen()) {
                  <!-- Backdrop -->
                  <div class="fixed inset-0 z-40" 
                       (click)="isServicioDropdownOpen.set(false)"
                       (keydown.escape)="isServicioDropdownOpen.set(false)"
                       tabindex="0"
                       role="button"
                       aria-label="Cerrar menú desplegable"></div>
                  
                  <div class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg">
                    <div class="p-2 border-b border-slate-100">
                      <div class="relative">
                        <mat-icon class="absolute left-2 top-1/2 -translate-y-1/2 text-[14px] w-3.5 h-3.5 text-slate-400">search</mat-icon>
                        <input type="text" 
                               [value]="servicioSearchTerm()" 
                               (input)="servicioSearchTerm.set($any($event.target).value)"
                               class="w-full pl-7 pr-2 py-1.5 text-[11px] border border-slate-300 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                               placeholder="Buscar servicio..."
                               (click)="$event.stopPropagation()">
                      </div>
                      <div class="flex justify-between mt-2 px-1 text-[11px] font-medium text-emerald-600">
                        <button (click)="selectAllServicios(); $event.stopPropagation()" class="hover:underline">Seleccionar todo</button>
                        <button (click)="clearServicios(); $event.stopPropagation()" class="hover:underline">Borrar</button>
                      </div>
                    </div>
                    <ul class="max-h-60 overflow-y-auto py-1 text-[11px]">
                      @for (servicio of filteredServiciosUnicos(); track servicio) {
                        <li>
                          <button (click)="toggleServicio(servicio); $event.stopPropagation()" class="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700">
                            <mat-icon class="text-[16px] w-4 h-4 shrink-0 mt-0.5" [class.text-emerald-600]="isServicioSelected(servicio)" [class.opacity-0]="!isServicioSelected(servicio)">
                              check
                            </mat-icon>
                            <span class="text-left leading-tight" [class.font-medium]="isServicioSelected(servicio)">{{ servicio }}</span>
                          </button>
                        </li>
                      }
                      @if (filteredServiciosUnicos().length === 0) {
                        <li class="px-3 py-2 text-slate-400 italic text-center">No hay resultados</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </div>
            <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 text-[11px] font-bold">
              <mat-icon class="text-[16px] w-4 h-4">info</mat-icon>
              {{ filteredRegistros().length }} CAMBIOS DETECTADOS
            </div>
            <button (click)="loadData()" class="flex items-center justify-center w-8 h-8 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors" title="Actualizar">
              <mat-icon class="text-[18px] w-5 h-5 flex items-center justify-center" [class.animate-spin]="loading()">refresh</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="flex-1 min-h-0 relative bg-slate-50 p-2 animate-in fade-in duration-300">
        <div class="outlook-card overflow-hidden h-full flex flex-col relative">
          <div class="overflow-auto flex-1">
            @if (loading()) {
              <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div class="flex flex-col items-center gap-3">
                  <mat-icon class="animate-spin text-emerald-600 text-[32px] w-8 h-8">refresh</mat-icon>
                  <p class="text-sm font-medium text-slate-600">Analizando cambios de cama...</p>
                </div>
              </div>
            } @else if (error()) {
              <div class="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                <mat-icon>error_outline</mat-icon>
                <p class="text-sm font-medium">{{ error() }}</p>
              </div>
            } @else if (filteredRegistros().length === 0) {
              <div class="flex flex-col items-center justify-center h-full text-slate-400 p-10">
                <mat-icon class="text-[64px] w-16 h-16 mb-4 opacity-20">hotel_class</mat-icon>
                <p class="text-lg font-medium text-slate-600">No se detectaron cambios de cama recientes</p>
                <p class="text-sm text-slate-400">Los cambios realizados entre ayer y hoy aparecerán aquí.</p>
              </div>
            } @else {
              <table class="w-full text-sm text-left whitespace-nowrap">
                <thead class="outlook-table-header text-xs uppercase sticky top-0 z-10">
                  <tr>
                    <th class="px-4 py-3 font-semibold w-10 text-center">#</th>
                    <th class="px-4 py-3 font-semibold min-w-[200px]">Paciente</th>
                    <th class="px-4 py-3 font-semibold min-w-[220px]">Giro Cama</th>
                    <th class="px-4 py-3 font-semibold min-w-[150px]">Ubicación</th>
                    <th class="px-4 py-3 font-semibold min-w-[200px]">Entidad</th>
                    <th class="px-4 py-3 font-semibold">Fecha Cambio</th>
                    <th class="px-4 py-3 font-semibold">Gestión Estancia</th>
                  </tr>
                </thead>
                <tbody class="text-slate-600 align-top bg-slate-50/50">
                  @for (item of filteredRegistros(); track item.cambio.id; let i = $index) {
                    <tr class="bg-white border-b-4 border-slate-100 hover:bg-slate-50 transition-colors cursor-default group focus:outline-none">
                      <!-- Enumeración -->
                      <td class="px-4 py-4 text-center">
                        <span class="text-[10px] font-bold text-slate-400 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          {{ i + 1 }}
                        </span>
                      </td>

                      <td class="px-4 py-4 text-[11px] whitespace-normal">
                        <div class="font-bold text-slate-900 mb-1">{{ item.nombre }}</div>
                        <div class="text-[10px] text-slate-500 font-mono leading-tight flex flex-col gap-0.5">
                          <div>HC: {{ item.hc }}</div>
                          <div>Ing: {{ item.ingreso || 'N/A' }}</div>
                        </div>
                      </td>

                      <td class="px-4 py-4 text-[11px] whitespace-normal">
                        <div class="flex flex-col gap-1 text-slate-700">
                          <div class="flex items-center gap-1" title="Cama Anterior">
                            <mat-icon class="text-[16px] w-4 h-4 text-red-500">logout</mat-icon>
                            <span class="font-semibold">{{ item.cambio.valor_antes }}</span>
                          </div>
                          <div class="flex items-center gap-1" title="Cama Nueva">
                            <mat-icon class="text-[16px] w-4 h-4 text-emerald-500">login</mat-icon>
                            <span class="font-semibold">{{ item.cambio.valor_nuevo }}</span>
                          </div>
                        </div>
                      </td>

                      <td class="px-4 py-4 text-[11px] whitespace-normal">
                        <div class="font-bold text-slate-800 mb-0.5">{{ item.area || 'N/A' }}</div>
                        <div class="text-[10px] text-slate-500 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">Cama: {{ item.cama || 'N/A' }}</div>
                      </td>

                      <td class="px-4 py-4 text-[11px] whitespace-normal">
                        <div class="text-slate-700 font-medium">{{ item.entidad }}</div>
                      </td>

                      <td class="px-4 py-4 text-[11px]">
                        <div class="font-bold text-slate-700">{{ item.cambio.cambiado_en | date:'dd/MM/yyyy':'UTC' }}</div>
                        <div class="text-[10px] text-slate-500 font-mono">{{ item.cambio.cambiado_en | date:'HH:mm':'UTC' }}</div>
                      </td>

                      <td class="px-4 py-4 text-[11px] whitespace-normal">
                        <div class="flex items-start justify-between gap-2 group/gestion">
                          <div class="flex flex-col gap-1 w-32">
                            <!-- Aut Tag -->
                            <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-1">
                              <span class="text-[10px] font-bold text-slate-600">Aut:</span>
                              @if (item.aut_estancia === 'SI') {
                                <span class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">SI</span>
                              } @else if (item.aut_estancia === 'NO') {
                                <span class="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">NO</span>
                              } @else if (item.aut_estancia === 'PGP') {
                                <span class="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold">PGP</span>
                              } @else if (item.aut_estancia === 'PP') {
                                <span class="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">PP</span>
                              } @else {
                                <span class="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold">PEND</span>
                              }
                            </div>
                            <!-- Gestión Tag -->
                            <div class="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
                              <span class="text-[9px] font-bold text-slate-500 uppercase">Próxima Gestión</span>
                              <span class="text-[11px] font-bold text-slate-800" [title]="item.fecha_proxima_gestion || item.gestion_estancia || 'Sin fecha'">
                                {{ item.fecha_proxima_gestion || item.gestion_estancia || '---' }}
                              </span>
                            </div>
                          </div>
                          <button (click)="openGestionModal(item)" class="text-slate-400 hover:text-slate-800 opacity-0 group-hover/gestion:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 shrink-0" title="Editar gestión">
                            <mat-icon class="text-[16px] w-4 h-4">edit</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    @if (editingGestionRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <mat-icon class="text-slate-500">manage_accounts</mat-icon>
              Gestión Estancia
            </h3>
            <button (click)="closeGestionModal()" class="text-slate-400 hover:text-slate-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="p-4 space-y-4">
            <div class="space-y-1">
              <label for="autInput" class="text-xs font-semibold text-slate-600 uppercase">Autorización Estancia</label>
              <select id="autInput" #autInput [value]="editingGestionRecord()?.['aut_estancia'] || 'NO'" (change)="0" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                <option value="SI">SI</option>
                <option value="NO">NO</option>
                <option value="PGP">PGP</option>
                <option value="PP">PP</option>
              </select>
            </div>
            
            @if (autInput.value === 'NO' || autInput.value === 'PGP' || autInput.value === 'PP') {
              <div class="space-y-1 animate-in fade-in duration-200">
                <label for="tipoContratoInput" class="text-xs font-semibold text-slate-600 uppercase">Tipo de Contrato ({{autInput.value}})</label>
                <select id="tipoContratoInput" #tipoContratoInput [value]="editingGestionRecord()?.['tipo_contrato_no_aut'] || ''" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                  <option value="">Seleccione...</option>
                  <option value="PGP">PGP</option>
                  <option value="NO">NO</option>
                  <option value="PP">PP</option>
                </select>
              </div>
            }
            <div class="space-y-1">
              <label for="gestionInput" class="text-xs font-semibold text-slate-600 uppercase">Frecuencia de Gestión (Días)</label>
              <div class="flex items-center gap-2">
                <span class="text-sm text-slate-500">Cada</span>
                <input id="gestionInput" #gestionInput type="number" min="0" [value]="extractDays(editingGestionRecord()?.['gestion_estancia'])" (input)="0" class="w-20 p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center">
                <span class="text-sm text-slate-500">días</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-1">Deje en 0 para "Integral - No se gestiona"</p>
            </div>
            <div class="space-y-1">
              <label for="nextDateInput" class="text-xs font-semibold text-slate-600 uppercase">Fecha Próxima Gestión (Calculada)</label>
              <input id="nextDateInput" type="date" [value]="calculateNextDate(gestionInput.value)" disabled class="w-full p-2 text-sm border border-slate-300 rounded bg-slate-100">
            </div>
          </div>
          <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
            <button (click)="closeGestionModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancelar</button>
            <button (click)="saveGestion(autInput.value, tipoContratoInput?.nativeElement?.value || '', gestionInput.value, calculateNextDate(gestionInput.value))" [disabled]="saving()" class="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
              }
              Guardar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class GiroCamaComponent implements OnInit {
  consolidadoService = inject(ConsolidadoService);
  epsGiroCamaService = inject(EpsGiroCamaService);
  
  registros = signal<GiroCamaRecord[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  selectedServicios = signal<string[] | null>(null);
  isServicioDropdownOpen = signal(false);
  servicioSearchTerm = signal('');

  servicios = computed(() => {
    const areas = this.registros()
      .filter(r => r.entidad && this.epsGiroCamaService.isGiroCama(r.entidad))
      .map(r => r.area)
      .filter(Boolean) as string[];
    return [...new Set(areas)].sort();
  });

  filteredServiciosUnicos = computed(() => {
    const term = this.servicioSearchTerm().toLowerCase();
    return this.servicios().filter(s => s.toLowerCase().includes(term));
  });

  getServicioButtonText() {
    const selected = this.selectedServicios();
    if (selected === null) return 'Todos los servicios';
    if (selected.length === 0) return 'Ninguno seleccionado';
    if (selected.length === 1) return selected[0];
    return `${selected.length} seleccionados`;
  }

  isServicioSelected(servicio: string): boolean {
    const selected = this.selectedServicios();
    if (selected === null) return true;
    return selected.includes(servicio);
  }

  toggleServicio(servicio: string) {
    const selected = this.selectedServicios();
    if (selected === null) {
      const all = this.servicios();
      this.selectedServicios.set(all.filter(s => s !== servicio));
    } else {
      if (selected.includes(servicio)) {
        this.selectedServicios.set(selected.filter(s => s !== servicio));
      } else {
        const next = [...selected, servicio];
        if (next.length === this.servicios().length) {
          this.selectedServicios.set(null);
        } else {
          this.selectedServicios.set(next);
        }
      }
    }
  }

  selectAllServicios() {
    this.selectedServicios.set(null);
  }

  clearServicios() {
    this.selectedServicios.set([]);
  }

  filteredRegistros = computed(() => {
    const selected = this.selectedServicios();
    const query = this.consolidadoService.searchQuery().toLowerCase();
    
    return this.registros().filter(r => {
      // Comparación robusta: ignorar espacios extra y diferencias de mayúsculas/minúsculas
      const entidadPaciente = (r.entidad || '').trim().toUpperCase();
      if (!entidadPaciente || !this.epsGiroCamaService.isGiroCama(entidadPaciente)) {
        return false;
      }

      const matchesService = selected === null || (r.area && selected.includes(r.area));
      const matchesQuery = !query || 
                           String(r.nombre || '').toLowerCase().includes(query) || 
                           String(r.hc || '').toLowerCase().includes(query) ||
                           String(r.ingreso || '').toLowerCase().includes(query) ||
                           String(r.area || '').toLowerCase().includes(query) ||
                           String(r.cama || '').toLowerCase().includes(query) ||
                           String(r.entidad || '').toLowerCase().includes(query) ||
                           String(r.cambio?.valor_antes || '').toLowerCase().includes(query) ||
                           String(r.cambio?.valor_nuevo || '').toLowerCase().includes(query);
      return matchesService && matchesQuery;
    });
  });
  
  editingGestionRecord = signal<GiroCamaRecord | null>(null);
  saving = signal(false);

  @ViewChild('tipoContratoInput') tipoContratoInput?: ElementRef<HTMLSelectElement>;

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.consolidadoService.getGiroCama();
      this.registros.set(data as GiroCamaRecord[]);
    } catch (err) {
      this.error.set('Error al cargar los cambios de cama. Por favor intente de nuevo.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  openGestionModal(record: GiroCamaRecord) {
    this.editingGestionRecord.set(record);
  }

  closeGestionModal() {
    this.editingGestionRecord.set(null);
  }

  extractDays(val: unknown): string {
    if (!val) return '';
    if (val === 'Integral - No se gestiona') return '0';
    const match = String(val).match(/\d+/);
    return match ? match[0] : '';
  }

  calculateNextDate(daysStr: string): string {
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days <= 0) return '';
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  async saveGestion(aut_estancia: string, tipo_contrato: string, gestion_estancia_days: string, fecha_proxima_gestion: string) {
    const record = this.editingGestionRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      let gestionStr = '';
      const days = parseInt(gestion_estancia_days, 10);
      if (isNaN(days) || days === 0) {
        gestionStr = 'Integral - No se gestiona';
      } else {
        gestionStr = `Cada ${days} días`;
      }

      await this.consolidadoService.updateRegistro(record.id, { 
        aut_estancia: aut_estancia,
        tipo_contrato_no_aut: (aut_estancia === 'NO' || aut_estancia === 'PGP' || aut_estancia === 'PP') ? tipo_contrato : null,
        gestion_estancia: gestionStr,
        fecha_proxima_gestion: fecha_proxima_gestion || null
      });
      
      this.closeGestionModal();
      await this.loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error saving gestion:', error);
      alert('Error al guardar la gestión de estancia');
    } finally {
      this.saving.set(false);
    }
  }
}
