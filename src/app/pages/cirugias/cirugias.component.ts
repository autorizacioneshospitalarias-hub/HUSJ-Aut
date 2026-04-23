import { Component, inject, signal, computed, effect } from '@angular/core';
import { CirugiaService } from '../../services/cirugia.service';
import { PacienteIngresoService } from '../../services/paciente-ingreso.service';
import { ConsolidadoService } from '../../services/consolidado.service';
import { CirugiasListComponent } from './cirugias-list.component';
import { CirugiaDetailComponent } from './cirugia-detail.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { Cirugia } from '../../models/cirugia';

@Component({
  selector: 'app-cirugias',
  standalone: true,
  imports: [CirugiasListComponent, CirugiaDetailComponent, HeaderComponent, MatIconModule, NgClass],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full">
      <!-- BROWSER-LIKE TABS -->
      @if (openCirugiaTabs().length > 0) {
        <div class="flex items-end px-2 pt-1.5 bg-slate-200 border-b border-slate-300 h-10 overflow-x-auto shrink-0 scrollbar-hide">
          <!-- Open Cirugia Tabs -->
          @for (c of openCirugiaTabs(); track c.id) {
            <button (click)="activeTabId.set(c.id)"
                    class="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[200px] max-w-[250px] rounded-t-lg border-t border-x text-[11px] font-medium transition-colors group"
                    [ngClass]="activeTabId() === c.id ? 'bg-emerald-50 border-emerald-200 text-emerald-800 relative z-10 translate-y-[1px]' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-50'">
              <div class="flex items-center gap-1 overflow-hidden">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span class="truncate">{{ c.patientName }} - Liquidación de cirugías</span>
              </div>
              <button (click)="$event.stopPropagation(); closeCirugiaTab(c.id)" 
                      (keyup.enter)="$event.stopPropagation(); closeCirugiaTab(c.id)"
                      class="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors">
                <mat-icon class="text-[12px] w-3 h-3 flex items-center justify-center">close</mat-icon>
              </button>
            </button>
          }
        </div>
      }

      <!-- Header with Icons -->
      <app-header></app-header>

      <!-- Header de la página (Only visible in Main View) -->
      @if (activeTabId() === 'main') {
        <div class="bg-white border-b border-slate-200 px-6 py-3 relative z-30">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-800 tracking-tight">Liquidación de Cirugías</h2>
            <div class="flex items-center gap-3">
              <!-- Filter Dropdown -->
              <div class="flex items-center gap-2 relative z-50">
                <mat-icon class="text-slate-400 text-[18px] w-5 h-5">filter_alt</mat-icon>
                
                <!-- Fecha Filter -->
                <input type="date" 
                       [value]="selectedFecha()"
                       (change)="selectedFecha.set($any($event.target).value || null)"
                       class="text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">

                <!-- Ubicacion Filter -->
                <div class="relative">
                  <button (click)="isUbicacionDropdownOpen.set(!isUbicacionDropdownOpen())" class="flex items-center justify-between w-full text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]">
                    <span class="truncate">{{ selectedUbicacion() || 'Ubicación' }}</span>
                    <mat-icon class="text-[16px] w-4 h-4 text-slate-400">arrow_drop_down</mat-icon>
                  </button>

                  @if (isUbicacionDropdownOpen()) {
                    <div class="fixed inset-0 z-40" (click)="isUbicacionDropdownOpen.set(false)"></div>
                    <div class="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                      <ul class="max-h-60 overflow-y-auto py-1 text-[11px]">
                        <li>
                          <button (click)="selectedUbicacion.set(null); isUbicacionDropdownOpen.set(false)" class="w-full flex items-center px-3 py-1.5 hover:bg-slate-50 text-slate-700">Todos</button>
                        </li>
                        @for (ubicacion of ubicacionesUnicas(); track ubicacion) {
                          <li>
                            <button (click)="selectedUbicacion.set(ubicacion); isUbicacionDropdownOpen.set(false)" class="w-full flex items-center px-3 py-1.5 hover:bg-slate-50 text-slate-700">{{ ubicacion }}</button>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>

                <!-- Entidad Filter -->
                <div class="relative">
                  <button (click)="isEntidadDropdownOpen.set(!isEntidadDropdownOpen())" class="flex items-center justify-between w-full text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]">
                    <span class="truncate">{{ selectedEntidad() || 'Entidad' }}</span>
                    <mat-icon class="text-[16px] w-4 h-4 text-slate-400">arrow_drop_down</mat-icon>
                  </button>

                  @if (isEntidadDropdownOpen()) {
                    <div class="fixed inset-0 z-40" (click)="isEntidadDropdownOpen.set(false)"></div>
                    <div class="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                      <ul class="max-h-60 overflow-y-auto py-1 text-[11px]">
                        <li>
                          <button (click)="selectedEntidad.set(null); isEntidadDropdownOpen.set(false)" class="w-full flex items-center px-3 py-1.5 hover:bg-slate-50 text-slate-700">Todos</button>
                        </li>
                        @for (entidad of entidadesUnicas(); track entidad) {
                          <li>
                            <button (click)="selectedEntidad.set(entidad); isEntidadDropdownOpen.set(false)" class="w-full flex items-center px-3 py-1.5 hover:bg-slate-50 text-slate-700">{{ entidad }}</button>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>

                <!-- Estado Filter -->
                <div class="relative">
                  <button (click)="isEstadoDropdownOpen.set(!isEstadoDropdownOpen())" class="flex items-center justify-between w-full text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]">
                    <span class="truncate">{{ getEstadoButtonText() }}</span>
                    <mat-icon class="text-[16px] w-4 h-4 text-slate-400">arrow_drop_down</mat-icon>
                  </button>

                  @if (isEstadoDropdownOpen()) {
                    <!-- Backdrop -->
                    <div class="fixed inset-0 z-40" 
                         (click)="isEstadoDropdownOpen.set(false)"
                         (keydown.escape)="isEstadoDropdownOpen.set(false)"
                         tabindex="0"
                         role="button"
                         aria-label="Cerrar filtro"></div>
                    
                    <!-- Dropdown Panel -->
                    <div class="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <div class="p-2 border-b border-slate-100 bg-slate-50">
                        <div class="relative">
                          <mat-icon class="absolute left-2 top-1.5 text-slate-400 text-[14px] w-4 h-4">search</mat-icon>
                          <input type="text" 
                                 [value]="estadoSearchTerm()"
                                 (input)="estadoSearchTerm.set($any($event.target).value)"
                                 class="w-full pl-7 pr-2 py-1.5 text-[11px] border border-slate-300 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                 placeholder="Buscar estado..."
                                 (click)="$event.stopPropagation()">
                        </div>
                        <div class="flex justify-between mt-2 px-1 text-[11px] font-medium text-emerald-600">
                          <button (click)="selectAllEstados(); $event.stopPropagation()" class="hover:underline">Seleccionar todo</button>
                          <button (click)="clearEstados(); $event.stopPropagation()" class="hover:underline">Borrar</button>
                        </div>
                      </div>
                      <ul class="max-h-60 overflow-y-auto py-1 text-[11px]">
                        @for (estado of filteredEstadosUnicos(); track estado) {
                          <li>
                            <button (click)="toggleEstado(estado); $event.stopPropagation()" class="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700">
                              <mat-icon class="text-[16px] w-4 h-4 shrink-0 mt-0.5" [class.text-emerald-600]="isEstadoSelected(estado)" [class.opacity-0]="!isEstadoSelected(estado)">
                                check
                              </mat-icon>
                              <span class="text-left leading-tight" [class.font-medium]="isEstadoSelected(estado)">{{ estado }}</span>
                            </button>
                          </li>
                        }
                        @if (filteredEstadosUnicos().length === 0) {
                          <li class="px-3 py-2 text-slate-400 italic text-center">No hay resultados</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              </div>

              <button (click)="refreshAll()" class="flex items-center justify-center w-8 h-8 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors" title="Actualizar">
                <mat-icon class="text-[18px] w-5 h-5 flex items-center justify-center" [class.animate-spin]="cirugiaService.cargando() || ingresoService.cargando()">refresh</mat-icon>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Contenido -->
      <div class="flex-1 min-h-0 relative">
        @if (activeTabId() === 'main') {
          @if (cirugiaService.cargando()) {
            <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <div class="flex flex-col items-center gap-3">
                <mat-icon class="animate-spin text-emerald-600 text-[32px] w-8 h-8">refresh</mat-icon>
                <p class="text-sm font-medium text-slate-600">Cargando liquidaciones...</p>
              </div>
            </div>
          }

          @if (cirugiaService.error()) {
            <div class="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <mat-icon>error_outline</mat-icon>
                <div>
                  <p class="font-medium">Error al cargar los datos</p>
                  <p class="text-sm opacity-80">{{ cirugiaService.error() }}</p>
                </div>
              </div>
              <button (click)="retryLoad()" class="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                <mat-icon class="text-sm">refresh</mat-icon>
                Reintentar
              </button>
            </div>
          }

          <app-cirugias-list [cirugias]="cirugiasFiltradas()" (cirugiaClick)="openCirugiaTab($event)"></app-cirugias-list>
        } @else {
          @let activeCirugia = getActiveCirugia();
          @if (activeCirugia) {
            <app-cirugia-detail [cirugia]="activeCirugia"></app-cirugia-detail>
          }
        }
      </div>
    </div>
  `
})
export class CirugiasComponent {
  cirugiaService = inject(CirugiaService);
  ingresoService = inject(PacienteIngresoService);
  consolidadoService = inject(ConsolidadoService);
  
  activeTabId = signal<string>('main');
  openCirugiaTabs = signal<Cirugia[]>([]);

  // Filter Dropdown
  isEstadoDropdownOpen = signal(false);
  estadoSearchTerm = signal('');
  selectedEstados = signal<string[] | null>(null);

  isUbicacionDropdownOpen = signal(false);
  isEntidadDropdownOpen = signal(false);

  // New filters
  selectedFecha = signal<string | null>(null);
  selectedUbicacion = signal<string | null>(null);
  selectedEntidad = signal<string | null>(null);

  constructor() {
    // Load patient admissions to enable location lookup
    this.ingresoService.loadIngresos();
    this.consolidadoService.loadRegistros();

    effect(() => {
      const query = this.cirugiaService.searchQuery();
      this.cirugiaService.searchCirugias(query);
    });
  }

  getEstadoButtonText(): string {
    const selected = this.selectedEstados();
    if (selected === null) return 'Todos los estados';
    if (selected.length === 0) return 'Ningún estado seleccionado';
    if (selected.length === 1) return selected[0];
    return `${selected.length} estados seleccionados`;
  }

  selectAllEstados() {
    this.selectedEstados.set(null);
  }

  clearEstados() {
    this.selectedEstados.set([]);
  }

  isEstadoSelected(estado: string): boolean {
    const selected = this.selectedEstados();
    if (selected === null) return true;
    return selected.includes(estado);
  }

  toggleEstado(estado: string) {
    const selected = this.selectedEstados();
    if (selected === null) {
      const all = this.estadosUnicos();
      this.selectedEstados.set(all.filter(s => s !== estado));
    } else {
      if (selected.includes(estado)) {
        this.selectedEstados.set(selected.filter(s => s !== estado));
      } else {
        const next = [...selected, estado];
        if (next.length === this.estadosUnicos().length) {
          this.selectedEstados.set(null);
        } else {
          this.selectedEstados.set(next);
        }
      }
    }
  }

  estadosUnicos = computed(() => {
    const records = this.cirugiaService.cirugias();
    const estados = records.map(r => r.estado).filter(Boolean) as string[];
    return [...new Set(estados)].sort();
  });

  filteredEstadosUnicos = computed(() => {
    const term = this.estadoSearchTerm().toLowerCase();
    return this.estadosUnicos().filter(s => s.toLowerCase().includes(term));
  });

  // Ubicacion filter
  ubicacionesUnicas = computed(() => {
    const records = this.cirugiaService.cirugias();
    const ubicaciones = records.map(r => r.specialty).filter(Boolean) as string[];
    return [...new Set(ubicaciones)].sort();
  });

  // Entidad filter
  entidadesUnicas = computed(() => {
    const records = this.cirugiaService.cirugias();
    const entidades = records.map(r => r.entity).filter(Boolean) as string[];
    return [...new Set(entidades)].sort();
  });

  cirugiasFiltradas = computed(() => {
    let cirugias = this.cirugiaService.cirugias();
    const selectedEstados = this.selectedEstados();
    const selectedFecha = this.selectedFecha();
    const selectedUbicacion = this.selectedUbicacion();
    const selectedEntidad = this.selectedEntidad();
    
    if (selectedEstados !== null) {
      if (selectedEstados.length === 0) {
        cirugias = [];
      } else {
        cirugias = cirugias.filter(c => selectedEstados.includes(c.estado as string));
      }
    }

    if (selectedFecha) {
      cirugias = cirugias.filter(c => c.date === selectedFecha);
    }

    if (selectedUbicacion) {
      cirugias = cirugias.filter(c => c.specialty === selectedUbicacion);
    }

    if (selectedEntidad) {
      cirugias = cirugias.filter(c => c.entity === selectedEntidad);
    }

    return cirugias;
  });

  refreshAll() {
    this.ingresoService.loadIngresos();
    this.consolidadoService.loadRegistros();
    this.cirugiaService.loadCirugias();
  }
  
  retryLoad() {
    this.ingresoService.loadIngresos();
    this.consolidadoService.loadRegistros();
    const query = this.cirugiaService.searchQuery();
    if (query && query.length >= 3) {
      this.cirugiaService.searchCirugias(query);
    } else {
      this.cirugiaService.loadCirugias();
    }
  }

  openCirugiaTab(cirugia: Cirugia) {
    const currentTabs = this.openCirugiaTabs();
    if (!currentTabs.find(c => c.id === cirugia.id)) {
      // Limit to 5 open tabs
      if (currentTabs.length >= 5) {
        currentTabs.shift();
      }
      this.openCirugiaTabs.set([...currentTabs, cirugia]);
    }
    this.activeTabId.set(cirugia.id);
  }

  closeCirugiaTab(id: string) {
    const updated = this.openCirugiaTabs().filter(c => c.id !== id);
    this.openCirugiaTabs.set(updated);
    if (this.activeTabId() === id) {
      this.activeTabId.set('main');
    }
  }

  getActiveCirugia(): Cirugia | undefined {
    return this.openCirugiaTabs().find(c => c.id === this.activeTabId());
  }
}

