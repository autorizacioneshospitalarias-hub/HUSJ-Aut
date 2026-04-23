import { Component, inject, computed, effect, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConsolidadoService, ConsolidadoRecord } from '../../services/consolidado.service';
import { AreaAgrupacionService } from '../../services/area-agrupacion.service';
import { ValidacionDerechosConfigService } from '../../services/validacion-derechos-config.service';
import { EpsSoatService } from '../../services/eps-soat.service';
import { ConsolidadoListComponent } from './consolidado-list.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, Filter, ChevronDown, Check, Search, X, LayoutGrid, ListFilter, RefreshCw } from 'lucide-angular';

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
          <div class="flex items-center gap-4">
            <h2 class="text-xl font-bold text-slate-800 tracking-tight">
              @switch (activeView()) {
                @case ('pgp_aic') { Confirmación PGP AIC }
                @case ('estancias_nuevas') { Estancias Nuevas }
                @case ('seguimiento') { Seguimiento }
                @case ('validacion_derechos') { Validación de derechos }
                @default { Consolidado Estancia }
              }
            </h2>
            
            <!-- Vistas Rápidas Filter (Senior Design) -->
            <div class="relative z-50">
              <button (click)="isSpecialFilterOpen.set(!isSpecialFilterOpen()); isServicioDropdownOpen.set(false)" 
                      class="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-black bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-sm transition-all uppercase tracking-wider">
                <span>{{ getSpecialFilterLabel() }}</span>
                <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 opacity-50"></lucide-icon>
              </button>

              @if (isSpecialFilterOpen()) {
                <div class="fixed inset-0 z-40" 
                     (click)="isSpecialFilterOpen.set(false)" 
                     (keydown.escape)="isSpecialFilterOpen.set(false)" 
                     tabindex="0"></div>
                <div class="absolute left-0 mt-2 w-64 bg-[#1e1e1e] text-white rounded-xl overflow-hidden shadow-2xl z-50 font-sans border border-[#333]">
                  <!-- Search input -->
                  <div class="p-2 border-b border-[#333] relative flex items-center">
                    <lucide-icon [name]="Search" class="w-3.5 h-3.5 text-slate-500 absolute left-3"></lucide-icon>
                    <input type="text"
                           [value]="specialFilterSearchTerm()"
                           (input)="specialFilterSearchTerm.set($any($event.target).value)"
                           class="w-full bg-transparent border-none text-[12px] pl-7 pr-2 py-1 text-white focus:outline-none placeholder:text-slate-500"
                           placeholder="Buscar vista rápida..."
                           (click)="$event.stopPropagation()">
                  </div>
                  <!-- Options -->
                  <div class="p-3 max-h-80 overflow-y-auto">
                    <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Vistas Generales</div>
                    <div class="space-y-0.5 mb-4">
                      @for (option of filteredSpecialOptions().slice(0, 1); track option.id) {
                        <button (click)="selectSpecialFilter(option.id)" 
                                [class.bg-[#198bf6]]="selectedSpecialFilter() === option.id"
                                [class.text-white]="selectedSpecialFilter() === option.id"
                                [class.font-medium]="selectedSpecialFilter() === option.id"
                                class="w-full text-left px-2 py-1.5 text-[12px] rounded-md transition-colors hover:bg-white/10 flex items-center gap-2">
                          @if (selectedSpecialFilter() === option.id) {
                            <lucide-icon [name]="Check" class="w-3.5 h-3.5 text-white shrink-0"></lucide-icon>
                          } @else {
                            <span class="w-3.5 h-3.5 shrink-0"></span>
                          }
                          <span>{{ option.label }}</span>
                        </button>
                      }
                    </div>

                    <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Filtros Especiales</div>
                    <div class="space-y-0.5">
                      @for (option of filteredSpecialOptions().slice(1); track option.id) {
                        <button (click)="selectSpecialFilter(option.id)" 
                                [class.bg-[#198bf6]]="selectedSpecialFilter() === option.id"
                                [class.text-white]="selectedSpecialFilter() === option.id"
                                [class.font-medium]="selectedSpecialFilter() === option.id"
                                class="w-full text-left px-2 py-1.5 text-[12px] rounded-md transition-colors hover:bg-white/10 flex items-center gap-2">
                          @if (selectedSpecialFilter() === option.id) {
                            <lucide-icon [name]="Check" class="w-3.5 h-3.5 text-white shrink-0"></lucide-icon>
                          } @else {
                            <span class="w-3.5 h-3.5 shrink-0"></span>
                          }
                          <span>{{ option.label }}</span>
                          @if (option.id === 'giro' && loadingGiroCama()) {
                            <lucide-icon [name]="RefreshCw" class="w-3 h-3 animate-spin text-white ml-auto"></lucide-icon>
                          }
                        </button>
                      }
                    </div>
                    
                    @if (filteredSpecialOptions().length === 0) {
                      <div class="px-3 py-4 text-center text-slate-500 italic text-[11px]">No se encontraron vistas</div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Consolidado Filter (Estancias) -->
            <div class="relative z-50">
              <button (click)="isServicioDropdownOpen.set(!isServicioDropdownOpen()); isSpecialFilterOpen.set(false)" 
                      class="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-black bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-sm transition-all uppercase tracking-wider">
                <span>Estancias</span>
                @if (hasActiveFilters()) {
                  <span class="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                }
                <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 opacity-50"></lucide-icon>
              </button>

              @if (isServicioDropdownOpen()) {
                <!-- Backdrop -->
                <div class="fixed inset-0 z-40" 
                     (click)="isServicioDropdownOpen.set(false)"
                     (keydown.escape)="isServicioDropdownOpen.set(false)"
                     tabindex="0"></div>
                
                <div class="absolute left-0 z-50 mt-2 w-72 bg-[#1e1e1e] text-white rounded-xl shadow-2xl overflow-hidden font-sans border border-[#333]">
                  <!-- Search input -->
                  <div class="p-2 border-b border-[#333] relative flex items-center">
                    <lucide-icon [name]="Search" class="w-3.5 h-3.5 text-slate-500 absolute left-3"></lucide-icon>
                    <input type="text" 
                           [value]="servicioSearchTerm()" 
                           (input)="servicioSearchTerm.set($any($event.target).value)"
                           class="w-full bg-transparent border-none text-[12px] pl-7 pr-2 py-1 text-white focus:outline-none placeholder:text-slate-500"
                           placeholder="Buscar estancia..."
                           (click)="$event.stopPropagation()">
                  </div>

                  <div class="p-3 max-h-80 overflow-y-auto">
                    <!-- Urgencias Group -->
                    <div class="mb-3">
                      <button (click)="toggleAreaGroup('Urgencias'); $event.stopPropagation()"
                              [class.text-[#198bf6]]="selectedAreaGroup() === 'Urgencias'"
                              class="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                        <div class="flex items-center gap-2">
                          @if (selectedAreaGroup() === 'Urgencias' && (!selectedServicios() || selectedServicios()?.length === 0)) {
                            <lucide-icon [name]="Check" class="w-3.5 h-3.5 text-[#198bf6] shrink-0"></lucide-icon>
                          } @else {
                            <span class="w-3.5 h-3.5 shrink-0"></span>
                          }
                          <span>Urgencias</span>
                        </div>
                        <lucide-icon [name]="ChevronDown" class="w-4 h-4 transition-transform" [class.rotate-180]="selectedAreaGroup() === 'Urgencias'"></lucide-icon>
                      </button>
                      
                      @if (selectedAreaGroup() === 'Urgencias') {
                        <div class="mt-1 space-y-0.5 pl-2 border-l border-[#333] ml-2">
                          @for (servicio of urgenciasServicios(); track servicio) {
                            <button (click)="toggleServicio(servicio); $event.stopPropagation()" 
                                    [class.bg-[#198bf6]]="isServicioSelected(servicio)"
                                    [class.text-white]="isServicioSelected(servicio)"
                                    class="w-full text-left px-2 py-1.5 text-[12px] rounded-md transition-colors hover:bg-white/10 flex items-center gap-2">
                              @if (isServicioSelected(servicio)) {
                                <lucide-icon [name]="Check" class="w-3 h-3 text-white shrink-0"></lucide-icon>
                              } @else {
                                <span class="w-3 h-3 shrink-0"></span>
                              }
                              <span class="truncate">{{ servicio }}</span>
                            </button>
                          }
                          @if (urgenciasServicios().length === 0) {
                            <div class="px-3 py-2 text-slate-500 italic text-[11px]">No hay resultados</div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Hospitalización Group -->
                    <div>
                      <button (click)="toggleAreaGroup('Hospitalización'); $event.stopPropagation()"
                              [class.text-[#198bf6]]="selectedAreaGroup() === 'Hospitalización'"
                              class="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                        <div class="flex items-center gap-2">
                          @if (selectedAreaGroup() === 'Hospitalización' && (!selectedServicios() || selectedServicios()?.length === 0)) {
                            <lucide-icon [name]="Check" class="w-3.5 h-3.5 text-[#198bf6] shrink-0"></lucide-icon>
                          } @else {
                            <span class="w-3.5 h-3.5 shrink-0"></span>
                          }
                          <span>Hospitalización</span>
                        </div>
                        <lucide-icon [name]="ChevronDown" class="w-4 h-4 transition-transform" [class.rotate-180]="selectedAreaGroup() === 'Hospitalización'"></lucide-icon>
                      </button>

                      @if (selectedAreaGroup() === 'Hospitalización') {
                        <div class="mt-1 space-y-0.5 pl-2 border-l border-[#333] ml-2">
                          @for (servicio of hospitalizacionServicios(); track servicio) {
                            <button (click)="toggleServicio(servicio); $event.stopPropagation()" 
                                    [class.bg-[#198bf6]]="isServicioSelected(servicio)"
                                    [class.text-white]="isServicioSelected(servicio)"
                                    class="w-full text-left px-2 py-1.5 text-[12px] rounded-md transition-colors hover:bg-white/10 flex items-center gap-2">
                              @if (isServicioSelected(servicio)) {
                                <lucide-icon [name]="Check" class="w-3 h-3 text-white shrink-0"></lucide-icon>
                              } @else {
                                <span class="w-3 h-3 shrink-0"></span>
                              }
                              <span class="truncate">{{ servicio }}</span>
                            </button>
                          }
                          @if (hospitalizacionServicios().length === 0) {
                            <div class="px-3 py-2 text-slate-500 italic text-[11px]">No hay resultados</div>
                          }
                        </div>
                      }
                    </div>
                    
                    <!-- Footer Actions -->
                    <div class="mt-4 pt-3 border-t border-[#333] flex justify-between px-1">
                      <button (click)="clearServicios(); selectedAreaGroup.set(null); $event.stopPropagation()" class="text-[10px] text-slate-400 hover:text-white transition-colors">Limpiar</button>
                      <button (click)="selectAllServiciosEnGrupo(); $event.stopPropagation()" class="text-[10px] text-[#198bf6] font-medium hover:text-blue-400 transition-colors">Selec. grupo</button>
                    </div>
                  </div>
                </div>
              }
            </div>

          </div>
          
          <div class="flex items-center gap-3">
            <!-- right side menu items if any... -->
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
  readonly RefreshCw = RefreshCw;

  consolidadoService = inject(ConsolidadoService);
  areaAgrupacionService = inject(AreaAgrupacionService);
  validacionDerechosConfigService = inject(ValidacionDerechosConfigService);
  epsSoatService = inject(EpsSoatService);
  route = inject(ActivatedRoute);
  
  activeView = signal<'general' | 'pgp_aic' | 'estancias_nuevas' | 'seguimiento' | 'validacion_derechos'>('general');
  selectedServicios = signal<string[] | null>(null);
  selectedAreaGroup = signal<'Urgencias' | 'Hospitalización' | null>(null);
  
  isServicioDropdownOpen = signal(false);
  isAreaGroupDropdownOpen = signal(false);
  servicioSearchTerm = signal('');

  // Special Filter (Vistas Rápidas)
  isSpecialFilterOpen = signal(false);
  specialFilterSearchTerm = signal('');
  selectedSpecialFilter = signal<'ninguno' | 'vacias' | 'nuevas' | 'giro' | 'neonatos' | 'accidente' | 'ecat' | 'regimen'>('ninguno');
  giroCamaIds = signal<number[]>([]);
  loadingGiroCama = signal(false);

  async selectSpecialFilter(filter: 'ninguno' | 'vacias' | 'nuevas' | 'giro' | 'neonatos' | 'accidente' | 'ecat' | 'regimen') {
    this.selectedSpecialFilter.set(filter);
    this.isSpecialFilterOpen.set(false);
    
    if (filter === 'giro') {
      this.loadingGiroCama.set(true);
      try {
        const giroData = await this.consolidadoService.getGiroCama();
        const ids = giroData.map(g => Number(g.id)).filter(id => !isNaN(id));
        this.giroCamaIds.set(ids);
      } catch (err) {
        console.error('Failed to load giro cama', err);
        this.giroCamaIds.set([]);
      } finally {
        this.loadingGiroCama.set(false);
      }
    }
  }

  getSpecialFilterLabel() {
    switch (this.selectedSpecialFilter()) {
      case 'vacias': return 'Estancias vacías';
      case 'nuevas': return 'Estancias nuevas';
      case 'giro': return 'Giro cama';
      case 'neonatos': return 'Neonatos';
      case 'accidente': return 'Accidente de tránsito';
      case 'ecat': return 'ECAT';
      case 'regimen': return 'Régimen especial';
      default: return 'Vista General';
    }
  }

  filteredSpecialOptions = computed(() => {
    const term = this.specialFilterSearchTerm().toLowerCase();
    const options = [
      { id: 'ninguno' as const, label: 'Vista General' },
      { id: 'vacias' as const, label: 'Estancias vacías' },
      { id: 'nuevas' as const, label: 'Estancias nuevas' },
      { id: 'giro' as const, label: 'Giro cama' },
      { id: 'neonatos' as const, label: 'Neonatos' },
      { id: 'accidente' as const, label: 'Accidente de tránsito' },
      { id: 'ecat' as const, label: 'ECAT' },
      { id: 'regimen' as const, label: 'Régimen especial' }
    ];
    return options.filter(o => o.label.toLowerCase().includes(term));
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

  hasActiveFilters = computed(() => {
    return this.selectedAreaGroup() !== null || (this.selectedServicios() !== null && this.selectedServicios()!.length > 0);
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

  urgenciasServicios = computed(() => {
    return this.filteredServiciosUnicos().filter(s => this.areaAgrupacionService.getAreaGroup(s) === 'Urgencias');
  });

  hospitalizacionServicios = computed(() => {
    return this.filteredServiciosUnicos().filter(s => this.areaAgrupacionService.getAreaGroup(s) === 'Hospitalización');
  });

  toggleAreaGroup(group: 'Urgencias' | 'Hospitalización') {
    if (this.selectedAreaGroup() === group) {
      this.selectedAreaGroup.set(null);
    } else {
      this.selectedAreaGroup.set(group);
      this.selectedServicios.set(null); // Clear specific locations selection when changing groups.
    }
  }

  selectAllServiciosEnGrupo() {
    const group = this.selectedAreaGroup();
    if (!group) return;
    const servicios = group === 'Urgencias' ? this.urgenciasServicios() : this.hospitalizacionServicios();
    this.selectedServicios.set(servicios);
  }

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

    const specialFilter = this.selectedSpecialFilter();
    if (specialFilter === 'vacias') {
      registros = registros.filter((r: ConsolidadoRecord) => !r['gestion_estancia'] || r['gestion_estancia'] === '' || r['gestion_estancia'] === '---');
    } else if (specialFilter === 'nuevas') {
      const hoy = new Date();
      const ayer = new Date();
      ayer.setDate(hoy.getDate() - 1);
      const hoyStr = hoy.toISOString().split('T')[0];
      const ayerStr = ayer.toISOString().split('T')[0];
      registros = registros.filter((r: ConsolidadoRecord) => {
        if (!r.fecha_ingreso) return false;
        const dStr = typeof r.fecha_ingreso === 'string' ? r.fecha_ingreso.split(' ')[0] : '';
        return dStr === hoyStr || dStr === ayerStr;
      });
    } else if (specialFilter === 'giro') {
      const ids = this.giroCamaIds();
      registros = registros.filter((r: ConsolidadoRecord) => r.id && ids.includes(Number(r.id)));
    } else if (specialFilter === 'neonatos') {
      registros = registros.filter((r: ConsolidadoRecord) => {
        const area = (r['area'] as string || '').toLowerCase();
        return area.includes('neonat') || area.includes('intensivos neo'); // Will match both intensivos and intermedio related to neonates. Actually it says: "Intermedio neonatal y intensivos".
      });
    } else if (specialFilter === 'accidente') {
      registros = registros.filter((r: ConsolidadoRecord) => {
        const txt = [r['novedad'], r['entidad'], r['eps_soat'], r['contrato']].filter(Boolean).join(' ').toLowerCase();
        return txt.includes('accidente') || txt.includes('tránsito') || this.epsSoatService.isSoat((r['eps_soat'] as string) || '');
      });
    } else if (specialFilter === 'ecat') {
      registros = registros.filter((r: ConsolidadoRecord) => {
        const txt = [r['novedad'], r['entidad'], r['eps_soat'], r['contrato']].filter(Boolean).join(' ').toLowerCase();
        return txt.includes('ecat');
      });
    } else if (specialFilter === 'regimen') {
      registros = registros.filter((r: ConsolidadoRecord) => {
        const txt = [r['novedad'], r['entidad'], r['eps_soat'], r['contrato']].filter(Boolean).join(' ').toLowerCase();
        return txt.includes('régimen') || txt.includes('regimen') || txt.includes('especial');
      });
    }

    return registros;
  });
}