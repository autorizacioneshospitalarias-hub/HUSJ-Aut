import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ConsolidadoService, ConsolidadoRecord, HistorialCambio } from '../../services/consolidado.service';
import { EpsGiroCamaService } from '../../services/eps-giro-cama.service';
import { HeaderComponent } from '../../layout/header.component';
import { LucideAngularModule, Filter, ChevronDown, Search, Check, Info, RefreshCw, PenLine, UserCog, X, AlertCircle, Bed, LogOut, LogIn, MapPin, Building2 } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GiroCamaRecord extends ConsolidadoRecord {
  cambio: HistorialCambio;
}

@Component({
  selector: 'app-giro-cama',
  standalone: true,
  imports: [HeaderComponent, LucideAngularModule, DatePipe],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full relative">
      <app-header></app-header>

      <!-- Header de la página -->
      <div class="bg-white border-b border-slate-200 px-6 py-3 relative z-30">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800 tracking-tight">Giro Cama</h2>
            <p class="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Pacientes con cambio de cama entre ayer y hoy</p>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 relative z-50">
              <lucide-icon [name]="Filter" class="w-5 h-5 text-slate-400"></lucide-icon>
              <div class="relative">
                <button (click)="isServicioDropdownOpen.set(!isServicioDropdownOpen())" class="flex items-center justify-between w-full text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]">
                  <span class="truncate">{{ getServicioButtonText() }}</span>
                  <lucide-icon [name]="ChevronDown" class="w-4 h-4 text-slate-400"></lucide-icon>
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
                        <lucide-icon [name]="Search" class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"></lucide-icon>
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
                            <div class="w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5"
                                 [class.bg-white]="isServicioSelected(servicio)"
                                 [class.border-slate-300]="isServicioSelected(servicio)">
                              @if (isServicioSelected(servicio)) {
                                <lucide-icon [name]="Check" class="w-3 h-3 text-black"></lucide-icon>
                              }
                            </div>
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
            <div class="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 rounded-md border border-slate-300 text-[11px] font-bold">
              <lucide-icon [name]="Info" class="w-4 h-4 text-slate-500"></lucide-icon>
              {{ filteredRegistros().length }} CAMBIOS DETECTADOS
            </div>
            <button (click)="loadData()" class="flex items-center justify-center w-8 h-8 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors" title="Actualizar">
              <lucide-icon [name]="RefreshCw" class="w-5 h-5" [class.animate-spin]="loading()"></lucide-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="flex-1 min-h-0 relative bg-slate-50 animate-in fade-in duration-300">
        <div class="max-w-[1200px] mx-auto overflow-hidden h-full flex flex-col relative bg-white border-x border-slate-200 shadow-sm">
          <div class="overflow-auto flex-1">
            @if (loading()) {
              <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div class="flex flex-col items-center gap-3">
                  <lucide-icon [name]="RefreshCw" class="animate-spin text-emerald-600 w-8 h-8"></lucide-icon>
                  <p class="text-sm font-medium text-slate-600">Analizando cambios de cama...</p>
                </div>
              </div>
            } @else if (error()) {
              <div class="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                <lucide-icon [name]="AlertCircle" class="w-5 h-5"></lucide-icon>
                <p class="text-sm font-medium">{{ error() }}</p>
              </div>
            } @else if (filteredRegistros().length === 0) {
              <div class="flex flex-col items-center justify-center h-full text-slate-400 p-10">
                <lucide-icon [name]="Bed" class="w-16 h-16 mb-4 opacity-20"></lucide-icon>
                <p class="text-lg font-medium text-slate-600">No se detectaron cambios de cama recientes</p>
                <p class="text-sm text-slate-400">Los cambios realizados entre ayer y hoy aparecerán aquí.</p>
              </div>
            } @else {
              <table class="w-full text-sm text-left whitespace-nowrap">
                <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th class="px-4 py-3 font-medium w-10 text-center">#</th>
                    <th class="px-4 py-3 font-medium min-w-[150px]">
                      <div class="flex items-center gap-2">
                        <lucide-icon [name]="MapPin" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                        <span>Ubicación</span>
                      </div>
                    </th>
                    <th class="px-4 py-3 font-medium min-w-[200px]">Paciente</th>
                    <th class="px-4 py-3 font-medium min-w-[120px]">Giro cama</th>
                    <th class="px-4 py-3 font-medium min-w-[150px] max-w-[250px] whitespace-normal">
                      <div class="flex items-center gap-2">
                        <lucide-icon [name]="Building2" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                        <span>Entidad</span>
                      </div>
                    </th>
                    <th class="px-4 py-3 font-medium">Fecha cambio</th>
                    <th class="px-4 py-3 font-medium min-w-[180px]">Gestión estancia</th>
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
                        <div class="font-bold text-slate-800 mb-0.5">{{ item.area || 'N/A' }}</div>
                        <div class="text-[10px] text-slate-500 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">Cama: {{ item.cama || 'N/A' }}</div>
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
                            <lucide-icon [name]="LogOut" class="w-4 h-4 text-red-500"></lucide-icon>
                            <span class="font-semibold">{{ item.cambio.valor_antes }}</span>
                          </div>
                          <div class="flex items-center gap-1" title="Cama Nueva">
                            <lucide-icon [name]="LogIn" class="w-4 h-4 text-emerald-500"></lucide-icon>
                            <span class="font-semibold">{{ item.cambio.valor_nuevo }}</span>
                          </div>
                        </div>
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
                                <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                                  <lucide-icon [name]="Check" class="w-2.5 h-2.5"></lucide-icon>
                                  SI
                                </span>
                              } @else if (item.aut_estancia === 'NO') {
                                <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold">
                                  <lucide-icon [name]="X" class="w-2.5 h-2.5"></lucide-icon>
                                  NO
                                </span>
                              } @else if (item.aut_estancia === 'PGP') {
                                <span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-[9px] font-bold">PGP</span>
                              } @else if (item.aut_estancia === 'PP') {
                                <span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-[9px] font-bold">PP</span>
                              } @else {
                                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-[9px] font-bold uppercase">Pend</span>
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
                          <div class="flex flex-col items-center gap-1 shrink-0">
                            <button (click)="openGestionModal(item)" class="text-slate-400 hover:text-slate-800 opacity-0 group-hover/gestion:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 shrink-0" title="Editar gestión">
                              <lucide-icon [name]="PenLine" class="w-4 h-4"></lucide-icon>
                            </button>
                          </div>
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
              <lucide-icon [name]="UserCog" class="w-5 h-5 text-slate-500"></lucide-icon>
              Gestión estancia
            </h3>
            <button (click)="closeGestionModal()" class="text-slate-400 hover:text-slate-600">
              <lucide-icon [name]="X" class="w-5 h-5"></lucide-icon>
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
              <label for="frecuenciaInput" class="text-xs font-semibold text-slate-600 uppercase">Frecuencia de Gestión (Días)</label>
              <div class="flex items-center gap-2">
                <span class="text-sm text-slate-500">Cada</span>
                <select id="frecuenciaInput" [value]="getFrecuenciaSelectValue()" (change)="onFrecuenciaSelectChange($any($event.target).value)" class="p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white min-w-[80px]">
                  <option value="1">1</option>
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="20">20</option>
                  <option value="0">Ninguno</option>
                  <option value="otro">Otro</option>
                </select>
                @if (getFrecuenciaSelectValue() === 'otro') {
                  <input type="number" 
                         [value]="gestionDiasInput()" 
                         (input)="onDiasManualChange($any($event.target).value)" 
                         class="w-20 p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center bg-white">
                }
                <span class="text-sm text-slate-500">días</span>
              </div>
            </div>
            <div class="space-y-1">
              <label for="nextDateInput" class="text-xs font-semibold text-slate-600 uppercase">Fecha Próxima Gestión</label>
              <input id="nextDateInput" type="date" [value]="fechaGestionInputValue()" (change)="onFechaGestionChange($any($event.target).value)" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
              <p class="text-[10px] text-slate-500 mt-1">Si borra la fecha, no se gestionará.</p>
            </div>
          </div>
          <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
            <button (click)="closeGestionModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancelar</button>
            <button (click)="saveGestion(autInput.value, tipoContratoInput?.nativeElement?.value || '', fechaGestionInputValue())" [disabled]="saving()" class="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <lucide-icon [name]="RefreshCw" class="animate-spin w-4 h-4"></lucide-icon>
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
export class GiroCamaComponent implements OnInit, OnDestroy {
  consolidadoService = inject(ConsolidadoService);
  epsGiroCamaService = inject(EpsGiroCamaService);

  // Icons
  Filter = Filter;
  ChevronDown = ChevronDown;
  Search = Search;
  Check = Check;
  Info = Info;
  RefreshCw = RefreshCw;
  PenLine = PenLine;
  UserCog = UserCog;
  X = X;
  AlertCircle = AlertCircle;
  Bed = Bed;
  LogOut = LogOut;
  LogIn = LogIn;
  MapPin = MapPin;
  Building2 = Building2;
  
  registros = signal<GiroCamaRecord[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  selectedServicios = signal<string[] | null>(null);
  isServicioDropdownOpen = signal(false);
  servicioSearchTerm = signal('');

  private realtimeChannel?: RealtimeChannel;

  ngOnInit() {
    this.loadData();
    this.realtimeChannel = this.consolidadoService.suscribirGiroCama(() => {
      console.log('🔄 Realtime: historial_cambios actualizado');
      this.loadData();
    });
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

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

  fechaGestionInputValue = signal<string>('');
  gestionBaseDate = signal<string>('');
  gestionDiasInput = signal<number | null>(null);

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
    
    // Set base date
    const dbDate = record['fecha_proxima_gestion'] as string || '';
    const todayStr = new Date().toISOString().split('T')[0];
    this.gestionBaseDate.set(dbDate || todayStr);
    
    this.fechaGestionInputValue.set(dbDate);

    const dbDaysStr = this.extractDays(record['gestion_estancia']);
    if (dbDaysStr) {
        this.gestionDiasInput.set(parseInt(dbDaysStr, 10));
    } else {
        this.gestionDiasInput.set(dbDate ? null : 0);
    }
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

  addDays(dateStr: string, days: number): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  diffDays(baseStr: string, targetStr: string): number {
    if (!baseStr || !targetStr) return 0;
    const bp = baseStr.split('-');
    const tp = targetStr.split('-');
    const baseDate = new Date(parseInt(bp[0], 10), parseInt(bp[1], 10) - 1, parseInt(bp[2], 10));
    const targetDate = new Date(parseInt(tp[0], 10), parseInt(tp[1], 10) - 1, parseInt(tp[2], 10));
    const diffTime = targetDate.getTime() - baseDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  onFrecuenciaSelectChange(value: string) {
    if (value === '0') {
      this.gestionDiasInput.set(null);
      this.fechaGestionInputValue.set('');
    } else if (value === 'otro') {
      const curr = this.gestionDiasInput();
      if (!curr || [1,3,5,20].includes(curr)) {
         this.gestionDiasInput.set(7); // Valor sugerido si presionan 'Otro' sin valor previo
         this.fechaGestionInputValue.set(this.addDays(this.gestionBaseDate(), 7));
      }
    } else {
      const days = parseInt(value, 10);
      this.gestionDiasInput.set(days);
      this.fechaGestionInputValue.set(this.addDays(this.gestionBaseDate(), days));
    }
  }

  onDiasManualChange(daysStr: string) {
    const days = parseInt(daysStr, 10);
    if (!isNaN(days) && days > 0) {
      this.gestionDiasInput.set(days);
      this.fechaGestionInputValue.set(this.addDays(this.gestionBaseDate(), days));
    } else {
      this.gestionDiasInput.set(null);
      this.fechaGestionInputValue.set('');
    }
  }

  onFechaGestionChange(fecha: string) {
    this.fechaGestionInputValue.set(fecha);
    if (fecha) {
      const diff = this.diffDays(this.gestionBaseDate(), fecha);
      this.gestionDiasInput.set(diff > 0 ? diff : 0);
    } else {
      this.gestionDiasInput.set(null);
    }
  }

  getFrecuenciaSelectValue(): string {
    const days = this.gestionDiasInput();
    if (days === null || days <= 0) return '0';
    if ([1, 3, 5, 20].includes(days)) return days.toString();
    return 'otro';
  }

  calculateDaysNumber(dateStr: string): number {
    return this.diffDays(this.gestionBaseDate(), dateStr);
  }

  calculateDays(dateStr: string): string {
    const days = this.calculateDaysNumber(dateStr);
    return days > 0 ? days.toString() : '0';
  }

  onDaysInputChange(daysStr: string) {
    this.onDiasManualChange(daysStr);
  }

  async saveGestion(aut_estancia: string, tipo_contrato: string, fecha_proxima_gestion: string) {
    const record = this.editingGestionRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      let gestionStr = 'Integral - No se gestiona';
      const days = this.gestionDiasInput();
      
      if (fecha_proxima_gestion && days !== null && days > 0) {
         gestionStr = `Cada ${days} días`;
      } else {
         fecha_proxima_gestion = ''; // Don't save if there's no valid frequency
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
