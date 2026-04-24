import { Component, inject, signal, effect, computed } from '@angular/core';
import { EgresoService } from '../../services/egreso.service';
import { CirugiaService } from '../../services/cirugia.service';
import { NotaOperatoriaService } from '../../services/nota-operatoria.service';
import { EgresosListComponent } from './egresos-list.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, DatePipe } from '@angular/common';
import { Egreso } from '../../models/egreso';
import { Cirugia } from '../../models/cirugia';
import { NotaOperatoria } from '../../models/nota-operatoria';

interface GroupedCirugia extends Cirugia {
  groupId: string;
  tq_count: number;
  detalles: Cirugia[];
  originalIndex?: number;
}

@Component({
  selector: 'app-egresos',
  standalone: true,
  imports: [EgresosListComponent, HeaderComponent, MatIconModule, NgClass, DatePipe],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full">
      <app-header></app-header>
      <!-- BROWSER-LIKE TABS -->
      @if (openEgresoTabs().length > 0) {
        <div class="flex items-end px-2 pt-1.5 bg-slate-200 border-b border-slate-300 h-10 overflow-x-auto shrink-0 scrollbar-hide">
          @for (e of openEgresoTabs(); track e.id) {
            <button (click)="activeTabId.set(e.id)"
                    class="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[200px] max-w-[250px] rounded-t-lg border-t border-x text-[11px] font-medium transition-colors group"
                    [ngClass]="activeTabId() === e.id ? 'bg-blue-50 border-blue-200 text-blue-800 relative z-10 translate-y-[1px]' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-50'">
              <div class="flex items-center gap-1 overflow-hidden">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                <span class="truncate">{{ e.nombre }} - Egresos</span>
              </div>
              <button (click)="$event.stopPropagation(); closeEgresoTab(e.id)" 
                      class="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors">
                <mat-icon class="text-[12px] w-3 h-3 flex items-center justify-center">close</mat-icon>
              </button>
            </button>
          }
        </div>
      }

      <!-- Header de la página -->
      <div class="bg-white border-b border-slate-200 px-6 py-3 relative z-30">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <h2 class="text-xl font-bold text-slate-800 tracking-tight">Egresos Hospitalarios</h2>
          
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 relative z-50">
              <mat-icon class="text-slate-400 text-[18px] w-5 h-5">filter_alt</mat-icon>
              <div class="relative">
                <button (click)="isEpsDropdownOpen.set(!isEpsDropdownOpen())" class="flex items-center justify-between w-full text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]">
                  <span class="truncate">{{ getEpsButtonText() }}</span>
                  <mat-icon class="text-[16px] w-4 h-4 text-slate-400">arrow_drop_down</mat-icon>
                </button>

                @if (isEpsDropdownOpen()) {
                  <!-- Backdrop -->
                  <div class="fixed inset-0 z-40" 
                       (click)="isEpsDropdownOpen.set(false)"
                       (keydown.escape)="isEpsDropdownOpen.set(false)"
                       tabindex="0"
                       role="button"
                       aria-label="Cerrar menú desplegable"></div>
                  
                  <div class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg">
                    <div class="p-2 border-b border-slate-100">
                      <div class="relative">
                        <mat-icon class="absolute left-2 top-1/2 -translate-y-1/2 text-[14px] w-3.5 h-3.5 text-slate-400">search</mat-icon>
                        <input type="text" 
                               [value]="epsSearchTerm()" 
                               (input)="epsSearchTerm.set($any($event.target).value)"
                               class="w-full pl-7 pr-2 py-1.5 text-[11px] border border-slate-300 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                               placeholder="Buscar EPS..."
                               (click)="$event.stopPropagation()">
                      </div>
                      <div class="flex justify-between mt-2 px-1 text-[11px] font-medium text-emerald-600">
                        <button (click)="selectAllEps(); $event.stopPropagation()" class="hover:underline">Seleccionar todo</button>
                        <button (click)="clearEps(); $event.stopPropagation()" class="hover:underline">Borrar</button>
                      </div>
                    </div>
                    <ul class="max-h-60 overflow-y-auto py-1 text-[11px]">
                      @for (eps of filteredEpsUnicas(); track eps) {
                        <li>
                          <button (click)="toggleEps(eps); $event.stopPropagation()" class="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700">
                            <mat-icon class="text-[16px] w-4 h-4 shrink-0 mt-0.5" [class.text-emerald-600]="isEpsSelected(eps)" [class.opacity-0]="!isEpsSelected(eps)">
                              check
                            </mat-icon>
                            <span class="text-left leading-tight" [class.font-medium]="isEpsSelected(eps)">{{ eps }}</span>
                          </button>
                        </li>
                      }
                      @if (filteredEpsUnicas().length === 0) {
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

      <div class="flex-1 min-h-0 relative">
        @if (activeTabId() === 'main') {
          @if (egresoService.cargando()) {
            <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <div class="flex flex-col items-center gap-3">
                <mat-icon class="animate-spin text-blue-600 text-[32px] w-8 h-8">refresh</mat-icon>
                <p class="text-sm font-medium text-slate-600">Cargando egresos...</p>
              </div>
            </div>
          }

          @if (egresoService.error()) {
            <div class="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center gap-3">
              <mat-icon>error_outline</mat-icon>
              <div>
                <p class="font-medium">Error al cargar los datos</p>
                <p class="text-sm opacity-80">{{ egresoService.error() }}</p>
              </div>
            </div>
          }

          <app-egresos-list 
            [egresos]="egresosFiltrados()" 
            [activeFilter]="activeCoincidenceFilter()"
            (egresoClick)="openEgresoTab($event)"
            (filterCoincidences)="activeCoincidenceFilter.set($event)"
            (clearFilter)="activeCoincidenceFilter.set(null)">
          </app-egresos-list>
        } @else {
          <div class="h-full overflow-y-auto bg-[#F3F4F6] p-6 animate-in fade-in duration-200">
            @let activeEgreso = getActiveEgreso();
            @if (activeEgreso) {
              <div class="w-full space-y-4">
                
                <!-- Egreso Header Card -->
                <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex justify-between items-start relative overflow-hidden">
                  <div class="relative z-10">
                    <div class="flex items-center gap-2 mb-2">
                      <mat-icon [class]="getStatusIconColor(activeEgreso.estado_y)" class="text-[16px] w-4 h-4" [title]="activeEgreso.estado_y || 'PENDIENTE'">{{ getStatusIcon(activeEgreso.estado_y) }}</mat-icon>
                      @if (activeEgreso.estado_2) {
                        <span class="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded uppercase tracking-wider border border-slate-300">
                          {{ activeEgreso.estado_2 }}
                        </span>
                      }
                    </div>
                    <h2 class="text-base font-bold text-slate-900 leading-tight mb-1 uppercase">{{ activeEgreso.nombre }}</h2>
                    <div class="flex flex-wrap items-center gap-3 text-[11px]">
                      <span class="font-mono text-slate-600 font-medium">CC: {{ activeEgreso.documento }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="text-slate-600">Ingreso: {{ activeEgreso.ingreso }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="font-bold text-indigo-600">{{ activeEgreso.entidad }}</span>
                      @if (activeEgreso.contrato) {
                        <span class="text-slate-400">•</span>
                        <span class="text-slate-600">Contrato: {{ activeEgreso.contrato }}</span>
                      }
                      @if (activeEgreso.municipio) {
                        <span class="text-slate-400">•</span>
                        <span class="text-slate-600">{{ activeEgreso.municipio }}</span>
                      }
                    </div>
                  </div>
                  
                  <div class="flex flex-col items-center bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Salida</span>
                    <span class="text-sm font-medium text-slate-600 font-mono leading-none mb-1">{{ activeEgreso.fecha_salida | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>

                <!-- Content Card -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <!-- Sub-tabs Header -->
                  <div class="px-5 py-3 border-b border-slate-100 bg-white shrink-0">
                    <div class="inline-flex items-center p-1 bg-slate-200/40 rounded-lg border border-slate-200/20 shadow-inner">
                      <button 
                        (click)="activeSubTab.set('general')"
                        class="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 rounded-md"
                        [ngClass]="activeSubTab() === 'general' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-600'">
                        Información General
                      </button>
                      <button 
                        (click)="activeSubTab.set('procedimientos')"
                        class="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 rounded-md flex items-center gap-2"
                        [ngClass]="activeSubTab() === 'procedimientos' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-600'">
                        Procedimientos
                        @if (groupedProcedimientos().length > 0 || activeEgresoNotas().length > 0) {
                          <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-colors"
                            [ngClass]="activeSubTab() === 'procedimientos' ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/50 text-slate-400'">
                            {{ groupedProcedimientos().length + activeEgresoNotas().length }}
                          </span>
                        }
                      </button>
                      <button 
                        (click)="activeSubTab.set('liquidado')"
                        class="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 rounded-md flex items-center gap-2"
                        [ngClass]="activeSubTab() === 'liquidado' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-600'">
                        Liquidado
                        @if (liquidadoItems().cirugias.length > 0 || liquidadoItems().notas.length > 0) {
                          <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-colors"
                            [ngClass]="activeSubTab() === 'liquidado' ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/50 text-slate-400'">
                            {{ liquidadoItems().cirugias.length + liquidadoItems().notas.length }}
                          </span>
                        }
                      </button>
                    </div>
                  </div>

                  <!-- Tab Content Body -->
                  <div class="p-5">
                    @if (activeSubTab() === 'general') {
                      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <!-- Main Info Column -->
                        <div class="lg:col-span-2 space-y-5">
                          
                          <!-- Tiempos y HC's Section -->
                          <div class="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200/50 pb-2">Tiempos y HC</h3>
                      
                      <!-- Fechas de Estancia -->
                      <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <p class="text-[9px] font-bold text-emerald-600 uppercase mb-1 tracking-wider">Fecha de Ingreso</p>
                          <p class="text-sm font-mono font-bold text-emerald-700">{{ activeEgreso.ingreso || 'N/A' }}</p>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <p class="text-[9px] font-bold text-blue-600 uppercase mb-1 tracking-wider">Fecha de Salida</p>
                          <p class="text-sm font-mono font-bold text-blue-700">{{ activeEgreso.fecha_salida || 'N/A' }}</p>
                        </div>
                      </div>

                      <!-- Estadísticas y HC Básica -->
                      <div class="grid grid-cols-4 gap-4 mb-4">
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">DÍAS INGRESO</p>
                          <p class="text-lg font-mono font-bold text-slate-700">{{ activeEgreso.dias_ingreso || 0 }}</p>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">DÍAS HOSPIT.</p>
                          <p class="text-lg font-mono font-bold text-slate-700">{{ activeEgreso.dias_hospit || 0 }}</p>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">HC15</p>
                          @for (line of formatHC15(activeEgreso.hc15); track line) {
                            <p class="text-sm font-medium text-slate-600 mt-1">{{ line }}</p>
                          } @empty {
                            <p class="text-sm font-medium text-slate-300 italic mt-1">N/A</p>
                          }
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">HC19</p>
                          <p class="text-sm font-medium text-slate-600 mt-1">{{ activeEgreso.hc19 || 'N/A' }}</p>
                        </div>
                      </div>
                      
                      @if (activeEgreso.hc19_des) {
                        <div class="pt-3 border-t border-slate-100">
                          <div class="flex items-start gap-2">
                            <mat-icon class="text-[14px] w-3.5 h-3.5 text-slate-400 mt-0.5">description</mat-icon>
                            <p class="text-[10px] text-slate-500 italic leading-tight">
                              <span class="font-bold text-slate-600 not-italic uppercase text-[9px] mr-1">Detalle HC19:</span>
                              {{ activeEgreso.hc19_des }}
                            </p>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Observaciones -->
                    <div class="bg-amber-50/30 rounded-xl p-5 border border-amber-100/50 flex flex-col">
                      <div class="flex items-center justify-between mb-2">
                        <h3 class="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                          <mat-icon class="text-[14px] w-3.5 h-3.5">info</mat-icon>
                          Observación
                        </h3>
                        @if (editingObservationId() !== activeEgreso.id) {
                          <button (click)="startEditingObservation(activeEgreso)" class="text-amber-700 hover:text-amber-900 hover:bg-amber-100 p-1 rounded transition-colors" title="Editar observación">
                            <mat-icon class="text-[14px] w-3.5 h-3.5">edit</mat-icon>
                          </button>
                        }
                      </div>
                      
                      @if (editingObservationId() === activeEgreso.id) {
                        <div class="flex flex-col gap-2">
                          <textarea 
                            [value]="editObservationText()"
                            (input)="updateEditObservationText($event)"
                            class="w-full text-[11px] p-2 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white min-h-[80px] resize-y"
                            placeholder="Escribe la observación aquí..."></textarea>
                          <div class="flex justify-end gap-2">
                            <button (click)="cancelEditingObservation()" class="px-3 py-1 text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors">
                              Cancelar
                            </button>
                            <button (click)="saveObservation(activeEgreso.id)" [disabled]="isSavingObservation()" class="px-3 py-1 text-[10px] font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1">
                              @if (isSavingObservation()) {
                                <mat-icon class="text-[12px] w-3 h-3 animate-spin">sync</mat-icon>
                                Guardando...
                              } @else {
                                Guardar
                              }
                            </button>
                          </div>
                        </div>
                      } @else {
                        <p class="text-[11px] text-amber-900 flex-1 italic leading-relaxed whitespace-pre-wrap">{{ activeEgreso.observacion || 'Sin observaciones registradas.' }}</p>
                      }
                    </div>
                  </div>

                  <!-- Side Column -->
                  <div class="space-y-5">
                    <!-- Ubicación -->
                    <div class="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200/50 pb-2">Ubicación</h3>
                      <div class="space-y-3">
                        <div>
                          <p class="text-[9px] font-bold text-slate-400 uppercase">Área</p>
                          <p class="text-[11px] text-slate-700 font-medium">{{ activeEgreso.area || 'N/A' }}</p>
                        </div>
                        <div>
                          <p class="text-[9px] font-bold text-slate-400 uppercase">Cama</p>
                          <p class="text-[11px] text-slate-700 font-medium">{{ activeEgreso.cama || 'N/A' }}</p>
                        </div>
                        <div class="pt-2 border-t border-slate-100">
                          <p class="text-[9px] font-bold text-slate-400 uppercase">ÁREA DE EGRESO</p>
                          <p class="text-[11px] text-slate-700 font-medium">{{ activeEgreso.area_egreso_s || 'N/A' }}</p>
                        </div>
                        @if (activeEgreso.area_de_egreso_2) {
                          <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase">Área Egreso 2</p>
                            <p class="text-[11px] text-slate-700 font-medium">{{ activeEgreso.area_de_egreso_2 }}</p>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Administrativo -->
                    <div class="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200/50 pb-2">Administrativo</h3>
                      <div class="space-y-3">
                        <div>
                          <p class="text-[9px] font-bold text-slate-400 uppercase">Servicio</p>
                          <p class="text-[11px] text-slate-700 font-medium">{{ activeEgreso.servicio || 'N/A' }}</p>
                        </div>
                        <div>
                          <p class="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Autorizador</p>
                          @if (activeEgreso.autorizador) {
                            <div class="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white border-l-4 border-blue-500 rounded-r-lg shadow-sm ring-1 ring-slate-200">
                              <span class="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide whitespace-normal">{{ activeEgreso.autorizador }}</span>
                            </div>
                          } @else {
                            <div class="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg italic">
                              <span class="text-[10px] text-slate-400 font-medium">Pendiente</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                } @else if (activeSubTab() === 'procedimientos') {
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <!-- Historial de Cirugías -->
                    <div class="bg-slate-50/50 rounded-xl p-5 border border-slate-100 flex flex-col">
                      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3 border-b border-slate-200/50 pb-2">
                        <mat-icon class="text-[14px] w-3.5 h-3.5">medical_services</mat-icon>
                        Historial de Cirugías (Liquidación)
                      </h3>
                      
                      @if (loadingCirugias()) {
                        <div class="flex items-center justify-center py-4">
                          <mat-icon class="animate-spin text-blue-600 text-[24px] w-6 h-6">refresh</mat-icon>
                        </div>
                      } @else if (activeEgresoCirugias().length === 0) {
                        <div class="text-center py-4 text-slate-400 text-[11px] italic">
                          No se encontraron cirugías registradas para este ingreso.
                        </div>
                      } @else {
                        <div class="space-y-3">
                          @for (group of groupedProcedimientos(); track group.groupId; let i = $index) {
                            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200 relative">
                              <button (click)="toggleProcedimientosExpansion(group.groupId)" 
                                      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-bold transition-colors shadow-sm focus:outline-none"
                                      [ngClass]="selectedProcedimientoId() === group.groupId ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 border-transparent'">
                                #{{ group.originalIndex }}
                              </button>
                              
                              <div class="flex items-center gap-2 mb-2">
                                <span class="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                                  {{ group.date | date:'dd/MM/yyyy' }}
                                </span>
                                @if (group.tq_count > 1) {
                                  <button (click)="toggleProcedimientosExpansion(group.groupId)"
                                          class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer focus:outline-none">
                                    T.Q: {{ group.tq_count }}
                                  </button>
                                }
                                @if (group.estado) {
                                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                                        [ngClass]="group.estado === 'LIQUIDADA' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'">
                                    {{ group.estado }}
                                  </span>
                                }
                              </div>
                              
                              <div class="mb-2">
                                <p class="text-[11px] font-bold text-slate-800 leading-tight">{{ group.procedure || 'Procedimiento no especificado' }}</p>
                                <p class="text-[10px] text-slate-500 mt-0.5">CUPS: <span class="font-mono">{{ group.cups || 'N/A' }}</span></p>
                              </div>

                              @if (expandedProcedimientosIds().has(group.groupId)) {
                                <div class="mt-3 pt-3 border-t border-emerald-200 space-y-2 max-w-5xl mx-auto">
                                  <div class="flex items-center justify-center gap-2 mb-4">
                                    <mat-icon class="text-emerald-500 text-[16px] w-4 h-4">check_circle</mat-icon>
                                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detalle de Tiempos ({{ group.tq_count }})</p>
                                  </div>
                                  @for (det of group.detalles; track det.id; let j = $index) {
                                    <div class="bg-white p-2 rounded border border-slate-100 flex flex-col gap-2 shadow-sm">
                                      <div class="flex items-center justify-between gap-4">
                                        <div class="flex items-center gap-2 min-w-0 flex-1">
                                          <span class="text-[9px] font-bold text-slate-300 w-3 shrink-0">{{ j + 1 }}.</span>
                                          <div class="flex flex-col shrink-0">
                                            <span class="text-[10px] font-bold text-slate-700">{{ det.date | date:'dd/MM/yyyy HH:mm' }}</span>
                                            <span class="text-[9px] text-slate-400 font-mono">GQX: {{ det.gqx || 'N/A' }}</span>
                                          </div>
                                          <div class="h-4 w-px bg-slate-100 mx-1 shrink-0"></div>
                                          <div class="flex flex-col min-w-0 flex-1">
                                            <span class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Procedimientos</span>
                                            <span class="text-[9px] text-slate-600 line-clamp-2 leading-tight break-words" [title]="det.procedure || ''">{{ det.procedure || 'N/A' }}</span>
                                          </div>
                                        </div>
                                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" 
                                              [ngClass]="det.estado === 'LIQUIDADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'">
                                          {{ det.estado }}
                                        </span>
                                      </div>
                                          <div class="grid grid-cols-5 gap-4 pl-5 border-t border-slate-50 pt-1.5 mt-0.5">
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Cirujano</p>
                                              <p class="text-[9px] text-slate-600 truncate" [title]="det.surgeon || ''">{{ det.surgeon || 'N/A' }}</p>
                                            </div>
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Anestesiólogo</p>
                                              <p class="text-[9px] text-slate-600 truncate" [title]="det.anesthesiologist || ''">{{ det.anesthesiologist || 'N/A' }}</p>
                                            </div>
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Ayudantes</p>
                                              <p class="text-[9px] text-slate-600 truncate" [title]="(det.assistant1 || 'N/A') + ' / ' + (det.assistant2 || 'N/A')">
                                                {{ det.assistant1 || 'N/A' }} / {{ det.assistant2 || 'N/A' }}
                                              </p>
                                            </div>
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Autorización</p>
                                              <p class="text-[9px] text-blue-600 font-bold truncate">{{ det.authorization || 'N/A' }}</p>
                                            </div>
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Estado Aut.</p>
                                              <p class="text-[9px] text-slate-600 font-bold truncate">{{ det.authorization || 'PENDIENTE' }}</p>
                                            </div>
                                          </div>
                                          <div class="grid grid-cols-2 gap-4 pl-5 mt-1">
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Entidad</p>
                                              <p class="text-[9px] text-slate-600 truncate">{{ det.entity || 'N/A' }}</p>
                                            </div>
                                            @if (det.novedad) {
                                              <div>
                                                <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Novedad</p>
                                                <p class="text-[9px] text-amber-600 italic truncate">{{ det.novedad }}</p>
                                              </div>
                                            }
                                          </div>
                                    </div>
                                  }
                                </div>
                              } @else {
                                <div class="grid grid-cols-2 gap-2 text-[10px]">
                                  <div>
                                    <span class="text-slate-400 font-bold uppercase">Especialidad:</span>
                                    <span class="text-slate-700 ml-1">{{ group.specialty || 'N/A' }}</span>
                                  </div>
                                  <div>
                                    <span class="text-slate-400 font-bold uppercase">Cirujano:</span>
                                    <span class="text-slate-700 ml-1">{{ group.surgeon || 'N/A' }}</span>
                                  </div>
                                  <div>
                                    <span class="text-slate-400 font-bold uppercase">Grupo Qx:</span>
                                    <span class="text-slate-700 ml-1 font-mono">{{ group.gqx || 'N/A' }}</span>
                                  </div>
                                  <div>
                                    <span class="text-slate-400 font-bold uppercase">Liquidación:</span>
                                    <span class="text-slate-700 ml-1">{{ group.auditLiquidation || 'N/A' }}</span>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Nota Operatoria -->
                    <div class="bg-slate-50/50 rounded-xl p-5 border border-slate-100 flex flex-col">
                      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3 border-b border-slate-200/50 pb-2">
                        <mat-icon class="text-[14px] w-3.5 h-3.5">description</mat-icon>
                        Notas Operatorias
                      </h3>
                      
                      @if (loadingNotas()) {
                        <div class="flex items-center justify-center py-4">
                          <mat-icon class="animate-spin text-blue-600 text-[24px] w-6 h-6">refresh</mat-icon>
                        </div>
                      } @else if (activeEgresoNotas().length === 0) {
                        <div class="text-center py-4 text-slate-400 text-[11px] italic">
                          No se encontraron notas operatorias para este ingreso.
                        </div>
                      } @else {
                        <div class="space-y-3">
                          @for (nota of activeEgresoNotas(); track nota.id; let i = $index) {
                            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200 relative">
                              <div class="absolute top-3 right-3 text-[10px] font-bold text-slate-400">#{{ activeEgresoNotas().length - i }}</div>
                              <div class="flex items-center gap-2 mb-2">
                                <span class="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                                  {{ nota.fecha | date:'dd/MM/yyyy' }} {{ nota.hora }}
                                </span>
                                @if (nota.autorizacion) {
                                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200" title="Autorización">
                                    {{ nota.autorizacion }}
                                  </span>
                                }
                              </div>
                              <div class="mb-2">
                                <p class="text-[11px] font-bold text-slate-800 leading-tight">{{ nota.procedimiento || 'Procedimiento no especificado' }}</p>
                                <p class="text-[10px] text-slate-500 mt-0.5">CUPS: <span class="font-mono">{{ nota.cups || 'N/A' }}</span></p>
                              </div>
                              <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 text-[10px]">
                                <div>
                                  <span class="text-slate-400 font-bold uppercase">Estado Aut.:</span>
                                  <span class="text-slate-700 ml-1 font-bold">{{ nota.autorizacion || 'PENDIENTE' }}</span>
                                </div>
                                <div>
                                  <span class="text-slate-400 font-bold uppercase">Servicio:</span>
                                  <span class="text-slate-700 ml-1">{{ nota.servicio || 'N/A' }}</span>
                                </div>
                                <div>
                                  <span class="text-slate-400 font-bold uppercase">Folio:</span>
                                  <span class="text-slate-700 ml-1 font-mono">{{ nota.folio || 'N/A' }}</span>
                                </div>
                                <div>
                                  <span class="text-slate-400 font-bold uppercase">DX:</span>
                                  <span class="text-slate-700 ml-1">{{ nota.dx || 'N/A' }}</span>
                                </div>
                                <div>
                                  <span class="text-slate-400 font-bold uppercase">Autorizador:</span>
                                  <span class="text-slate-700 ml-1">{{ nota.autorizador || 'N/A' }}</span>
                                </div>
                              </div>
                              @if (nota.observacion) {
                                <div class="mt-2 pt-2 border-t border-slate-200">
                                  <p class="text-[10px] text-slate-600 italic leading-relaxed">{{ nota.observacion }}</p>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                } @else if (activeSubTab() === 'liquidado') {
                  <div>
                    <div class="bg-emerald-50/30 px-5 py-3 border-b border-emerald-100/50 flex items-center justify-between">
                      <h3 class="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                        <mat-icon class="text-[18px] w-4.5 h-4.5">fact_check</mat-icon>
                        Códigos Liquidados (Auditados)
                      </h3>
                      <span class="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                        {{ liquidadoItems().cirugias.length }} Ítems
                      </span>
                    </div>

                    <div class="p-0">
                      <table class="w-full text-left border-collapse">
                        <thead>
                          <tr class="bg-slate-50 border-b border-slate-200">
                            <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                            <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Fecha / Qx</th>
                            <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Código</th>
                            <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                            <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28">Estado Aut.</th>
                            <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32 text-right">Auditoría / Estado</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                          @for (item of liquidadoItems().cirugias; track item.groupId; let i = $index) {
                            <tr class="hover:bg-slate-50 transition-colors">
                              <td class="px-5 py-3 text-[11px] font-bold text-slate-400">
                                <div class="flex flex-col items-center gap-1">
                                  <button (click)="toggleLiquidadoExpansion(item.groupId)" 
                                          class="w-6 h-6 rounded-full border flex items-center justify-center transition-colors focus:outline-none"
                                          [ngClass]="selectedLiquidadoId() === item.groupId ? 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-slate-100 text-slate-400 border-transparent hover:bg-blue-100 hover:text-blue-600'">
                                    {{ item.originalIndex }}
                                  </button>
                                </div>
                              </td>
                              <td class="px-5 py-3">
                                <p class="text-[11px] text-slate-600 font-mono leading-none mb-1">{{ item.date | date:'dd/MM/yyyy' }}</p>
                                <p class="text-[9px] font-bold text-emerald-600 font-mono">Qx: {{ item.orNumber || 'N/A' }}</p>
                              </td>
                              <td class="px-5 py-3 text-[11px] font-medium text-slate-600 font-mono">{{ item.cups || 'N/A' }}</td>
                              <td class="px-5 py-3">
                                <div class="flex items-start gap-2">
                                  <div class="flex-1">
                                    <p class="text-[11px] font-medium text-slate-800 leading-tight">{{ item.procedure }}</p>
                                    <div class="flex items-center gap-2 mt-1">
                                      <button (click)="toggleLiquidadoExpansion(item.groupId)"
                                              class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer focus:outline-none flex items-center gap-1">
                                        T.Q: {{ item.tq_count }}
                                      </button>
                                      <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">GQX: {{ item.gqx || 'N/A' }}</span>
                                    </div>
                                    <p class="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter">{{ item.specialty }} | {{ item.surgeon }}</p>
                                  </div>
                                </div>
                              </td>
                              <td class="px-5 py-3">
                                <span class="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {{ item.detalles[0]?.authorization || 'PENDIENTE' }}
                                </span>
                              </td>
                              <td class="px-5 py-3 text-right">
                                <div class="flex flex-col items-end gap-1">
                                  @if (item.auditLiquidation) {
                                    <span class="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                      Liq: {{ formatLiquidation(item.auditLiquidation) }}
                                    </span>
                                  }
                                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                                        [ngClass]="getEstadoClass(item.estado || '')">
                                    {{ item.estado || 'LIQUIDADO' }}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            @if (expandedLiquidadoIds().has(item.groupId)) {
                              <tr class="bg-slate-50/50">
                                <td colspan="6" class="px-8 py-4">
                                  <div class="border-l-2 border-emerald-200 pl-4 space-y-3 max-w-6xl mx-auto">
                                    <div class="flex items-center justify-center gap-2 mb-4">
                                      <mat-icon class="text-emerald-500 text-[16px] w-4 h-4">check_circle</mat-icon>
                                      <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detalle de Tiempos Quirúrgicos ({{ item.tq_count }})</h4>
                                    </div>
                                    <div class="grid grid-cols-1 gap-2">
                                      @for (det of item.detalles; track det.id; let j = $index) {
                                        <div class="flex flex-col bg-white p-2 rounded border border-slate-200 shadow-sm gap-2">
                                          <div class="flex items-center justify-between gap-4">
                                            <div class="flex items-center gap-3 min-w-0 flex-1">
                                              <span class="text-[10px] font-bold text-slate-400 w-4 shrink-0">{{ j + 1 }}.</span>
                                              <div class="flex flex-col shrink-0">
                                                <span class="text-[10px] font-bold text-slate-700">{{ det.date | date:'dd/MM/yyyy HH:mm' }}</span>
                                                <span class="text-[9px] text-slate-400">Qx: {{ det.orNumber || 'N/A' }}</span>
                                              </div>
                                              <div class="h-6 w-px bg-slate-100 mx-1 shrink-0"></div>
                                              <div class="flex flex-col min-w-0 flex-1">
                                                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Procedimientos</span>
                                                <span class="text-[10px] text-slate-700 line-clamp-2 leading-tight break-words" [title]="det.procedure || ''">{{ det.procedure || 'N/A' }}</span>
                                              </div>
                                            </div>
                                            <div class="flex items-center gap-4 shrink-0">
                                              <div class="text-right">
                                                <p class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">GQX</p>
                                                <p class="text-[10px] font-mono font-bold text-emerald-600">{{ det.gqx || 'N/A' }}</p>
                                              </div>
                                              <div class="text-right">
                                                <p class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Estado</p>
                                                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" [ngClass]="getEstadoClass(det.estado || '')">
                                                  {{ det.estado || 'OK' }}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <div class="grid grid-cols-5 gap-4 pl-7 border-t border-slate-50 pt-1.5 mt-0.5">
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Cirujano</p>
                                              <p class="text-[9px] text-slate-600 truncate" [title]="det.surgeon || ''">{{ det.surgeon || 'N/A' }}</p>
                                            </div>
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Anestesiólogo</p>
                                              <p class="text-[9px] text-slate-600 truncate" [title]="det.anesthesiologist || ''">{{ det.anesthesiologist || 'N/A' }}</p>
                                            </div>
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Ayudantes</p>
                                              <p class="text-[9px] text-slate-600 truncate" [title]="(det.assistant1 || 'N/A') + ' / ' + (det.assistant2 || 'N/A')">
                                                {{ det.assistant1 || 'N/A' }} / {{ det.assistant2 || 'N/A' }}
                                              </p>
                                            </div>
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Autorización</p>
                                              <p class="text-[9px] text-blue-600 font-bold truncate">{{ det.authorization || 'N/A' }}</p>
                                            </div>
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Estado Aut.</p>
                                              <p class="text-[9px] text-slate-600 font-bold truncate">{{ det.authorization || 'PENDIENTE' }}</p>
                                            </div>
                                          </div>
                                          <div class="grid grid-cols-2 gap-4 pl-7 mt-1">
                                            <div>
                                              <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Entidad</p>
                                              <p class="text-[9px] text-slate-600 truncate">{{ det.entity || 'N/A' }}</p>
                                            </div>
                                            @if (det.novedad) {
                                              <div>
                                                <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Novedad</p>
                                                <p class="text-[9px] text-amber-600 italic truncate">{{ det.novedad }}</p>
                                              </div>
                                            }
                                          </div>
                                        </div>
                                      }
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            }
                          }
                          @if (liquidadoItems().cirugias.length === 0) {
                            <tr>
                              <td colspan="6" class="px-5 py-10 text-center text-slate-400 italic text-[11px]">
                                No se encontraron códigos auditados para este ingreso.
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  </div>
</div>
  `
})
export class EgresosComponent {
  egresoService = inject(EgresoService);
  cirugiaService = inject(CirugiaService);
  notaOperatoriaService = inject(NotaOperatoriaService);
  
  activeTabId = signal<string>('main');
  activeSubTab = signal<'general' | 'procedimientos' | 'liquidado'>('general');
  openEgresoTabs = signal<Egreso[]>([]);
  activeCoincidenceFilter = signal<{ documento: string | null, ingreso: string | null, nombre: string | null } | null>(null);

  editingObservationId = signal<string | null>(null);
  editObservationText = signal<string>('');
  isSavingObservation = signal<boolean>(false);

  activeEgresoCirugias = signal<Cirugia[]>([]);
  loadingCirugias = signal<boolean>(false);

  activeEgresoNotas = signal<NotaOperatoria[]>([]);
  loadingNotas = signal<boolean>(false);

  expandedLiquidadoIds = signal<Set<string>>(new Set());
  selectedLiquidadoId = signal<string | null>(null);
  expandedProcedimientosIds = signal<Set<string>>(new Set());
  selectedProcedimientoId = signal<string | null>(null);

  selectedEps = signal<string[] | null>(null);
  isEpsDropdownOpen = signal(false);
  epsSearchTerm = signal('');

  getEpsButtonText() {
    const selected = this.selectedEps();
    if (selected === null) return 'Todas las EPS';
    if (selected.length === 0) return 'Ninguna seleccionada';
    if (selected.length === 1) return selected[0];
    return `${selected.length} seleccionadas`;
  }

  isEpsSelected(eps: string): boolean {
    const selected = this.selectedEps();
    if (selected === null) return true;
    return selected.includes(eps);
  }

  toggleEps(eps: string) {
    const selected = this.selectedEps();
    if (selected === null) {
      const all = this.epsUnicas();
      this.selectedEps.set(all.filter(e => e !== eps));
    } else {
      if (selected.includes(eps)) {
        this.selectedEps.set(selected.filter(e => e !== eps));
      } else {
        const next = [...selected, eps];
        if (next.length === this.epsUnicas().length) {
          this.selectedEps.set(null);
        } else {
          this.selectedEps.set(next);
        }
      }
    }
  }

  selectAllEps() {
    this.selectedEps.set(null);
  }

  clearEps() {
    this.selectedEps.set([]);
  }

  epsUnicas = computed(() => {
    const egresos = this.egresoService.egresos();
    const epsList = egresos.map(e => e.entidad).filter(Boolean) as string[];
    return [...new Set(epsList)].sort();
  });

  filteredEpsUnicas = computed(() => {
    const term = this.epsSearchTerm().toLowerCase();
    return this.epsUnicas().filter(e => e.toLowerCase().includes(term));
  });

  egresosFiltrados = computed(() => {
    let egresos = this.egresoService.egresos();
    const selected = this.selectedEps();
    
    if (selected !== null) {
      if (selected.length === 0) {
        egresos = [];
      } else {
        egresos = egresos.filter(e => selected.includes(e.entidad as string));
      }
    }
    return egresos;
  });

  liquidadoItems = computed(() => {
    const cirugias = this.activeEgresoCirugias().filter(c => {
      const e = c.estado?.toUpperCase().trim() || '';
      if (e === 'CAMBIO' || e === 'NO FACTURABLE' || e === 'ANULADO' || e === '') return false;
      
      const esEstadoFinal = ['OK', 'HECHO', 'ADICION'].includes(e);
      const tieneAuditoria = c.auditLiquidation && c.auditLiquidation.trim() !== '' && c.auditLiquidation !== '0';
      
      return esEstadoFinal || tieneAuditoria;
    });

    // Agrupar por CUPS e Ingreso
    const agrupadasMap = cirugias.reduce((acc, c) => {
      const key = `${c.cups}-${c.admissionNumber}`;
      if (!acc[key]) {
        acc[key] = { 
          ...c, 
          groupId: key,
          tq_count: 0, 
          detalles: [] 
        } as GroupedCirugia;
      }
      acc[key].tq_count += 1;
      acc[key].detalles.push(c);
      return acc;
    }, {} as Record<string, GroupedCirugia>);

    const resultadoCirugias = Object.values(agrupadasMap).map((group: GroupedCirugia) => {
      // Sort detalles by date ascending
      group.detalles.sort((a: Cirugia, b: Cirugia) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      return group;
    }).sort((a: GroupedCirugia, b: GroupedCirugia) => {
      // Sort main list by date ascending (oldest to newest)
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    }).map((c, index) => ({ 
      ...c, 
      originalIndex: index + 1 
    }));

    return { cirugias: resultadoCirugias, notas: [] };
  });

  groupedProcedimientos = computed(() => {
    const cirugias = this.activeEgresoCirugias();
    if (cirugias.length === 0) return [];

    const groups = cirugias.reduce((acc, cirugia) => {
      const groupId = `${cirugia.cups}-${cirugia.admissionNumber}`;
      if (!acc[groupId]) {
        acc[groupId] = {
          ...cirugia,
          groupId,
          tq_count: 0,
          detalles: []
        } as GroupedCirugia;
      }
      acc[groupId].tq_count++;
      acc[groupId].detalles.push(cirugia);
      return acc;
    }, {} as Record<string, GroupedCirugia>);

    return Object.values(groups).map((group: GroupedCirugia) => {
      // Sort details by date ascending
      group.detalles.sort((a: Cirugia, b: Cirugia) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      return group;
    }).sort((a: GroupedCirugia, b: GroupedCirugia) => {
      // Sort main groups by date ascending (oldest to newest)
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    }).map((group, index) => ({
      ...group,
      originalIndex: index + 1
    }));
  });

  toggleLiquidadoExpansion(groupId: string) {
    const current = new Set(this.expandedLiquidadoIds());
    if (current.has(groupId)) {
      current.delete(groupId);
      if (this.selectedLiquidadoId() === groupId) {
        this.selectedLiquidadoId.set(null);
      }
    } else {
      current.add(groupId);
      this.selectedLiquidadoId.set(groupId);
    }
    this.expandedLiquidadoIds.set(current);
  }

  toggleProcedimientosExpansion(groupId: string) {
    const current = new Set(this.expandedProcedimientosIds());
    if (current.has(groupId)) {
      current.delete(groupId);
      if (this.selectedProcedimientoId() === groupId) {
        this.selectedProcedimientoId.set(null);
      }
    } else {
      current.add(groupId);
      this.selectedProcedimientoId.set(groupId);
    }
    this.expandedProcedimientosIds.set(current);
  }

  constructor() {
    effect(() => {
      const query = this.egresoService.searchQuery();
      this.egresoService.buscarEgresos(query);
    });

    effect(() => {
      const activeId = this.activeTabId();
      if (activeId !== 'main') {
        const egreso = this.getActiveEgreso();
        
        // Limpiar datos inmediatamente para evitar mostrar datos del paciente anterior
        this.activeEgresoCirugias.set([]);
        this.activeEgresoNotas.set([]);
        
        if (egreso && egreso.ingreso) {
          this.loadCirugiasForEgreso(egreso.ingreso);
          this.loadNotasForEgreso(egreso.ingreso);
        }
      }
    });
  }

  async loadCirugiasForEgreso(ingreso: string) {
    this.loadingCirugias.set(true);
    try {
      const cirugias = await this.cirugiaService.getCirugiasByIngreso(ingreso);
      this.activeEgresoCirugias.set(cirugias);
    } catch (error) {
      console.error('Error loading cirugias:', error);
      this.activeEgresoCirugias.set([]);
    } finally {
      this.loadingCirugias.set(false);
    }
  }

  async loadNotasForEgreso(ingreso: string) {
    this.loadingNotas.set(true);
    try {
      const notas = await this.notaOperatoriaService.getNotasByIngreso(ingreso);
      this.activeEgresoNotas.set(notas);
    } catch (error) {
      console.error('Error loading notas:', error);
      this.activeEgresoNotas.set([]);
    } finally {
      this.loadingNotas.set(false);
    }
  }

  openEgresoTab(egreso: Egreso) {
    const currentTabs = this.openEgresoTabs();
    if (!currentTabs.find(e => e.id === egreso.id)) {
      if (currentTabs.length >= 5) {
        currentTabs.shift();
      }
      this.openEgresoTabs.set([...currentTabs, egreso]);
    }
    this.activeTabId.set(egreso.id);
    this.activeSubTab.set('general');
  }

  closeEgresoTab(id: string) {
    const updated = this.openEgresoTabs().filter(e => e.id !== id);
    this.openEgresoTabs.set(updated);
    if (this.activeTabId() === id) {
      this.activeTabId.set('main');
    }
  }

  getActiveEgreso(): Egreso | undefined {
    return this.openEgresoTabs().find(e => e.id === this.activeTabId());
  }

  startEditingObservation(egreso: Egreso) {
    this.editingObservationId.set(egreso.id);
    this.editObservationText.set(egreso.observacion || '');
  }

  updateEditObservationText(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.editObservationText.set(target.value);
  }

  formatLiquidation(val: string | null): string {
    if (!val) return 'N/A';
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return `${Math.round(num * 100)}%`;
    }
    return val;
  }

  formatHC15(val: string | null): string[] {
    if (!val || val.trim() === '' || val === 'N/A') return [];
    const parts = val.split(/[\s,]+/).map(p => p.trim()).filter(p => p.length > 0);
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 3) {
      lines.push(parts.slice(i, i + 3).join(', '));
    }
    return lines;
  }

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

  getEstadoClass(estado: string): string {
    const e = estado?.toUpperCase().trim() || '';
    if (e === 'NO FACTURABLE') return 'bg-[#FF0000] text-white';
    if (e === 'OK') return 'bg-[#38761D] text-white';
    if (e === 'CAMBIO') return 'bg-[#666666] text-white';
    if (e === 'HECHO') return 'bg-[#6AA84F] text-white';
    if (e === 'ADICION') return 'bg-[#38761D] text-white';
    if (e === 'ADICION PTE') return 'bg-white text-black border border-slate-300';
    if (e === 'HECHO PTE') return 'bg-white text-black border border-slate-300';
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }

  cancelEditingObservation() {
    this.editingObservationId.set(null);
    this.editObservationText.set('');
  }

  async saveObservation(id: string) {
    if (!id) return;
    
    this.isSavingObservation.set(true);
    try {
      await this.egresoService.actualizarObservacion(id, this.editObservationText());
      
      // Update the local tab state as well
      const updatedTabs = this.openEgresoTabs().map(e => 
        e.id === id ? { ...e, observacion: this.editObservationText() } : e
      );
      this.openEgresoTabs.set(updatedTabs);
      
      this.editingObservationId.set(null);
    } catch (error) {
      console.error('Error al guardar la observación:', error);
      // Here you could show a toast or alert
    } finally {
      this.isSavingObservation.set(false);
    }
  }
}
