import { Component, inject, computed, effect, signal } from '@angular/core';
import { ConsolidadoService, ConsolidadoRecord } from '../../services/consolidado.service';
import { EpsSinConvenioService } from '../../services/eps-sin-convenio.service';
import { ConsolidadoListComponent } from '../consolidado/consolidado-list.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-sin-convenio',
  standalone: true,
  imports: [ConsolidadoListComponent, HeaderComponent, MatIconModule, DecimalPipe],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full relative">
      <!-- Header with Icons -->
      <app-header></app-header>

      <!-- Header de la página -->
      <div class="bg-white border-b border-slate-200 px-6 py-3 relative z-30 shadow-sm">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <h2 class="text-xl font-bold text-slate-800 tracking-tight">Pacientes Sin Convenio</h2>
          
          <div class="flex items-center gap-3">
            <!-- Métrica Profesional -->
            <div class="hidden sm:flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                  <mat-icon class="text-slate-500 text-[14px] w-3.5 h-3.5">groups</mat-icon>
                </div>
                <div class="flex flex-col">
                  <span class="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Total Pacientes</span>
                  <div class="flex items-baseline gap-1">
                    <span class="text-sm font-black text-slate-900 leading-none">{{ totalSinConvenio() }}</span>
                    <span class="text-[8px] font-bold text-slate-400 uppercase">Casos</span>
                  </div>
                </div>
              </div>
              
              <div class="w-px h-6 bg-slate-100"></div>
              
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                  <mat-icon class="text-emerald-500 text-[14px] w-3.5 h-3.5">assignment_turned_in</mat-icon>
                </div>
                <div class="flex flex-col">
                  <span class="text-[8px] font-bold text-emerald-500 uppercase tracking-wider leading-none mb-1">Trámites Activos</span>
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-sm font-black text-emerald-600 leading-none">{{ tramitesActivos() }}</span>
                    <div class="flex items-center text-[8px] font-bold text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded-sm border border-emerald-100 leading-none">
                      {{ (tramitesActivos() / (totalSinConvenio() || 1)) * 100 | number:'1.0-0' }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filtro de Servicios (Multi-select) -->
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
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="flex-1 min-h-0 relative">
        @if (consolidadoService.cargando()) {
          <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div class="flex flex-col items-center gap-3">
              <mat-icon class="animate-spin text-emerald-600 text-[32px] w-8 h-8">refresh</mat-icon>
              <p class="text-sm font-medium text-slate-600">Cargando consolidado...</p>
            </div>
          </div>
        }

        @if (consolidadoService.error()) {
          <div class="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center gap-3">
            <mat-icon>error_outline</mat-icon>
            <div>
              <p class="font-medium">Error al cargar los datos</p>
              <p class="text-sm opacity-80">{{ consolidadoService.error() }}</p>
            </div>
          </div>
        }

        <app-consolidado-list [registros]="registrosFiltrados()"></app-consolidado-list>
      </div>
    </div>
  `
})
export class SinConvenioComponent {
  consolidadoService = inject(ConsolidadoService);
  epsSinConvenioService = inject(EpsSinConvenioService);
  
  selectedServicios = signal<string[] | null>(null);
  isServicioDropdownOpen = signal(false);
  servicioSearchTerm = signal('');

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
      const all = this.serviciosUnicos();
      this.selectedServicios.set(all.filter(s => s !== servicio));
    } else {
      if (selected.includes(servicio)) {
        this.selectedServicios.set(selected.filter(s => s !== servicio));
      } else {
        const next = [...selected, servicio];
        if (next.length === this.serviciosUnicos().length) {
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

  serviciosUnicos = computed(() => {
    const records = this.consolidadoService.registros().filter((r: ConsolidadoRecord) => 
      r['entidad'] && this.epsSinConvenioService.isSinConvenio(String(r['entidad']).trim())
    );
    const areas = records.map((r: ConsolidadoRecord) => r['area']).filter(Boolean) as string[];
    return [...new Set(areas)].sort();
  });

  filteredServiciosUnicos = computed(() => {
    const term = this.servicioSearchTerm().toLowerCase();
    return this.serviciosUnicos().filter(s => s.toLowerCase().includes(term));
  });

  totalSinConvenio = computed(() => {
    return this.consolidadoService.registros().filter((r: ConsolidadoRecord) => 
      r['entidad'] && this.epsSinConvenioService.isSinConvenio(String(r['entidad']).trim())
    ).length;
  });

  tramitesActivos = computed(() => {
    return this.consolidadoService.registros().filter((r: ConsolidadoRecord) => 
      r['entidad'] && 
      this.epsSinConvenioService.isSinConvenio(String(r['entidad']).trim()) &&
      this.hasTramiteHistory(r)
    ).length;
  });

  constructor() {
    effect(() => {
      const query = this.consolidadoService.searchQuery();
      this.consolidadoService.searchRegistros(query);
    });
  }

  hasTramiteHistory(record: ConsolidadoRecord): boolean {
    try {
      const hist = record['nombre_notif'];
      if (typeof hist === 'string' && hist.trim().startsWith('[')) {
        return JSON.parse(hist).length > 0;
      }
      if (Array.isArray(hist)) {
        return hist.length > 0;
      }
      if (typeof hist === 'string' && hist.trim().length > 0) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  registrosFiltrados = computed(() => {
    let registros = this.consolidadoService.registros();
    
    // Filtro principal: Solo mostrar los que están SIN CONVENIO
    registros = registros.filter((r: ConsolidadoRecord) => r['entidad'] && this.epsSinConvenioService.isSinConvenio(String(r['entidad']).trim()));

    const selected = this.selectedServicios();
    if (selected !== null) {
      if (selected.length === 0) {
        registros = []; // None selected
      } else {
        registros = registros.filter((r: ConsolidadoRecord) => selected.includes(r['area'] as string));
      }
    }

    return registros;
  });
}
