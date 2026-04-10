import { Component, inject, computed, effect, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConsolidadoService, ConsolidadoRecord } from '../../services/consolidado.service';
import { AreaAgrupacionService } from '../../services/area-agrupacion.service';
import { ValidacionDerechosConfigService } from '../../services/validacion-derechos-config.service';
import { ConsolidadoListComponent } from './consolidado-list.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, Filter, ChevronDown, Check, Search, X, LayoutGrid, ListFilter } from 'lucide-angular';

// MODIFICADO: consolidado.component.ts no necesita cambios para el Realtime
// porque consolidado.service.ts ya tiene la suscripción en iniciarRealtime()
// y llama a loadRegistros() automáticamente cuando base_hoy cambia.

@Component({
  selector: 'app-consolidado',
  standalone: true,
  imports: [ConsolidadoListComponent, HeaderComponent, MatIconModule, LucideAngularModule],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full relative">
      <!-- Header with Icons -->
      <app-header></app-header>

      <!-- Header de la página -->
      <div class="bg-white border-b border-slate-200 px-6 py-3 relative z-30">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <h2 class="text-xl font-bold text-slate-800 tracking-tight">
            @switch (activeView()) {
              @case ('pgp_aic') { Confirmación PGP AIC }
              @case ('estancias_nuevas') { Estancias Nuevas }
              @case ('seguimiento') { Seguimiento }
              @case ('validacion_derechos') { Validación de derechos }
              @default { Consolidado Estancia }
            }
          </h2>
          
          <div class="flex items-center gap-3">
            <!-- Consolidated Filter -->
            <div class="relative z-50">
              <button (click)="isServicioDropdownOpen.set(!isServicioDropdownOpen()); isAreaGroupDropdownOpen.set(false)" 
                      class="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                <lucide-icon [name]="ListFilter" class="w-4 h-4 text-slate-500"></lucide-icon>
                <span>Filtros</span>
                @if (hasActiveFilters()) {
                  <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                }
                <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 text-slate-400 ml-1"></lucide-icon>
              </button>

              @if (isServicioDropdownOpen()) {
                <!-- Backdrop -->
                <div class="fixed inset-0 z-40" 
                     (click)="isServicioDropdownOpen.set(false)"
                     (keydown.escape)="isServicioDropdownOpen.set(false)"
                     tabindex="0"
                     role="button"
                     aria-label="Cerrar menú desplegable"></div>
                
                <div class="absolute right-0 z-50 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <!-- Area Selection -->
                  <div class="p-3 border-b border-slate-100 bg-slate-50/50">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Grupo de Área</div>
                    <div class="flex flex-wrap gap-2">
                      <button (click)="selectedAreaGroup.set(null)" 
                              [class]="selectedAreaGroup() === null ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                              class="px-2.5 py-1 text-[10px] font-bold border rounded-md transition-all">
                        Todas
                      </button>
                      <button (click)="selectedAreaGroup.set('Urgencias')" 
                              [class]="selectedAreaGroup() === 'Urgencias' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                              class="px-2.5 py-1 text-[10px] font-bold border rounded-md transition-all">
                        Urgencias
                      </button>
                      <button (click)="selectedAreaGroup.set('Hospitalización')" 
                              [class]="selectedAreaGroup() === 'Hospitalización' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                              class="px-2.5 py-1 text-[10px] font-bold border rounded-md transition-all">
                        Hospitalización
                      </button>
                    </div>
                  </div>

                  <!-- Servicio Search -->
                  <div class="p-3 border-b border-slate-100">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Servicios</div>
                    <div class="relative">
                      <lucide-icon [name]="Search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"></lucide-icon>
                      <input type="text" 
                             [value]="servicioSearchTerm()" 
                             (input)="servicioSearchTerm.set($any($event.target).value)"
                             class="w-full pl-8 pr-2 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                             placeholder="Buscar servicio..."
                             (click)="$event.stopPropagation()">
                    </div>
                    <div class="flex justify-between mt-2 px-1 text-[10px] font-bold text-emerald-600">
                      <button (click)="selectAllServicios(); $event.stopPropagation()" class="hover:underline">Seleccionar todo</button>
                      <button (click)="clearServicios(); $event.stopPropagation()" class="hover:underline text-slate-400">Borrar</button>
                    </div>
                  </div>

                  <!-- Servicio List -->
                  <ul class="max-h-60 overflow-y-auto py-1 text-[11px]">
                    @for (servicio of filteredServiciosUnicos(); track servicio) {
                      <li>
                        <button (click)="toggleServicio(servicio); $event.stopPropagation()" class="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700 transition-colors">
                          <div class="w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5"
                               [class.bg-emerald-500]="isServicioSelected(servicio)"
                               [class.border-emerald-500]="isServicioSelected(servicio)"
                               [class.border-slate-300]="!isServicioSelected(servicio)">
                            @if (isServicioSelected(servicio)) {
                              <lucide-icon [name]="Check" class="w-3 h-3 text-white"></lucide-icon>
                            }
                          </div>
                          <span class="text-left leading-tight" [class.font-medium]="isServicioSelected(servicio)">{{ servicio }}</span>
                        </button>
                      </li>
                    }
                    @if (filteredServiciosUnicos().length === 0) {
                      <li class="px-3 py-4 text-slate-400 italic text-center">No hay resultados</li>
                    }
                  </ul>

                  <!-- Footer -->
                  <div class="p-2 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button (click)="isServicioDropdownOpen.set(false)" class="px-3 py-1 text-[10px] font-bold text-white bg-slate-800 rounded-md hover:bg-slate-900 transition-colors">
                      Aplicar
                    </button>
                  </div>
                </div>
              }
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

        <app-consolidado-list [registros]="registrosFiltrados()" [view]="activeView()"></app-consolidado-list>
      </div>
    </div>
  `
})
export class ConsolidadoComponent {
  readonly Filter = Filter;
  readonly ChevronDown = ChevronDown;
  readonly Check = Check;
  readonly Search = Search;
  readonly X = X;
  readonly LayoutGrid = LayoutGrid;
  readonly ListFilter = ListFilter;

  consolidadoService = inject(ConsolidadoService);
  areaAgrupacionService = inject(AreaAgrupacionService);
  validacionDerechosConfigService = inject(ValidacionDerechosConfigService);
  route = inject(ActivatedRoute);
  
  activeView = signal<'general' | 'pgp_aic' | 'estancias_nuevas' | 'seguimiento' | 'validacion_derechos'>('general');
  selectedServicios = signal<string[] | null>(null);
  selectedAreaGroup = signal<'Urgencias' | 'Hospitalización' | null>(null);
  
  isServicioDropdownOpen = signal(false);
  isAreaGroupDropdownOpen = signal(false);
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

  hasActiveFilters = computed(() => {
    return this.selectedAreaGroup() !== null || this.selectedServicios() !== null;
  });

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

  constructor() {
    // Sync activeView con la ruta actual
    effect(() => {
      const path = this.route.snapshot.url[0]?.path;
      if (path === 'pgp-aic') {
        this.activeView.set('pgp_aic');
      } else if (path === 'estancias-nuevas') {
        this.activeView.set('estancias_nuevas');
      } else if (path === 'seguimiento') {
        this.activeView.set('seguimiento');
      } else if (path === 'validacion-derechos') {
        this.activeView.set('validacion_derechos');
      } else {
        this.activeView.set('general');
      }
    }, {});

    effect(() => {
      const query = this.consolidadoService.searchQuery();
      this.consolidadoService.searchRegistros(query);
    });
  }

  serviciosUnicos = computed(() => {
    let records = this.consolidadoService.registros();
    
    if (this.activeView() === 'estancias_nuevas') {
      records = records.filter((r: ConsolidadoRecord) => !r['gestion_estancia'] || r['gestion_estancia'] === '' || r['gestion_estancia'] === '---');
    } else if (this.activeView() === 'pgp_aic') {
      records = records.filter((r: ConsolidadoRecord) => !!r['confirmacion_pgp'] && r['confirmacion_pgp'] !== '-');
    } else if (this.activeView() === 'seguimiento') {
      records = records.filter((r: ConsolidadoRecord) => r['aut_estancia'] === 'NO');
    } else if (this.activeView() === 'validacion_derechos') {
      const dias = this.validacionDerechosConfigService.diasValidacion();
      records = records.filter((r: ConsolidadoRecord) => (Number(r['dias_ingr']) || 0) >= dias);
    }

    const areas = records.map((r: ConsolidadoRecord) => r['area']).filter(Boolean) as string[];
    return [...new Set(areas)].sort();
  });

  filteredServiciosUnicos = computed(() => {
    const term = this.servicioSearchTerm().toLowerCase();
    return this.serviciosUnicos().filter(s => s.toLowerCase().includes(term));
  });

  registrosFiltrados = computed(() => {
    let registros = this.consolidadoService.registros();
    
    if (this.activeView() === 'pgp_aic') {
      registros = registros.filter((r: ConsolidadoRecord) => !!r['confirmacion_pgp'] && r['confirmacion_pgp'] !== '-');
    } else if (this.activeView() === 'estancias_nuevas') {
      registros = registros.filter((r: ConsolidadoRecord) => !r['gestion_estancia'] || r['gestion_estancia'] === '' || r['gestion_estancia'] === '---');
    } else if (this.activeView() === 'seguimiento') {
      registros = registros.filter((r: ConsolidadoRecord) => r['aut_estancia'] === 'NO');
    } else if (this.activeView() === 'validacion_derechos') {
      const dias = this.validacionDerechosConfigService.diasValidacion();
      registros = registros.filter((r: ConsolidadoRecord) => (Number(r['dias_ingr']) || 0) >= dias);
    }

    const selected = this.selectedServicios();
    if (selected !== null) {
      if (selected.length === 0) {
        registros = [];
      } else {
        registros = registros.filter((r: ConsolidadoRecord) => selected.includes(r['area'] as string));
      }
    }

    const areaGroup = this.selectedAreaGroup();
    if (areaGroup !== null) {
      registros = registros.filter((r: ConsolidadoRecord) => this.areaAgrupacionService.getAreaGroup(r['area'] as string) === areaGroup);
    }

    return registros;
  });
}