import { Component, input, signal, computed, inject, ViewChild, ElementRef, ChangeDetectionStrategy, effect } from '@angular/core';
import { ConsolidadoRecord, ConsolidadoService, HistorialCambio, CorteEstancia } from '../../services/consolidado.service';
import { EpsSinConvenioService } from '../../services/eps-sin-convenio.service';
import { EpsCorteAdministrativoService } from '../../services/eps-corte-administrativo.service';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, DatePipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SupabaseService } from '../../services/supabase.service';
import { PacienteConsolidadoModalComponent } from './paciente-consolidado-modal.component';
import { LucideAngularModule, Trash2, PenLine, Check, X, AlertTriangle, Clock, Search, FileText, RefreshCw, AlertCircle, ChevronDown, Filter, ArrowUpDown, ArrowUp, ArrowDown, Plus, Eye, History, Download, MoreHorizontal, MapPin, Building2, CheckSquare, FileSignature, LayoutDashboard, FolderHeart, PlusCircle, FolderX, UserCog, Building, MessageSquare, SearchX, Badge, CalendarRange, User, Code, CheckCircle, ChevronLeft, ChevronRight, Ambulance } from 'lucide-angular';

interface TramiteHistory {
  fecha: string;
  tipo: string;
  nota: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedAt?: string;
}

interface SoporteEntry {
  id: string;
  fecha_solicitud: string;
  periodo_desde?: string;
  periodo_hasta?: string;
  autorizacion_recibida: boolean;
  soporte_pdf_presente?: boolean;
  fecha_registro_soporte?: string;
}

export interface MappedConsolidadoRecord extends ConsolidadoRecord {
  _hasCortes: boolean;
  _diasCorte: number;
  _derechosEstado: string;
  _visibleObs: string;
  _latestTramite: string;
  _isSinConvenio: boolean;
  _isCorteAdmin: boolean;
  _hasTramiteHistory: boolean;
  _latestSoporte: SoporteEntry | null;
  _latestTramiteDate: string;
  _diasHospNum: number;
  _hcStr: string;
  _ingresoStr: string;
  _idStr: string;
  _fechaIngresoFormatted: string;
  _fechaHospFormatted: string;
}

@Component({
  selector: 'app-consolidado-list',
  standalone: true,
  imports: [MatIconModule, NgClass, DatePipe, ScrollingModule, PacienteConsolidadoModalComponent, LucideAngularModule],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full animate-in fade-in duration-300 px-6 pb-6 pt-1 focus:outline-none" role="button" tabindex="0">
      <div class="h-full flex flex-col relative bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden"
           [ngClass]="[
             view() === 'validacion_derechos' ? 'max-w-[1000px] mx-auto' : ''
           ]">
           
        <div class="overflow-auto flex-1">
          <table class="w-full text-left whitespace-nowrap table-auto border-separate border-spacing-0">
            <thead class="text-[11px] font-medium text-slate-500 bg-[#F8F9FA] sticky top-0 z-10 shadow-[0_1px_0_rgba(226,232,240,1)]">
              <tr>
                <th class="px-5 py-2.5 w-10 font-medium">#</th>
                
                <!-- Ubicación -->
                <th class="px-5 py-2.5 min-w-[200px] cursor-pointer hover:text-slate-700 transition-colors group/header relative font-medium" (click)="toggleSort('area')">
                  <div class="flex items-center gap-2">
                    <lucide-icon [name]="MapPin" class="w-4 h-4 text-slate-400"></lucide-icon>
                    <span>Ubicación</span>
                    <button class="opacity-0 group-hover/header:opacity-100 transition-opacity ml-1 p-1 hover:bg-slate-200 rounded" (click)="toggleColumnFilterInput('area', $event)">
                      <lucide-icon [name]="Filter" class="w-3 h-3 text-slate-500" [class.text-slate-800]="columnFilters()['area']"></lucide-icon>
                    </button>
                    <lucide-icon [name]="getSortIcon('area')" class="w-3.5 h-3.5 text-slate-400 ml-auto"></lucide-icon>
                  </div>
                  @if (activeColumnFilterInputs()['area']) {
                    <div class="absolute left-4 right-4 top-10 z-20" (click)="$event.stopPropagation()">
                      <input type="text" placeholder="Filtrar..." [value]="columnFilters()['area'] || ''" (input)="setColumnFilter('area', $any($event.target).value)" class="w-full text-[11px] p-1.5 border-b border-slate-300 border-x-0 border-t-0 bg-white rounded-none shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-0 focus:border-slate-500">
                    </div>
                  }
                </th>

                <!-- Paciente -->
                <th class="px-5 py-2.5 min-w-[200px] group/header relative font-medium">
                  <div class="flex items-center gap-2">
                    <span>Paciente</span>
                    <button class="opacity-0 group-hover/header:opacity-100 transition-opacity ml-1 p-1 hover:bg-slate-200 rounded" (click)="toggleColumnFilterInput('paciente', $event)">
                      <lucide-icon [name]="Filter" class="w-3 h-3 text-slate-500" [class.text-slate-800]="columnFilters()['paciente']"></lucide-icon>
                    </button>
                  </div>
                  @if (activeColumnFilterInputs()['paciente']) {
                    <div class="absolute left-4 right-4 top-10 z-20" (click)="$event.stopPropagation()">
                      <input type="text" placeholder="Filtrar..." [value]="columnFilters()['paciente'] || ''" (input)="setColumnFilter('paciente', $any($event.target).value)" class="w-full text-[11px] p-1.5 border-b border-slate-300 border-x-0 border-t-0 bg-white rounded-none shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-0 focus:border-slate-500">
                    </div>
                  }
                </th>

                <!-- Admisión -->
                <th class="px-5 py-2.5 min-w-[150px] group/header relative font-medium">
                  <div class="flex items-center gap-2">
                    <span>Admisión</span>
                  </div>
                </th>

                <!-- Entidad -->
                <th class="px-5 py-2.5 min-w-[250px] max-w-[400px] cursor-pointer hover:text-slate-700 transition-colors group/header relative font-medium" (click)="toggleSort('entidad')">
                  <div class="flex items-center gap-2">
                    <lucide-icon [name]="Building2" class="w-4 h-4 text-slate-400"></lucide-icon>
                    <span>Entidad</span>
                    <lucide-icon [name]="getSortIcon('entidad')" class="w-3.5 h-3.5 text-slate-400 ml-auto"></lucide-icon>
                    <button class="opacity-0 group-hover/header:opacity-100 transition-opacity ml-1 p-1 hover:bg-slate-200 rounded" (click)="toggleColumnFilterInput('entidad', $event)">
                      <lucide-icon [name]="Filter" class="w-3 h-3 text-slate-500" [class.text-slate-800]="columnFilters()['entidad']"></lucide-icon>
                    </button>
                  </div>
                  @if (activeColumnFilterInputs()['entidad']) {
                    <div class="absolute left-4 right-4 top-10 z-20" (click)="$event.stopPropagation()">
                      <input type="text" placeholder="Filtrar..." [value]="columnFilters()['entidad'] || ''" (input)="setColumnFilter('entidad', $any($event.target).value)" class="w-full text-[11px] p-1.5 border-b border-slate-300 border-x-0 border-t-0 bg-white rounded-none shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-0 focus:border-slate-500">
                    </div>
                  }
                </th>


                <!-- Gestión Estancia -->
                @if (view() === 'general' || view() === 'estancias_nuevas' || view() === 'seguimiento') {
                  <th class="px-5 py-2.5 font-medium min-w-[180px] group/header relative">
                    <div class="flex items-center gap-2">
                      <span>Gestión estancia</span>
                      <button class="opacity-0 group-hover/header:opacity-100 transition-opacity ml-1 p-1 hover:bg-slate-200 rounded" (click)="toggleColumnFilterInput('gestion', $event)">
                        <lucide-icon [name]="Filter" class="w-3 h-3 text-slate-500" [class.text-slate-800]="columnFilters()['gestion']"></lucide-icon>
                      </button>
                    </div>
                    @if (activeColumnFilterInputs()['gestion']) {
                      <div class="absolute left-4 right-4 top-10 z-20" (click)="$event.stopPropagation()">
                        <input type="text" placeholder="Filtrar..." [value]="columnFilters()['gestion'] || ''" (input)="setColumnFilter('gestion', $any($event.target).value)" class="w-full text-[11px] p-1.5 border-b border-slate-300 border-x-0 border-t-0 bg-white rounded-none shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-0 focus:border-slate-500">
                      </div>
                    }
                  </th>
                }

                <!-- Novedades -->
                @if (view() === 'general' || view() === 'estancias_nuevas' || view() === 'seguimiento') {
                  <th class="px-5 py-2.5 font-medium min-w-[250px] group/header relative">
                    <div class="flex items-center gap-2">
                      <span>Novedades</span>
                      <button class="opacity-0 group-hover/header:opacity-100 transition-opacity ml-1 p-1 hover:bg-slate-200 rounded" (click)="toggleColumnFilterInput('novedades', $event)">
                        <lucide-icon [name]="Filter" class="w-3 h-3 text-slate-500" [class.text-slate-800]="columnFilters()['novedades']"></lucide-icon>
                      </button>
                    </div>
                    @if (activeColumnFilterInputs()['novedades']) {
                      <div class="absolute left-4 right-4 top-10 z-20" (click)="$event.stopPropagation()">
                        <input type="text" placeholder="Filtrar..." [value]="columnFilters()['novedades'] || ''" (input)="setColumnFilter('novedades', $any($event.target).value)" class="w-full text-[11px] p-1.5 border-b border-slate-300 border-x-0 border-t-0 bg-white rounded-none shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-0 focus:border-slate-500">
                      </div>
                    }
                  </th>
                }

                <!-- Soportes -->
                @if (view() === 'general' || view() === 'estancias_nuevas' || view() === 'seguimiento') {
                  <th class="px-5 py-2.5 font-medium w-24">
                    <span>Soportes</span>
                  </th>
                }
                
                <!-- Consolidado -->
                <th class="px-5 py-2.5 font-medium w-24 text-center">
                  <span>Consolidado</span>
                </th>

                @if (view() === 'pgp_aic') {
                  <th class="px-5 py-2.5 font-medium min-w-[150px]">
                    <span>Confirmación pgp</span>
                  </th>
                  <th class="px-5 py-2.5 font-medium min-w-[200px]">
                    <span>Justificación</span>
                  </th>
                }
              </tr>
            </thead>
            <tbody class="text-slate-600 align-top text-[11px]">
              @for (r of paginatedRegistros(); track r._idStr; let i = $index) {
                <tr class="border-b border-slate-100 cursor-default group focus:outline-none"
                    [ngClass]="{
                      'bg-red-50 transition-none': consolidadoService.registrosActualizados().has(r._idStr),
                      'bg-white transition-colors duration-200 hover:bg-slate-50': !consolidadoService.registrosActualizados().has(r._idStr)
                    }">
                  <!-- Enumeración -->
                  <td class="px-5 py-4 text-center border-b border-slate-100">
                    <span class="text-[10px] font-medium text-slate-400">
                      {{ i + 1 }}
                    </span>
                  </td>
                  
                  <!-- Ubicación -->
                  <td class="px-5 py-4 border-b border-slate-100 whitespace-normal">
                    <div class="flex items-start justify-between gap-2 group/ubicacion">
                      <div>
                        <div class="font-medium text-slate-800 mb-0.5" [class.bg-missing-value]="!r['area']">{{ r['area'] || 'N/A' }}</div>
                        <div class="text-[10px] text-slate-500 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200" [class.bg-missing-value]="!r['cama']">Cama: {{ r['cama'] || 'N/A' }}</div>
                      </div>
                      <button (click)="openGiroCamaModal(r)" 
                              class="transition-opacity p-1 rounded hover:bg-slate-200 shrink-0"
                              [ngClass]="r['giro_cama'] ? 'text-blue-300 hover:text-blue-600 opacity-100' : 'text-slate-400 hover:text-slate-800 opacity-0 group-hover/ubicacion:opacity-100'"
                              title="Ver Giro Cama">
                        <lucide-icon [name]="History" class="w-4 h-4"></lucide-icon>
                      </button>
                    </div>
                  </td>

                  <!-- Paciente -->
                  <td class="px-5 py-4 border-b border-slate-100 whitespace-normal">
                    <div class="flex items-start justify-between gap-2 group/paciente">
                      <div>
                        <div class="font-bold text-slate-900 mb-1" [class.bg-missing-value]="!r['nombre']">{{ r['nombre'] || 'N/A' }}</div>
                        <div class="text-[10px] text-slate-500 font-mono leading-tight flex flex-col gap-0.5">
                          <div class="hover:text-emerald-600 transition-colors cursor-pointer" 
                               (click)="copyToClipboard(r._hcStr, $event)"
                               (keydown.enter)="copyToClipboard(r._hcStr, $event)"
                               tabindex="0" [class.bg-missing-value]="!r['hc']">HC: {{ r['hc'] || 'N/A' }}</div>
                          <div class="hover:text-emerald-600 transition-colors cursor-pointer"
                               (click)="copyToClipboard(r._ingresoStr, $event)"
                               (keydown.enter)="copyToClipboard(r._ingresoStr, $event)"
                               tabindex="0" [class.bg-missing-value]="!r['ingreso']">Ing: {{ r['ingreso'] || 'N/A' }}</div>
                          
                          <!-- Validación de Derechos Badge -->
                          @if (r['validacion_derechos']) {
                            <div class="mt-2">
                              <button (click)="openDerechosModal(r)" 
                                      class="flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-800 transition-colors text-left"
                                      [title]="r._derechosEstado + ' por: ' + r['validacion_derechos'] + ' (' + (r['validacion_derechos_fecha'] | date:'dd/MM/yyyy hh:mm:ss a') + ')'">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                {{ r._derechosEstado }}: 
                                @if (r['valdiacion_derechos_fecha'] || r['validacion_derechos_fecha']) {
                                  <span class="font-bold text-slate-700">{{ (r['valdiacion_derechos_fecha'] || r['validacion_derechos_fecha']) | date:'dd/MM/yyyy' }}</span>
                                }
                              </button>
                            </div>
                          }

                          @if (r['novedad']) {
                            <div class="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded mt-1">
                              {{ r['novedad'] }}
                            </div>
                          }
                        </div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <button (click)="openDetalleModal(r)" class="text-slate-400 hover:text-slate-800 opacity-0 group-hover/paciente:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 shrink-0" title="Ver detalle completo">
                          <lucide-icon [name]="Eye" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="openDerechosModal(r)" 
                                class="text-slate-400 hover:text-slate-800 opacity-0 group-hover/paciente:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 shrink-0"
                                [title]="r['validacion_derechos'] ? r._derechosEstado + ' por: ' + r['validacion_derechos'] + ' (' + (r['validacion_derechos_fecha'] | date:'dd/MM/yyyy hh:mm:ss a') + ')' : 'Validar derechos'">
                          <lucide-icon [name]="CheckSquare" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </div>
                  </td>

                  <!-- Admisión -->
                  <td class="px-5 py-4 border-b border-slate-100 whitespace-normal">
                    <div class="flex flex-col gap-2">
                       <div class="flex items-center justify-between gap-3">
                         <div class="flex flex-col">
                           <span class="text-[9px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">F. Ingreso</span>
                           <span class="text-[10px] text-slate-500 font-mono leading-tight">{{ r._fechaIngresoFormatted }}</span>
                         </div>
                         <span class="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 py-0.5 rounded w-10 text-center shrink-0 inline-block" title="Días Ingreso">{{ r['dias_ingr'] || 0 }}d</span>
                       </div>
                       
                       <div class="flex items-center justify-between gap-3">
                         <div class="flex flex-col">
                           <span class="text-[9px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">F. Hospitalización</span>
                           <span class="text-[10px] text-slate-500 font-mono leading-tight">{{ r._fechaHospFormatted }}</span>
                         </div>
                         <span class="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 py-0.5 rounded w-10 text-center shrink-0 inline-block" title="Días Hospitalización">{{ r['dias_hosp'] || 0 }}d</span>
                       </div>
                    </div>
                  </td>

                  <!-- Entidad -->
                  <td class="px-5 py-4 border-b border-slate-100 whitespace-normal max-w-[400px]">
                    <div class="flex items-start justify-between gap-2 group/entidad">
                      <div>
                        <div class="font-medium text-slate-800 mb-0.5 flex items-center flex-wrap gap-1">
                          {{ r['entidad'] || 'N/A' }}
                          @if (r._isSinConvenio) {
                            <span class="text-[9px] font-normal border border-slate-800 text-slate-800 px-1.5 py-0.5 rounded uppercase whitespace-nowrap">SIN CONVENIO</span>
                          }
                        </div>
                        <div class="text-[10px] text-slate-500 mb-0.5">Contrato: {{ r['contrato'] || 'N/A' }}</div>
                        <div class="text-[9px] text-slate-400 uppercase">{{ r['municipio'] || 'N/A' }}</div>
                        @if (r['eps_soat']) {
                          <div class="text-[10px] text-slate-600 font-medium mt-0.5">EPS: {{ r['eps_soat'] }}</div>
                        }

                        @if (r['fecha_egreso_entidad']) {
                          <div class="mt-1 flex items-center gap-1 text-[9px] text-slate-500">
                            <lucide-icon [name]="CalendarRange" class="w-3 h-3 text-emerald-500"></lucide-icon>
                            Últ. corte: <span class="font-bold text-slate-700">{{ r['fecha_egreso_entidad'] | date:'dd/MM/yyyy' }}</span>
                          </div>
                        }
                        
                        @if (r._isCorteAdmin) {
                          @if (r._diasCorte >= 30) {
                            <div class="mt-1 inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[9px] font-bold" title="Han pasado 30 días o más desde el ingreso o último corte">
                              <lucide-icon [name]="AlertTriangle" class="w-3 h-3"></lucide-icon>
                              CORTE VENCIDO ({{ r._diasCorte }}d)
                            </div>
                          } @else if (r._diasCorte >= 25) {
                            <div class="mt-1 inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold" title="Próximo a vencer corte de 30 días">
                              <lucide-icon [name]="Clock" class="w-3 h-3"></lucide-icon>
                              CORTE PRÓXIMO ({{ r._diasCorte }}d)
                            </div>
                          }
                        }
                      </div>
                      <div class="flex flex-col items-center gap-1 shrink-0">
                        <button (click)="openEntidadModal(r)" class="text-slate-400 hover:text-slate-800 opacity-0 group-hover/entidad:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200" title="Editar entidad">
                          <lucide-icon [name]="PenLine" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </div>
                  </td>

                  <!-- Gestión Estancia -->
                  @if (view() === 'general' || view() === 'estancias_nuevas' || view() === 'seguimiento') {
                    <td class="px-5 py-4 border-b border-slate-100 whitespace-normal">
                      <div class="flex items-start justify-between gap-2 group/gestion">
                        <div class="flex flex-col gap-1.5 w-[140px]">
                          <!-- Aut Tag -->
                          <div class="flex items-center justify-between gap-1.5 bg-slate-100/50 border border-slate-200 rounded-md px-2 py-1">
                            <span class="text-[10px] font-medium text-slate-500 shrink-0">Aut:</span>
                            @if (r['aut_estancia'] === 'SI') {
                              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-tight">
                                <lucide-icon [name]="Check" class="w-3 h-3 text-emerald-600"></lucide-icon>
                                SI
                              </span>
                            } @else if (r['aut_estancia'] === 'NO') {
                              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 text-[10px] font-bold tracking-tight">
                                <lucide-icon [name]="X" class="w-3 h-3 text-red-600"></lucide-icon>
                                NO
                              </span>
                            } @else if (r['aut_estancia'] === 'PGP') {
                              <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800 text-[10px] font-bold tracking-tight">
                                PGP
                              </span>
                            } @else if (r['aut_estancia'] === 'PP') {
                              <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 text-[10px] font-bold tracking-tight">
                                PP
                              </span>
                            } @else {
                              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-tight">
                                <lucide-icon [name]="Clock" class="w-3 h-3"></lucide-icon>
                                PEND
                              </span>
                            }
                          </div>
                          <!-- Gestión Tag -->
                          <div class="flex flex-col items-start bg-slate-100/50 border border-slate-200 rounded-md px-2.5 py-1.5 relative overflow-hidden">
                            <span class="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Gestión</span>
                            <div class="flex items-center gap-1.5">
                              <lucide-icon [name]="CalendarRange" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                              <span class="text-[11px] font-medium text-slate-700" [title]="r['fecha_proxima_gestion'] || r['gestion_estancia'] || 'Sin fecha'">
                                {{ r['fecha_proxima_gestion'] || r['gestion_estancia'] || '---' }}
                              </span>
                            </div>
                            <!-- Small accent bar on the left -->
                            <div class="absolute left-0 top-0 bottom-0 w-1" [class.bg-red-500]="r['fecha_proxima_gestion'] && r['fecha_proxima_gestion'].substring(0, 10) === getBogotaDateOnly()" [class.bg-slate-300]="!(r['fecha_proxima_gestion'] && r['fecha_proxima_gestion'].substring(0, 10) === getBogotaDateOnly())"></div>
                          </div>
                        </div>
                        <div class="flex flex-col items-center gap-1 shrink-0">
                          <button (click)="openGestionModal(r)" class="text-slate-400 hover:text-blue-600 opacity-0 group-hover/gestion:opacity-100 transition-colors p-1 rounded-md hover:bg-blue-50 shrink-0" title="Editar gestión">
                            <lucide-icon [name]="PenLine" class="w-4 h-4"></lucide-icon>
                          </button>
                        </div>
                      </div>
                    </td>
                  }

                  <!-- Novedades -->
                  @if (view() === 'general' || view() === 'estancias_nuevas' || view() === 'seguimiento') {
                    <td class="px-5 py-4 border-b border-slate-100 whitespace-normal min-w-[250px]">
                      <div class="flex items-start justify-between gap-2 group/obs">
                        <div class="flex-1 flex flex-col gap-1.5">
                          <!-- Proceso Notif & Actions -->
                          <div class="flex items-center justify-between">
                            <div class="font-medium text-slate-800 text-[11px]">
                              @if (r._hasTramiteHistory) {
                                {{ r['proceso_notif'] || 'Sin proceso' }}
                              } @else {
                                <span class="text-slate-400 italic"></span>
                              }
                            </div>
                            
                            <div class="flex items-center gap-1">
                              <!-- Tramite Action -->
                              <button (click)="openTramiteModal(r)" 
                                      class="relative p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700" 
                                      [title]="r._hasTramiteHistory ? 'Ver/Editar trámite' : 'Agregar trámite'">
                                <lucide-icon [name]="FileText" class="w-3.5 h-3.5"></lucide-icon>
                                @if (r._hasTramiteHistory) {
                                  <span class="absolute top-[2px] right-[2px] w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                                }
                              </button>
                              
                              <!-- Observaciones Action -->
                              <button (click)="openObsModal(r)" 
                                      class="relative p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700" 
                                      [title]="r._visibleObs ? 'Editar observación' : 'Agregar observación'">
                                <lucide-icon [name]="MessageSquare" class="w-3.5 h-3.5"></lucide-icon>
                                @if (r._visibleObs) {
                                  <span class="absolute top-[2px] right-[2px] w-1.5 h-1.5 bg-amber-500 rounded-full border border-white"></span>
                                }
                              </button>
                            </div>
                          </div>
                          
                          <!-- Content Area -->
                          <div class="flex flex-col gap-1.5 mt-0.5">
                            <!-- Latest Tramite Note -->
                            @if (r._latestTramite) {
                              <div class="flex gap-2 p-1.5 rounded-md bg-slate-50 border border-slate-100 relative">
                                <div class="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-300 rounded-r-full"></div>
                                <div class="flex-1 min-w-0 pl-1">
                                  <div class="text-[10px] text-slate-700 leading-snug flex items-center gap-1.5">
                                    @if (r._latestTramite.includes('Referencia')) {
                                      <div class="relative">
                                        <lucide-icon [name]="Ambulance" class="w-3.5 h-3.5 text-red-500"></lucide-icon>
                                        <span class="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                                      </div>
                                    }
                                    {{ r._latestTramite }}
                                  </div>
                                  @if (r._latestTramiteDate) {
                                    <div class="text-[9px] text-slate-400 font-medium mt-0.5">{{ r._latestTramiteDate }}</div>
                                  }
                                </div>
                              </div>
                            }

                            <!-- Observaciones Text -->
                            @if (r._visibleObs) {
                              <div class="flex gap-2 p-1.5 rounded-md bg-amber-50/50 border border-amber-100/50 relative">
                                <div class="absolute left-0 top-1 bottom-1 w-0.5 bg-amber-300 rounded-r-full"></div>
                                <div class="flex-1 min-w-0 pl-1">
                                  <div class="text-[10px] text-slate-600 italic whitespace-pre-line leading-relaxed">{{ r._visibleObs }}</div>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                  }

                  <!-- Soportes -->
                  @if (view() === 'general' || view() === 'estancias_nuevas' || view() === 'seguimiento') {
                    <td class="px-5 py-4 border-b border-slate-100 whitespace-normal">
                      <div class="flex items-start justify-between gap-2 group/soportes">
                        <div class="flex-1">
                          @if (r._latestSoporte; as latest) {
                            <div class="flex items-center gap-2 mb-2">
                             <lucide-icon [name]="latest.autorizacion_recibida ? CheckCircle : AlertCircle" 
                                          [class]="latest.autorizacion_recibida ? 'text-emerald-500' : 'text-red-500'"
                                          class="w-5 h-5">
                             </lucide-icon>
                             <lucide-icon [name]="latest.soporte_pdf_presente ? FileText : AlertCircle" 
                                          [class]="latest.soporte_pdf_presente ? 'text-emerald-500' : 'text-red-500'"
                                          class="w-5 h-5">
                             </lucide-icon>
                            @if (latest.periodo_desde) {
                              <span class="text-[10px] text-slate-500 font-medium">
                                Período: {{ latest.periodo_desde | date:'dd/MM' }} - {{ latest.periodo_hasta | date:'dd/MM' }}
                              </span>
                            }
                          </div>
                          } @else {
                            <span class="text-slate-400 italic">Sin soportes</span>
                          }
                        </div>
                        <button (click)="openSoportesModal(r)" class="text-slate-400 hover:text-slate-800 opacity-0 group-hover/soportes:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 shrink-0" title="Gestionar soportes">
                          <lucide-icon [name]="FileSignature" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </td>
                    <td class="px-5 py-4 border-b border-slate-100 text-center">
                      <button (click)="viewingConsolidadoRecord.set(r)" class="p-1 rounded hover:bg-slate-200">
                        <lucide-icon [name]="LayoutDashboard" class="w-5 h-5 text-indigo-600"></lucide-icon>
                      </button>
                    </td>
                  }

                  @if (view() === 'pgp_aic') {
                    <td class="px-5 py-4 border-b border-slate-100 text-[11px] text-slate-700">{{ r['confirmacion_pgp'] || '-' }}</td>
                    <td class="px-5 py-4 border-b border-slate-100 text-[11px] text-slate-600 whitespace-normal">{{ r['justificacion'] || '-' }}</td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-slate-500">
                    <div class="flex flex-col items-center gap-2">
                      <lucide-icon [name]="Search" class="w-8 h-8 text-slate-300"></lucide-icon>
                      No se encontraron registros.
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Controls -->
        <div class="px-5 py-2.5 border-t border-slate-200 bg-white flex items-center justify-between sticky bottom-0 z-20">
          <div class="text-[11px] text-slate-500">
            Mostrando {{ paginationStart() + 1 }} a {{ paginationEnd() }} de {{ filteredRegistros().length }} registros
          </div>
          <div class="flex items-center gap-1">
            <button (click)="prevPage()" [disabled]="currentPage() === 1" class="flex items-center justify-center w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-2">
              <lucide-icon [name]="ChevronLeft" class="w-3.5 h-3.5 text-slate-500"></lucide-icon>
            </button>
            @for (page of visiblePages(); track page; let i = $index) {
              @if (page === '...') {
                <span class="w-7 h-7 flex items-center justify-center text-[11px] text-slate-500">...</span>
              } @else {
                <button (click)="currentPage.set($any(page))" 
                        [class.bg-slate-100]="currentPage() === page" 
                        [class.text-slate-900]="currentPage() === page"
                        [class.text-slate-500]="currentPage() !== page"
                        class="w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-medium hover:bg-slate-50 transition-colors">
                  {{ page }}
                </button>
              }
            }
            <button (click)="nextPage()" [disabled]="currentPage() === totalPages()" class="flex items-center justify-center w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-2">
              <lucide-icon [name]="ChevronRight" class="w-3.5 h-3.5 text-slate-500"></lucide-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    @if (editingObsRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [name]="PenLine" class="w-4 h-4 text-slate-500"></lucide-icon>
              Observaciones
            </h3>
            <button (click)="closeObsModal()" class="text-slate-400 hover:text-slate-600">
              <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          <div class="p-4 flex-1 overflow-auto max-h-[60vh]">
            <div class="mb-4 space-y-2">
              <h4 class="text-xs font-semibold text-slate-600 uppercase">Observaciones Previas</h4>
              @if (parsedObs().length > 0) {
                <div class="bg-slate-50 rounded border border-slate-200 divide-y divide-slate-200">
                  @for (obs of parsedObs(); track $index) {
                    <div class="p-2 flex justify-between items-start gap-2 hover:bg-slate-100 transition-colors">
                      <div class="text-sm font-mono break-all whitespace-pre-wrap flex-1" [class.line-through]="obs.isDeleted" [class.text-slate-400]="obs.isDeleted" [class.text-slate-700]="!obs.isDeleted">
                        {{ obs.text }}
                      </div>
                      @if (!obs.isDeleted) {
                        <button (click)="deleteObs($index)" [disabled]="saving()" class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50" title="Eliminar observación">
                          <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                        </button>
                      } @else {
                        <div class="text-[10px] text-slate-400 italic shrink-0 mt-0.5">
                          Eliminado por {{ obs.deletedBy }}
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="text-sm text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200">Sin observaciones previas.</div>
              }
            </div>
            <div class="space-y-2">
              <label for="newObsInput" class="text-xs font-semibold text-slate-600 uppercase">Nueva Observación</label>
              <textarea id="newObsInput" #newObsInput class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[100px]" placeholder="Escriba la nueva observación aquí..."></textarea>
            </div>
          </div>
          <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
            <button (click)="closeObsModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancelar</button>
            <button (click)="saveObs(newObsInput.value)" [disabled]="saving()" class="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
              }
              Guardar
            </button>
          </div>
        </div>
      </div>
    }

    @if (editingTramiteRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [name]="FileText" class="w-4 h-4 text-slate-500"></lucide-icon>
              Historial y Registro de Trámite
            </h3>
            <button (click)="closeTramiteModal()" class="text-slate-400 hover:text-slate-600">
              <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          
          <!-- Historial -->
          <div class="p-4 overflow-y-auto bg-slate-50/50 max-h-[40vh] border-b border-slate-100">
            <!-- Tabs -->
            <div class="flex border-b border-slate-200 mb-4">
              <button (click)="tramiteTab.set('activos')" [class.border-emerald-500]="tramiteTab() === 'activos'" [class.text-emerald-600]="tramiteTab() === 'activos'" class="px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-colors">Activos</button>
              <button (click)="tramiteTab.set('historico')" [class.border-emerald-500]="tramiteTab() === 'historico'" [class.text-emerald-600]="tramiteTab() === 'historico'" class="px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-colors">Histórico</button>
            </div>

            @if (tramiteTab() === 'activos') {
              @if (activeTramites().length > 0) {
                <div class="space-y-3">
                  @for (tramite of activeTramites(); track $index) {
                    <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{{ tramite.tipo }}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] text-slate-400">{{ tramite.fecha }}</span>
                          <button (click)="deleteTramite(parsedTramites().indexOf(tramite))" [disabled]="saving()" class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50" title="Eliminar trámite">
                            <lucide-icon [name]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                          </button>
                        </div>
                      </div>
                      <div class="text-sm text-slate-600 whitespace-pre-line">
                        {{ tramite.nota }}
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-sm text-slate-400 italic">No hay trámites activos.</div>
              }
            } @else {
              @if (deletedTramites().length > 0) {
                <div class="space-y-2">
                  @for (tramite of deletedTramites(); track $index) {
                    <div class="bg-slate-100 p-2 rounded border border-slate-200">
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-bold text-slate-500">{{ tramite.tipo }}</span>
                        <span class="text-[9px] text-slate-400">{{ tramite.fecha }}</span>
                      </div>
                      <div class="text-xs text-slate-500 line-through whitespace-pre-line">{{ tramite.nota }}</div>
                      <div class="text-[9px] text-slate-400 italic mt-0.5">Eliminado por {{ tramite.deletedBy }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-sm text-slate-400 italic">No hay trámites en el histórico.</div>
              }
            }
          </div>

          <!-- Formulario -->
          <div class="p-4 bg-white shrink-0 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-600 uppercase">Tipo de Trámite</label>
                <div class="grid grid-cols-1 gap-2 p-2 border border-slate-300 rounded max-h-40 overflow-y-auto bg-white">
                  @for (option of ['ACTIVO', 'Auditoría concurrente', 'Referencia y Contrareferencia', 'Otro']; track option) {
                     <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                       <input type="checkbox" [value]="option" (change)="toggleTramiteOption(option)" class="rounded text-emerald-600 focus:ring-emerald-500">
                       {{ option }}
                     </label>
                  }
                </div>
              </div>
              
              <div class="space-y-1" [class.hidden]="!tramiteOption().includes('Otro')">
                <label for="otroTramiteInput" class="text-xs font-semibold text-slate-600 uppercase">Especificar Trámite</label>
                <input id="otroTramiteInput" #otroTramiteInput (input)="0" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Escriba el tipo de trámite">
              </div>

              <div class="space-y-1" [class.hidden]="!tramiteOption().includes('ACTIVO')">
                <label for="autorizadorTramiteInput" class="text-xs font-semibold text-slate-600 uppercase">Autorizador</label>
                <input id="autorizadorTramiteInput" #autorizadorTramiteInput [value]="tramiteAutorizador()" (input)="tramiteAutorizador.set(autorizadorTramiteInput.value)" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Nombre del autorizador">
              </div>
            </div>

            <div class="space-y-1">
              <label for="notaTramiteInput" class="text-xs font-semibold text-slate-600 uppercase">Nota / Observación</label>
              <textarea id="notaTramiteInput" #notaTramiteInput (input)="0" rows="2" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none" placeholder="Escriba los detalles del trámite..."></textarea>
            </div>
          </div>

          <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 shrink-0">
            <button (click)="closeTramiteModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cerrar</button>
            <button (click)="saveTramite(tramiteOption().join(', '), tramiteOption().includes('Otro') ? otroTramiteInput?.value : '', notaTramiteInput.value, tramiteAutorizador())" [disabled]="saving() || !tramiteOption().length || !notaTramiteInput.value.trim() || (tramiteOption().includes('ACTIVO') && !tramiteAutorizador().trim())" class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
              } @else {
                <mat-icon class="w-4 h-4 text-[16px]">add</mat-icon>
              }
              Agregar Trámite
            </button>
          </div>
        </div>
      </div>
    }

    @if (editingSoportesRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [name]="FolderHeart" class="w-4 h-4 text-slate-500"></lucide-icon>
              Control de Soportes y Autorizaciones
            </h3>
            <button (click)="closeSoportesModal()" class="text-slate-400 hover:text-slate-600">
              <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Formulario Nueva Entrada -->
            @if (isAddingSoporte()) {
              <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Nueva Solicitud / Prórroga</h4>
                  <button (click)="isAddingSoporte.set(false)" class="text-xs text-slate-500 hover:text-slate-800">Cancelar</button>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                  <div class="space-y-1">
                    <label for="fechaSolicitud" class="text-[10px] font-bold text-slate-500 uppercase">Fecha Solicitud</label>
                    <input id="fechaSolicitud" type="date" [value]="newSoporte().fecha_solicitud" (input)="updateNewSoporteField('fecha_solicitud', $any($event.target).value)"
                           class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  </div>
                  <div class="space-y-1">
                    <label for="periodoDesde" class="text-[10px] font-bold text-slate-500 uppercase">Desde</label>
                    <input id="periodoDesde" type="date" [value]="newSoporte().periodo_desde" (input)="updateNewSoporteField('periodo_desde', $any($event.target).value)"
                           class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  </div>
                  <div class="space-y-1">
                    <label for="periodoHasta" class="text-[10px] font-bold text-slate-500 uppercase">Hasta</label>
                    <input id="periodoHasta" type="date" [value]="newSoporte().periodo_hasta" (input)="updateNewSoporteField('periodo_hasta', $any($event.target).value)"
                           class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  </div>
                </div>

                <div class="flex items-center gap-6 pt-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" [checked]="newSoporte().autorizacion_recibida" (change)="updateNewSoporteField('autorizacion_recibida', $any($event.target).checked)"
                           class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500">
                    <span class="text-sm font-medium text-slate-700">Autorización Recibida</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" [checked]="newSoporte().soporte_pdf_presente" (change)="updateNewSoporteField('soporte_pdf_presente', $any($event.target).checked)"
                           class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500">
                    <span class="text-sm font-medium text-slate-700">Soporte PDF Presente</span>
                  </label>
                </div>

                <div class="flex justify-end pt-2">
                  <button (click)="addSoporteEntry()" class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm transition-colors">
                    Agregar a la lista
                  </button>
                </div>
              </div>
            } @else {
              <button (click)="isAddingSoporte.set(true)" class="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2 font-medium text-sm">
                <lucide-icon [name]="PlusCircle" class="w-4 h-4"></lucide-icon>
                Nueva Solicitud / Prórroga
              </button>
            }

            <!-- Historial de Soportes -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <lucide-icon [name]="History" class="w-4 h-4"></lucide-icon>
                Historial de Gestiones
              </h4>
              
              @if (soportesHistory().length === 0) {
                <div class="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
                  <lucide-icon [name]="FolderX" class="w-10 h-10 text-slate-300 mb-2"></lucide-icon>
                  <p class="text-sm text-slate-500">No hay registros de soportes.</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (entry of soportesHistory(); track entry.id) {
                    <div class="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow relative group">
                      <button (click)="removeSoporteEntry(entry.id)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <lucide-icon [name]="Trash2" class="w-[18px] h-[18px]"></lucide-icon>
                      </button>

                      <div class="flex items-start gap-4">
                        <div class="flex flex-col items-center justify-center min-w-[60px] py-1 bg-slate-50 rounded border border-slate-100">
                          <span class="text-[10px] font-bold text-slate-400 uppercase">{{ entry.fecha_solicitud | date:'MMM' }}</span>
                          <span class="text-lg font-black text-slate-700 leading-none">{{ entry.fecha_solicitud | date:'dd' }}</span>
                        </div>

                        <div class="flex-1 space-y-2">
                          <div class="flex items-center gap-2">
                            <mat-icon [class]="entry.autorizacion_recibida ? 'text-emerald-500' : 'text-red-500'" 
                                      [title]="entry.autorizacion_recibida ? 'Autorización Recibida' : 'Autorización Pendiente'"
                                      class="text-[18px] w-5 h-5">
                              {{ entry.autorizacion_recibida ? 'check_circle' : 'error' }}
                            </mat-icon>
                            <mat-icon [class]="entry.soporte_pdf_presente ? 'text-emerald-500' : 'text-red-500'"
                                      [title]="entry.soporte_pdf_presente ? 'PDF Presente' : 'PDF Faltante'"
                                      class="text-[18px] w-5 h-5">
                              picture_as_pdf
                            </mat-icon>
                            @if (entry.periodo_desde) {
                              <span class="text-[10px] text-slate-500 font-medium">
                                Período: {{ entry.periodo_desde | date:'dd/MM' }} - {{ entry.periodo_hasta | date:'dd/MM' }}
                              </span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
            <button (click)="closeSoportesModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cerrar</button>
            <button (click)="saveSoportes()" [disabled]="saving() || isAddingSoporte()" class="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
              }
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    }

    @if (editingGestionRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [name]="UserCog" class="w-4 h-4 text-slate-500"></lucide-icon>
              Gestión Estancia
            </h3>
            <button (click)="closeGestionModal()" class="text-slate-400 hover:text-slate-600">
              <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          <div class="p-4 space-y-4">
            <div class="space-y-1">
              <label for="autInput" class="text-xs font-semibold text-slate-600 uppercase">Autorización Estancia</label>
              <select id="autInput" [value]="autInputValue()" (change)="autInputValue.set($any($event.target).value)" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                <option value="SI">SI</option>
                <option value="NO">NO</option>
                <option value="PGP">PGP</option>
                <option value="PP">PP</option>
              </select>
            </div>
            
            @if (autInputValue() === 'NO' || autInputValue() === 'PGP' || autInputValue() === 'PP') {
              <div class="space-y-1 animate-in fade-in duration-200">
                <label for="tipoContratoInput" class="text-xs font-semibold text-slate-600 uppercase">Tipo de Contrato ({{autInputValue()}})</label>
                <select id="tipoContratoInput" [value]="tipoContratoInputValue()" (change)="tipoContratoInputValue.set($any($event.target).value)" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
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
                  <option value="otro">Otro (Integral)</option>
                </select>
                @if (getFrecuenciaSelectValue() === 'otro' && gestionDiasInput() !== -1) {
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
              @if (gestionDiasInput() === -1) {
                <input id="nextDateInput" type="text" disabled value="INTEGRAL" class="w-full p-2 text-sm border border-slate-300 rounded bg-slate-100 text-slate-500 outline-none font-bold">
              } @else {
                <input id="nextDateInput" type="date" [value]="fechaGestionInputValue()" (change)="onFechaGestionChange($any($event.target).value)" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
              }
              <p class="text-[10px] text-slate-500 mt-1">Si borra la fecha, no se gestionará.</p>
            </div>
          </div>
          <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
            <button (click)="closeGestionModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancelar</button>
            <button (click)="saveGestion(autInputValue(), tipoContratoInputValue(), fechaGestionInputValue())" [disabled]="saving()" class="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
              }
              Guardar
            </button>
          </div>
        </div>
      </div>
    }

    @if (editingDerechosRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [name]="CheckSquare" class="w-4 h-4 text-slate-500"></lucide-icon>
              Validar Derechos del Paciente
            </h3>
            <button (click)="closeDerechosModal()" class="text-slate-400 hover:text-slate-600">
              <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          
          <div class="flex border-b border-slate-200 bg-slate-50">
            <button (click)="derechosTab.set('validacion')" [class]="derechosTab() === 'validacion' ? 'flex-1 py-3 text-sm font-medium text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'flex-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100'">Validación</button>
            <button (click)="derechosTab.set('historial')" [class]="derechosTab() === 'historial' ? 'flex-1 py-3 text-sm font-medium text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'flex-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100'">Historial</button>
          </div>

          <div class="p-4 overflow-y-auto h-[500px]">
            @if (derechosError()) {
              <div class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex flex-col gap-3 shadow-sm">
                <div class="flex items-start gap-2">
                  <lucide-icon [name]="AlertCircle" class="w-4 h-4 mt-0.5 shrink-0"></lucide-icon>
                  <span class="font-medium">{{ derechosError() }}</span>
                </div>
                @if (derechosError()?.includes('derechos_paciente')) {
                  <div class="bg-white/50 p-3 rounded border border-red-100 font-mono text-[10px] break-all">
                    ALTER TABLE base_hoy ADD COLUMN derechos_paciente jsonb;
                  </div>
                  <p class="text-[11px] text-red-600 italic">Ejecuta el comando anterior en el editor SQL de Supabase y presiona "Reload Schema".</p>
                }
              </div>
            }

            @if (derechosTab() === 'validacion') {
              @if (editingDerechosRecord()?.['valdiacion_derechos']) {
                <div class="mb-6">
                  <h4 class="text-xs font-semibold text-slate-500 uppercase mb-2">Última Validación</h4>
                  <div class="flex items-center gap-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm">
                    <div class="flex-1">
                      <span class="font-bold text-emerald-800">{{ getDerechosEstado(editingDerechosRecord()) }}</span>
                      <div class="text-[10px] text-emerald-600">Autorizado por: {{ editingDerechosRecord()?.['autorizador'] || editingDerechosRecord()?.['validacion_derechos'] }}</div>
                    </div>
                    <div class="text-xs text-emerald-600 font-mono">
                      {{ (editingDerechosRecord()?.['valdiacion_derechos_fecha'] || editingDerechosRecord()?.['validacion_derechos_fecha']) | date:'dd/MM/yyyy hh:mm:ss a' }}
                    </div>
                  </div>
                </div>
              }

              <div class="space-y-4">
                <h4 class="text-xs font-semibold text-slate-500 uppercase">Nueva Validación</h4>
                <div class="space-y-1">
                  <label for="estadoDerechos" class="text-xs font-semibold text-slate-600 uppercase">Estado de Derechos</label>
                  <select id="estadoDerechos" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                          [value]="derechosEstadoInput()"
                          (change)="derechosEstadoInput.set($any($event.target).value)">
                    <option value="Activo">Activo</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Cambio de EPS">Cambio de EPS</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label for="autorizadorDerechos" class="text-xs font-semibold text-slate-600 uppercase">Nombre del Autorizador</label>
                  <input id="autorizadorDerechos" class="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Nombre del autorizador"
                         [value]="derechosAutorizadorInput()"
                         (input)="derechosAutorizadorInput.set($any($event.target).value)">
                </div>
              </div>
            }

            @if (derechosTab() === 'historial') {
              @if (historialDerechos().length > 0) {
                <div class="space-y-2">
                  @for (derecho of historialDerechos(); track $index) {
                    <div class="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">#{{ historialDerechos().length - $index }}</span>
                          <span class="font-bold text-emerald-700">{{ derecho.estado }}</span>
                        </div>
                        <div class="text-[10px] text-slate-500">
                          Autorizador: <strong>{{ derecho.autorizador }}</strong>
                        </div>
                      </div>
                      <div class="text-xs text-slate-400 font-mono">{{ derecho.fecha || derecho.cambiado_en | date:'dd/MM/yyyy hh:mm:ss a' }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center p-8 text-slate-400">
                  <lucide-icon [name]="History" class="w-10 h-10 mb-2 opacity-50"></lucide-icon>
                  <p class="text-sm">No hay historial de validaciones anteriores.</p>
                </div>
              }
            }
          </div>
          
          <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
            <button (click)="closeDerechosModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancelar</button>
            
            @if (editingDerechosRecord()?.['validacion_derechos'] || editingDerechosRecord()?.['valdiacion_derechos']) {
              <button (click)="anularDerechos()" [disabled]="saving()" class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
                @if (saving()) {
                  <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
                } @else {
                  <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                }
                Anular Validación
              </button>
            }
            
            @if (derechosTab() === 'validacion') {
              <button (click)="saveDerechos()" [disabled]="saving()" class="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
                @if (saving()) {
                  <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
                }
                Guardar Validación
              </button>
            }
          </div>
        </div>
      </div>
    }

    @if (editingEntidadRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [name]="Building" class="w-4 h-4 text-slate-500"></lucide-icon>
              Entidad / EPS
            </h3>
            <button (click)="closeEntidadModal()" class="text-slate-400 hover:text-slate-600">
              <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          
          <!-- Remove Tabs entirely -->
          
          <div class="p-6 overflow-y-auto max-h-[85vh] space-y-8 bg-slate-50/30">
            <!-- Sección 1: Datos de Entidad -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div class="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <lucide-icon [name]="Building2" class="w-4 h-4"></lucide-icon>
                </div>
                <h4 class="font-bold text-slate-700">Configuración de Entidad</h4>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="col-span-1 md:col-span-2 space-y-1">
                  <label for="entidadInput" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entidad Principal</label>
                  <input id="entidadInput" [value]="entidadInputValue()" (input)="entidadInputValue.set($any($event.target).value)" class="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" placeholder="Ej: Nueva EPS">
                </div>
                <div class="space-y-1">
                  <label for="epsSoatInput" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">EPS / Administradora</label>
                  <div class="relative">
                      <input id="epsSoatInput" #epsSoatInput [value]="epsSearchText()" 
                             (input)="onEpsInput($event)" (keydown)="onEpsKeydown($event)" (focus)="showEpsDropdown.set(true)" (click)="showEpsDropdown.set(true)"
                             autocomplete="off"
                             class="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white transition-all" 
                             placeholder="Buscar EPS...">
                      @if (epsSearchText()) {
                        <button (click)="clearEps()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none z-50" title="Limpiar EPS">
                          <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
                        </button>
                      }
                    @if (showEpsDropdown()) {
                      <div class="fixed inset-0 z-40" 
                           (click)="showEpsDropdown.set(false)" 
                           tabindex="-1"
                           role="button"
                           aria-label="Cerrar lista de EPS"></div>
                      <div class="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200" style="background-color: white;">
                        @for (eps of filteredEps(); track eps; let i = $index) {
                          <div class="px-3 py-2 text-sm cursor-pointer flex items-center justify-between group" 
                               [ngClass]="i === focusedEpsIndex() ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-emerald-50 text-slate-700'"
                               (click)="selectEps(eps)" 
                               (mouseover)="focusedEpsIndex.set(i)"
                               (focus)="focusedEpsIndex.set(i)"
                               tabindex="0"
                               role="button">
                            <span>{{ eps }}</span>
                            @if (epsSearchText() === eps) {
                              <lucide-icon [name]="Check" class="text-emerald-500 w-4 h-4"></lucide-icon>
                            }
                          </div>
                        } @empty {
                          <div class="p-4 text-center">
                            <lucide-icon [name]="SearchX" class="text-slate-300 mb-1 w-6 h-6"></lucide-icon>
                            <div class="text-xs text-slate-500 italic">No se encontraron resultados</div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                  <p class="text-[10px] text-slate-400 mt-1 leading-tight">Registre la EPS del paciente cuando la entidad principal es SOAT.</p>
                </div>
                <div class="space-y-1">
                  <label for="contratoInput" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contrato</label>
                  <select id="contratoInput" [value]="contratoInputValue()" (change)="contratoInputValue.set($any($event.target).value)" class="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white transition-all cursor-pointer">
                    <option value="">Seleccione...</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Sección 2: Cortes de Estancia -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div class="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <lucide-icon [name]="CalendarRange" class="w-4 h-4"></lucide-icon>
                </div>
                <h4 class="font-bold text-slate-700">Control y Cortes de Estancia</h4>
              </div>

              <div class="space-y-5">
                <!-- Alertas -->
                @if (editingEntidadDiasCorte() >= 30) {
                  <div class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm shadow-sm">
                    <lucide-icon [name]="AlertTriangle" class="text-red-500 shrink-0 w-5 h-5"></lucide-icon>
                    <div>
                      <strong>¡Alerta de Corte!</strong> Han pasado {{ editingEntidadDiasCorte() }} días desde el último corte. Se superó el límite de 30 días.
                    </div>
                  </div>
                } @else if (editingEntidadDiasCorte() >= 25) {
                  <div class="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg flex items-start gap-2 text-sm shadow-sm">
                    <lucide-icon [name]="Clock" class="text-amber-500 shrink-0 w-5 h-5"></lucide-icon>
                    <div>
                      <strong>Próximo a vencer:</strong> Han pasado {{ editingEntidadDiasCorte() }} días. El corte debe realizarse antes de los 30 días.
                    </div>
                  </div>
                }
                
                <!-- Lista de Cortes -->
                <div class="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
                      <tr>
                        <th class="px-3 py-2.5">Tipo</th>
                        <th class="px-3 py-2.5">Autorización</th>
                        <th class="px-3 py-2.5">Fecha Corte</th>
                        <th class="px-3 py-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                      @for (corte of cortesEstancia(); track corte.id) {
                        <tr class="hover:bg-slate-50 transition-colors">
                          <td class="px-3 py-2.5 text-slate-700">{{ corte.tipo }}</td>
                          <td class="px-3 py-2.5 font-bold text-slate-800">{{ corte.autorizacion }}</td>
                          <td class="px-3 py-2.5 text-slate-600 font-mono text-xs">{{ corte.fecha_corte | date:'dd/MM/yyyy' }}</td>
                          <td class="px-3 py-2.5 text-right">
                            <button (click)="deleteCorte(corte.id)" class="text-slate-400 hover:text-red-600 transition-colors p-1" title="Eliminar corte">
                              <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="4" class="px-3 py-6 text-center text-slate-500 text-sm italic bg-slate-50/50">No hay cortes registrados</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Registrar Nuevo Corte -->
                <div class="bg-slate-50/80 p-4 rounded-lg border border-slate-200">
                  <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Registrar Nuevo Corte</h5>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div class="space-y-1">
                      <label for="tipoCorte" class="text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                      <select id="tipoCorte" #tipoCorteInput (change)="tipoCorteSeleccionado.set(tipoCorteInput.value)" class="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white transition-all">
                        <option value="Direccionamiento">Direccionamiento</option>
                        <option value="Corte administrativo">Corte administrativo</option>
                        <option value="Cambio de EPS">Cambio de EPS</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    @if (tipoCorteSeleccionado() === 'Otro') {
                      <div class="space-y-1">
                        <label for="otroTipoCorte" class="text-[10px] font-bold text-slate-500 uppercase">Especifique</label>
                        <input id="otroTipoCorte" #otroTipoInput (input)="otroTipoCorte.set(otroTipoInput.value)" class="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" placeholder="Tipo de corte">
                      </div>
                    }
                    <div class="space-y-1">
                      <label for="autCorte" class="text-[10px] font-bold text-slate-500 uppercase">Autorización</label>
                      <input id="autCorte" #autCorteInput class="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" placeholder="N° de Autorización">
                    </div>
                    <div class="space-y-1 md:col-span-2 lg:col-span-1">
                      <label for="fechaCorte" class="text-[10px] font-bold text-slate-500 uppercase">Fecha Egreso (Corte)</label>
                      <input id="fechaCorte" #fechaCorteInput type="date" class="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all">
                    </div>
                  </div>
                  <button (click)="saveCorte(tipoCorteSeleccionado() === 'Otro' ? otroTipoCorte() : tipoCorteSeleccionado(), autCorteInput.value, fechaCorteInput.value)" class="w-full py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                    <lucide-icon [name]="Plus" class="w-4 h-4"></lucide-icon>
                    Agregar a la tabla
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 shrink-0">
            <button (click)="closeEntidadModal()" class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Volver</button>
            <button (click)="saveEntidad()" [disabled]="saving()" class="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow flex items-center gap-2 rounded-lg transition-colors disabled:opacity-50">
              @if (saving()) {
                <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
              }
              Guardar Datos de Entidad
            </button>
          </div>
        </div>
      </div>
    }

    @if (viewingDetalleRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          <!-- Header -->
          <div class="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                <lucide-icon [name]="User" class="w-5 h-5 text-slate-500"></lucide-icon>
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-800">{{ viewingDetalleRecord()?.['nombre'] || 'Paciente Sin Nombre' }}</h2>
                <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span class="font-mono bg-white px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">HC: {{ viewingDetalleRecord()?.['hc'] || 'N/A' }}</span>
                  <span class="font-mono bg-white px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">Ing: {{ viewingDetalleRecord()?.['ingreso'] || 'N/A' }}</span>
                  <span>&bull;</span>
                  <span>{{ viewingDetalleRecord()?.['area'] || 'Sin área' }} - Cama {{ viewingDetalleRecord()?.['cama'] || 'N/A' }}</span>
                </div>
              </div>
            </div>
            <button (click)="closeDetalleModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
              <mat-icon class="text-[20px] w-5 h-5">close</mat-icon>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-auto p-6 bg-slate-50/50">
            <div class="space-y-6">
              
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                <!-- Section: Identificación & Ingreso -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <lucide-icon [name]="Badge" class="w-4 h-4 text-slate-500"></lucide-icon>
                    <h3 class="font-semibold text-slate-800 text-sm">Datos de Ingreso</h3>
                  </div>
                  <div class="p-4 grid grid-cols-2 gap-4">
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">N° Ingreso</div>
                      <div class="text-sm text-slate-800 font-mono">{{ viewingDetalleRecord()?.['ingreso'] || '-' }}</div>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Ingreso</div>
                      <div class="text-sm text-slate-800">{{ viewingDetalleIngresoFormatted() }}</div>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Hosp.</div>
                      <div class="text-sm text-slate-800">{{ viewingDetalleHospFormatted() }}</div>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Días Estancia</div>
                      <div class="text-sm text-slate-800 flex gap-2">
                        <span class="text-slate-500 font-bold text-xs">DI: {{ viewingDetalleRecord()?.['dias_ingr'] || 0 }}</span>
                        <span class="text-slate-500 font-bold text-xs">DH: {{ viewingDetalleRecord()?.['dias_hosp'] || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Section: Entidad -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <lucide-icon [name]="Building" class="w-4 h-4 text-slate-500"></lucide-icon>
                    <h3 class="font-semibold text-slate-800 text-sm">Información de Entidad</h3>
                  </div>
                  <div class="p-4 grid grid-cols-2 gap-4">
                    <div class="col-span-2">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entidad Principal</div>
                      <div class="text-sm text-slate-800 font-medium">{{ viewingDetalleRecord()?.['entidad'] || '-' }}</div>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contrato</div>
                      <div class="text-sm text-slate-800">{{ viewingDetalleRecord()?.['contrato'] || '-' }}</div>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Municipio</div>
                      <div class="text-sm text-slate-800">{{ viewingDetalleRecord()?.['municipio'] || '-' }}</div>
                    </div>
                    @if (viewingDetalleRecord()?.['eps_soat']) {
                      <div class="col-span-2">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">EPS</div>
                        <div class="text-sm text-emerald-700 font-medium">{{ viewingDetalleRecord()?.['eps_soat'] }}</div>
                      </div>
                    }
                    
                    @if (viewingDetalleCortesEstancia().length > 0) {
                      <div class="col-span-2 mt-2 pt-4 border-t border-slate-100">
                        <div class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <lucide-icon [name]="CalendarRange" class="w-3 h-3 text-slate-500"></lucide-icon>
                          Control de Estancia / Cortes
                        </div>
                        
                        <div class="border border-slate-200 rounded-lg overflow-hidden mb-3">
                          <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
                              <tr>
                                <th class="px-3 py-2">Tipo</th>
                                <th class="px-3 py-2">Autorización</th>
                                <th class="px-3 py-2">Fecha Corte</th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200">
                              @for (corte of viewingDetalleCortesEstancia(); track corte.id) {
                                <tr class="hover:bg-slate-50">
                                  <td class="px-3 py-2">{{ corte.tipo }}</td>
                                  <td class="px-3 py-2 font-medium">{{ corte.autorizacion }}</td>
                                  <td class="px-3 py-2">{{ corte.fecha_corte | date:'dd/MM/yyyy' }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                        
                        @if (viewingDetalleDiasCorte() >= 30) {
                          <div class="mt-3 bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg flex items-start gap-2 text-xs">
                            <lucide-icon [name]="AlertTriangle" class="text-red-500 shrink-0 w-4 h-4"></lucide-icon>
                            <div>
                              <strong>¡Alerta de Corte!</strong> Han pasado {{ viewingDetalleDiasCorte() }} días desde el último corte o ingreso. Se superó el límite de 30 días.
                            </div>
                          </div>
                        } @else if (viewingDetalleDiasCorte() >= 25) {
                          <div class="mt-3 bg-amber-50 border border-amber-200 text-amber-700 p-2.5 rounded-lg flex items-start gap-2 text-xs">
                            <lucide-icon [name]="Clock" class="text-amber-500 shrink-0 w-4 h-4"></lucide-icon>
                            <div>
                              <strong>Próximo a vencer:</strong> Han pasado {{ viewingDetalleDiasCorte() }} días. El corte debe realizarse antes de los 30 días.
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Section: Gestión -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <lucide-icon [name]="UserCog" class="w-4 h-4 text-slate-500"></lucide-icon>
                    <h3 class="font-semibold text-slate-800 text-sm">Gestión y Trámite</h3>
                  </div>
                  <div class="p-4 grid grid-cols-2 gap-4">
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aut. Estancia</div>
                      <div class="text-sm">
                        <span class="px-2 py-0.5 rounded text-xs font-bold border" [ngClass]="viewingDetalleRecord()?.['aut_estancia'] === 'SI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                          {{ viewingDetalleRecord()?.['aut_estancia'] || 'NO' }}
                        </span>
                        @if (viewingDetalleRecord()?.['aut_estancia'] === 'NO' || viewingDetalleRecord()?.['aut_estancia'] === 'PGP' || viewingDetalleRecord()?.['aut_estancia'] === 'PP') {
                          @if (viewingDetalleRecord()?.['confirmacion_pgp']) {
                            <span class="ml-2 px-2 py-0.5 rounded text-xs font-bold border bg-slate-100 text-slate-700 border-slate-300">
                              {{ viewingDetalleRecord()?.['confirmacion_pgp'] }}
                            </span>
                          }
                        }
                      </div>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Próxima Gestión</div>
                      <div class="text-sm text-slate-800 font-bold">{{ viewingDetalleRecord()?.['fecha_proxima_gestion'] || viewingDetalleRecord()?.['gestion_estancia'] || '-' }}</div>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Proceso Notif.</div>
                      <div class="text-sm text-slate-800">{{ viewingDetalleRecord()?.['proceso_notif'] || '-' }}</div>
                    </div>
                    <div class="col-span-2">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nota Trámite</div>
                      <div class="text-sm text-slate-800">{{ getLatestTramiteNota(viewingDetalleRecord()?.['nombre_notif']) }}</div>
                    </div>
                  </div>
                </div>

                <!-- Section: Giro Cama -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2 xl:col-span-3">
                  <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <lucide-icon [name]="History" class="w-4 h-4 text-slate-500"></lucide-icon>
                    <h3 class="font-semibold text-slate-800 text-sm">Historial de Giro Cama</h3>
                  </div>
                  <div class="p-4">
                    @if (viewingDetalleRecord()?.['giro_cama']) {
                      <div class="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-line font-mono leading-relaxed">
                        {{ viewingDetalleRecord()?.['giro_cama'] }}
                      </div>
                    } @else {
                      <div class="text-sm text-slate-400 italic">Sin historial de giro cama registrado.</div>
                    }
                  </div>
                </div>

                <!-- Section: Novedades y Observaciones (Full Width) -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2 xl:col-span-3">
                  <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <lucide-icon [name]="PenLine" class="w-4 h-4 text-slate-500"></lucide-icon>
                    <h3 class="font-semibold text-slate-800 text-sm">Novedades y Observaciones</h3>
                  </div>
                  <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-1">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Novedad</div>
                      @if (viewingDetalleRecord()?.['novedad']) {
                        <div class="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100 whitespace-pre-line">
                          {{ viewingDetalleRecord()?.['novedad'] }}
                        </div>
                      } @else {
                        <div class="text-sm text-slate-400 italic">Sin novedad registrada</div>
                      }
                      
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Justificación</div>
                      @if (viewingDetalleRecord()?.['justificacion']) {
                        <div class="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                          {{ viewingDetalleRecord()?.['justificacion'] }}
                        </div>
                      } @else {
                        <div class="text-sm text-slate-400 italic">Sin justificación</div>
                      }
                    </div>
                    
                    <div class="md:col-span-2">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Observaciones</div>
                      <div class="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-line font-mono leading-relaxed min-h-[120px]">
                        {{ viewingDetalleRecord()?.['observaciones'] || 'Sin observaciones registradas.' }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Section: Validación de Derechos -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2 xl:col-span-3">
                  <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <lucide-icon [name]="CheckSquare" class="w-4 h-4 text-slate-500"></lucide-icon>
                    <h3 class="font-semibold text-slate-800 text-sm">Histórico de Validación de Derechos</h3>
                  </div>
                  <div class="p-4">
                    @if (viewingDetalleRecord()?.['validacion_derechos']) {
                      <div class="space-y-2">
                        <div class="flex items-center gap-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm">
                          <div class="flex-1">
                            <span class="font-bold text-emerald-800">{{ viewingDetalleDerechosEstado() }}</span>
                            <div class="text-[10px] text-emerald-600">Autorizado por: {{ viewingDetalleRecord()?.['validacion_derechos'] }}</div>
                          </div>
                          <div class="text-xs text-emerald-600 font-mono">{{ viewingDetalleRecord()?.['validacion_derechos_fecha'] | date:'dd/MM/yyyy hh:mm:ss a' }}</div>
                        </div>
                      </div>
                    } @else {
                      <div class="text-sm text-slate-400 italic">Sin validación de derechos registrada.</div>
                    }
                  </div>
                </div>

                <!-- Section: Todos los demás campos -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2 xl:col-span-3">
                  <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <lucide-icon [name]="Code" class="w-4 h-4 text-slate-500"></lucide-icon>
                    <h3 class="font-semibold text-slate-800 text-sm">Toda la Información (Datos Crudos)</h3>
                  </div>
                  <div class="p-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      @for (key of viewingDetalleKeys(); track key) {
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors">
                          <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" [title]="formatKey(key)">{{ formatKey(key) }}</div>
                          <div class="text-sm text-slate-800 font-medium break-words whitespace-pre-wrap">{{ viewingDetalleRecord()?.[key] || '-' }}</div>
                        </div>
                      }
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    }
    @if (viewingConsolidadoRecord(); as record) {
      <app-paciente-consolidado-modal [record]="record" (close)="viewingConsolidadoRecord.set(null)"></app-paciente-consolidado-modal>
    }
    @if (viewingGiroCamaRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div class="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                <lucide-icon [name]="History" class="w-5 h-5 text-slate-500"></lucide-icon>
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-800">Historial de Cambios</h2>
                <div class="text-xs text-slate-500">{{ viewingGiroCamaRecord()?.['nombre'] }}</div>
              </div>
            </div>
            <button (click)="closeGiroCamaModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
              <mat-icon class="text-[20px] w-5 h-5">close</mat-icon>
            </button>
          </div>
          
          <div class="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <div class="inline-flex bg-slate-200/50 p-1 rounded-lg overflow-x-auto max-w-full">
              <button (click)="historialTab.set('giro_cama')" 
                      [ngClass]="historialTab() === 'giro_cama' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'" 
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap">
                Giro Cama
              </button>
              <button (click)="historialTab.set('gestion_estancia')" 
                      [ngClass]="historialTab() === 'gestion_estancia' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'" 
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap">
                Gestión Estancia
              </button>
              <button (click)="historialTab.set('aut_estancia')" 
                      [ngClass]="historialTab() === 'aut_estancia' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'" 
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap">
                Aut. Estancia
              </button>
              <button (click)="historialTab.set('observaciones')" 
                      [ngClass]="historialTab() === 'observaciones' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'" 
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap">
                Observaciones
              </button>
            </div>
          </div>

          <div class="p-6 overflow-auto flex-1 bg-white">
            @if (historialCambios().length > 0) {
              <div class="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg mb-4 border border-slate-200 items-center">
                <div><span class="text-slate-400 font-bold uppercase text-[10px] mr-1">Ingreso:</span> <span class="text-xs font-medium text-slate-700">{{ historialCambios()[0].ingreso }}</span></div>
                <div><span class="text-slate-400 font-bold uppercase text-[10px] mr-1">Documento:</span> <span class="text-xs font-medium text-slate-700">{{ historialCambios()[0].hc }}</span></div>
                <div class="truncate" title="{{ viewingGiroCamaRecord()?.['entidad'] }}"><span class="text-slate-400 font-bold uppercase text-[10px] mr-1">EPS:</span> <span class="text-xs font-medium text-slate-700">{{ viewingGiroCamaRecord()?.['entidad'] }}</span></div>
              </div>
              
              @if (historialTab() === 'giro_cama') {
                @if (groupedHistorial().length > 0) {
                  <table class="w-full text-xs text-left text-slate-700">
                    <thead class="text-xs text-white uppercase bg-slate-800">
                      <tr>
                        <th scope="col" class="px-2 py-2">CAMA</th>
                        <th scope="col" class="px-2 py-2">ÁREA</th>
                        <th scope="col" class="px-2 py-2">ÁREA</th>
                        <th scope="col" class="px-2 py-2">CAMA</th>
                        <th scope="col" class="px-2 py-2">FECHA</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (group of groupedHistorial(); track group.fecha; let isLast = $last) {
                        <tr class="bg-white border-b hover:bg-slate-50 transition-colors">
                          <td class="px-2 py-2 font-medium">{{ group.cama_antes }}</td>
                          <td class="px-2 py-2 text-slate-500">{{ group.area_antes }}</td>
                          <td class="px-2 py-2 text-slate-500">{{ group.area_nueva }}</td>
                          <td class="px-2 py-2 font-medium">
                            <span [ngClass]="isLast ? 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded' : ''">{{ group.cama_nueva }}</span>
                          </td>
                          <td class="px-2 py-2 text-slate-400">{{ group.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                } @else {
                  <div class="text-center py-8 text-slate-500">
                    <p>No hay historial de cambios de Giro Cama.</p>
                  </div>
                }
              }

              @if (historialTab() === 'gestion_estancia') {
                @if (historialGestionEstancia().length > 0) {
                  <table class="w-full text-xs text-left text-slate-700">
                    <thead class="text-xs text-white uppercase bg-slate-800">
                      <tr>
                        <th scope="col" class="px-2 py-2">VALOR ANTERIOR</th>
                        <th scope="col" class="px-2 py-2">VALOR NUEVO</th>
                        <th scope="col" class="px-2 py-2">FECHA</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (change of historialGestionEstancia(); track change.id; let isFirst = $first) {
                        <tr class="bg-white border-b hover:bg-slate-50 transition-colors">
                          <td class="px-2 py-2 text-slate-500 max-w-[200px] truncate" [title]="change.valor_antes">{{ change.valor_antes || '-' }}</td>
                          <td class="px-2 py-2 font-medium max-w-[200px] truncate" [title]="change.valor_nuevo">
                            <span [ngClass]="isFirst ? 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded' : ''">{{ change.valor_nuevo || '-' }}</span>
                          </td>
                          <td class="px-2 py-2 text-slate-400">{{ change.cambiado_en | date:'dd/MM/yyyy HH:mm' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                } @else {
                  <div class="text-center py-8 text-slate-500">
                    <p>No hay historial de cambios de Gestión Estancia.</p>
                  </div>
                }
              }

              @if (historialTab() === 'aut_estancia') {
                @if (historialAutEstancia().length > 0) {
                  <table class="w-full text-xs text-left text-slate-700">
                    <thead class="text-xs text-white uppercase bg-slate-800">
                      <tr>
                        <th scope="col" class="px-2 py-2">VALOR ANTERIOR</th>
                        <th scope="col" class="px-2 py-2">VALOR NUEVO</th>
                        <th scope="col" class="px-2 py-2">FECHA</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (change of historialAutEstancia(); track change.id; let isFirst = $first) {
                        <tr class="bg-white border-b hover:bg-slate-50 transition-colors">
                          <td class="px-2 py-2 text-slate-500 max-w-[200px] truncate" [title]="change.valor_antes">{{ change.valor_antes || '-' }}</td>
                          <td class="px-2 py-2 font-medium max-w-[200px] truncate" [title]="change.valor_nuevo">
                            <span [ngClass]="isFirst ? 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded' : ''">{{ change.valor_nuevo || '-' }}</span>
                          </td>
                          <td class="px-2 py-2 text-slate-400">{{ change.cambiado_en | date:'dd/MM/yyyy HH:mm' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                } @else {
                  <div class="text-center py-8 text-slate-500">
                    <p>No hay historial de cambios de Aut. Estancia.</p>
                  </div>
                }
              }

              @if (historialTab() === 'observaciones') {
                @if (historialObservaciones().length > 0) {
                  <div class="space-y-4">
                    @for (change of historialObservaciones(); track change.id; let isFirst = $first) {
                      <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        <div class="flex justify-between items-center mb-2">
                          <span class="text-xs font-bold text-slate-500">{{ change.cambiado_en | date:'dd/MM/yyyy HH:mm' }}</span>
                          @if (isFirst) {
                            <span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Actual</span>
                          }
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Anterior</div>
                            <div class="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap font-mono">{{ change.valor_antes || 'Sin observaciones' }}</div>
                          </div>
                          <div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nuevo</div>
                            <div class="text-sm text-slate-800 bg-blue-50 p-2 rounded border border-blue-100 whitespace-pre-wrap font-mono">{{ change.valor_nuevo || 'Sin observaciones' }}</div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center py-8 text-slate-500">
                    <p>No hay historial de cambios de Observaciones.</p>
                  </div>
                }
              }
            } @else {
              <div class="text-center py-8 text-slate-500">
                <lucide-icon [name]="History" class="w-12 h-12 mb-2 opacity-20 text-slate-500"></lucide-icon>
                <p>No hay historial de cambios registrado para este paciente.</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

  `
})
export class ConsolidadoListComponent {
  readonly Trash2 = Trash2;
  readonly Ambulance = Ambulance;
  readonly PenLine = PenLine;
  readonly Check = Check;
  readonly X = X;
  readonly AlertTriangle = AlertTriangle;
  readonly Clock = Clock;
  readonly Search = Search;
  readonly FileText = FileText;
  readonly RefreshCw = RefreshCw;
  readonly AlertCircle = AlertCircle;
  readonly MessageSquare = MessageSquare;
  readonly ChevronDown = ChevronDown;
  readonly Filter = Filter;
  readonly ArrowUpDown = ArrowUpDown;
  readonly ArrowUp = ArrowUp;
  readonly ArrowDown = ArrowDown;
  readonly Plus = Plus;
  readonly Eye = Eye;
  readonly History = History;
  readonly Download = Download;
  readonly MoreHorizontal = MoreHorizontal;
  readonly MapPin = MapPin;
  readonly Building2 = Building2;
  readonly CheckSquare = CheckSquare;
  readonly FileSignature = FileSignature;
  readonly LayoutDashboard = LayoutDashboard;
  readonly FolderHeart = FolderHeart;
  readonly PlusCircle = PlusCircle;
  readonly FolderX = FolderX;
  readonly UserCog = UserCog;
  readonly Building = Building;
  readonly SearchX = SearchX;
  readonly Badge = Badge;
  readonly CalendarRange = CalendarRange;
  readonly User = User;
  readonly Code = Code;
  readonly CheckCircle = CheckCircle;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;

  // EPS Searchable Dropdown
  epsSearchText = signal('');
  showEpsDropdown = signal(false);
  focusedEpsIndex = signal(-1);
  filteredEps = computed(() => {
    const search = this.epsSearchText().toLowerCase();
    return this.entidadesUnicas().filter(eps => eps.toLowerCase().includes(search));
  });

  epsMappings = computed(() => {
    const records = this.consolidadoService.allRegistros();
    const map = new Map<string, { entidad: string, contrato: string }>();
    records.forEach(r => {
      const eps = (r['eps_soat'] as string || '').trim();
      const entidad = (r['entidad'] as string || '').trim();
      const contrato = (r['contrato'] as string || '').trim();
      
      if (eps) {
        // Guarda la asociación tomando la EPS principal
        map.set(eps, { entidad: entidad, contrato: contrato });
      } else if (entidad && !map.has(entidad)) {
        // Fallback: si es una EPS directa sin SOAT
        map.set(entidad, { entidad: entidad, contrato: contrato });
      }
    });
    return map;
  });

  onEpsInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.epsSearchText.set(input.value.trimStart());
    this.showEpsDropdown.set(true);
    this.focusedEpsIndex.set(-1);
  }

  onEpsKeydown(event: KeyboardEvent) {
    const epsList = this.filteredEps();
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
      event.preventDefault();
      if (this.showEpsDropdown()) {
        if (event.key === 'ArrowDown') {
          this.focusedEpsIndex.update(i => Math.min(i + 1, epsList.length - 1));
        } else if (event.key === 'ArrowUp') {
          this.focusedEpsIndex.update(i => Math.max(i - 1, 0));
        } else if (event.key === 'Enter') {
          if (this.focusedEpsIndex() >= 0 && this.focusedEpsIndex() < epsList.length) {
            this.selectEps(epsList[this.focusedEpsIndex()]);
          }
        } else if (event.key === 'Escape') {
          this.showEpsDropdown.set(false);
        }
      } else if (event.key === 'ArrowDown') {
        this.showEpsDropdown.set(true);
      }
    }
  }

  selectEps(eps: string) {
    this.epsSearchText.set(eps);
    this.showEpsDropdown.set(false);
    if (this.epsSoatInput) {
      this.epsSoatInput.nativeElement.value = eps;
    }
    
    // Auto-fill entidad y contrato basado en datos históricos
    const mapping = this.epsMappings().get(eps);
    if (mapping) {
      // this.entidadInputValue.set(mapping.entidad);
      if (mapping.contrato) {
        this.contratoInputValue.set(mapping.contrato);
      }
    }
  }

  clearEps() {
    this.epsSearchText.set('');
    if (this.epsSoatInput) {
      this.epsSoatInput.nativeElement.value = '';
    }
  }
  @ViewChild('tipoContratoInput') tipoContratoInput?: ElementRef<HTMLSelectElement>;
  @ViewChild('entidadInput') entidadInput?: ElementRef<HTMLInputElement>;
  @ViewChild('epsSoatInput') epsSoatInput?: ElementRef<HTMLInputElement>;
  @ViewChild('contratoInput') contratoInput?: ElementRef<HTMLSelectElement>;
  consolidadoService = inject(ConsolidadoService);
  epsSinConvenioService = inject(EpsSinConvenioService);
  epsCorteAdministrativoService = inject(EpsCorteAdministrativoService);
  supabaseService = inject(SupabaseService);
  registros = input.required<ConsolidadoRecord[]>();
  view = input<'general' | 'pgp_aic' | 'estancias_nuevas' | 'seguimiento' | 'validacion_derechos'>('general');

  sortedRegistros = computed<MappedConsolidadoRecord[]>(() => {
    const all = this.registros();
    
    const sorted = [...all].sort((a, b) => {
      const entA = String(a['entidad'] || '').toLowerCase();
      const entB = String(b['entidad'] || '').toLowerCase();
      return entA.localeCompare(entB);
    });

    return sorted.map(r => {
      const hasCortes = this.getCortesEstancia(r).length > 0;
      const diasCorte = this.calcularDiasCorte(r);
      const derechosEstado = this.getDerechosEstado(r);
      const visibleObs = this.getVisibleObservaciones(r['observaciones']);
      const latestTramite = this.getLatestTramiteNota(r['nombre_notif']);
      const latestTramiteDate = this.getLatestTramiteDate(r['nombre_notif']);
      const isSinConvenio = this.epsSinConvenioService.isSinConvenio(this.getStringValue(r['entidad']));
      const isCorteAdmin = this.epsCorteAdministrativoService.isCorteAdministrativo(this.getStringValue(r['entidad']));
      const hasTramiteHistory = this.hasTramiteHistory(r);
      const latestSoporte = this.getLatestSoporte(r);

      const idStr = r.id ? String(r.id) : '';
      
      return {
        ...r,
        _hasCortes: hasCortes,
        _diasCorte: diasCorte,
        _derechosEstado: derechosEstado,
        _visibleObs: visibleObs,
        _latestTramite: latestTramite,
        _latestTramiteDate: latestTramiteDate,
        _isSinConvenio: isSinConvenio,
        _isCorteAdmin: isCorteAdmin,
        _hasTramiteHistory: hasTramiteHistory,
        _latestSoporte: latestSoporte,
        _diasHospNum: Number(r['dias_hosp']) || 0,
        _hcStr: r['hc'] ? String(r['hc']) : '',
        _ingresoStr: r['ingreso'] ? String(r['ingreso']) : '',
        _idStr: idStr,
        _fechaIngresoFormatted: this.formatStringDate(r['fecha_ingreso']),
        _fechaHospFormatted: this.formatStringDate(r['fecha_hosp'])
      } as MappedConsolidadoRecord;
    });
  });

  Math = Math;

  constructor() {
    // Reset to page 1 when search query change or filters change
    effect(() => {
      this.consolidadoService.searchQuery();
      this.filteredRegistros();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });

    effect(() => {
      // Whenever parent registers change due to parent filters, reset column filters
      this.registros();
      this.columnFilters.set({});
      this.activeColumnFilterInputs.set({});
    }, { allowSignalWrites: true });
  }

  // New structured soportes signals
  soportesHistory = signal<SoporteEntry[]>([]);
  isAddingSoporte = signal<boolean>(false);
  newSoporte = signal<Partial<SoporteEntry>>({
    autorizacion_recibida: false,
    soporte_pdf_presente: false
  });

  editingObsRecord = signal<ConsolidadoRecord | null>(null);
  editingTramiteRecord = signal<ConsolidadoRecord | null>(null);
  editingSoportesRecord = signal<ConsolidadoRecord | null>(null);
  editingGestionRecord = signal<ConsolidadoRecord | null>(null);
  editingEntidadRecord = signal<ConsolidadoRecord | null>(null);
  tramiteOption = signal<string[]>([]);
  
  toggleTramiteOption(option: string) {
    this.tramiteOption.update(current => {
      if (current.includes(option)) {
        return current.filter(o => o !== option);
      } else {
        return [...current, option];
      }
    });
  }
  editingEntidadDiasCorte = computed(() => {
    const record = this.editingEntidadRecord();
    return record ? this.calcularDiasCorte(record) : 0;
  });
  cortesEstancia = signal<CorteEstancia[]>([]);
  editingDerechosRecord = signal<ConsolidadoRecord | null>(null);
  derechosError = signal<string | null>(null);
  loadingHistorialDerechos = signal<boolean>(false);
  entidadTab = signal<'datos' | 'cortes'>('datos');
  entidadInputValue = signal<string>('');
  contratoInputValue = signal<string>('');
  tipoContratoInputValue = signal<string>('');
  autInputValue = signal<string>('NO');
  fechaGestionInputValue = signal<string>('');
  gestionBaseDate = signal<string>('');
  gestionDiasInput = signal<number | null>(null);
  viewingDetalleRecord = signal<ConsolidadoRecord | null>(null);
  viewingConsolidadoRecord = signal<MappedConsolidadoRecord | null>(null);
  viewingDetalleDiasCorte = computed(() => {
    const record = this.viewingDetalleRecord();
    return record ? this.calcularDiasCorte(record) : 0;
  });
  viewingDetalleCortesEstancia = computed(() => {
    const record = this.viewingDetalleRecord();
    return record ? this.getCortesEstancia(record) : [];
  });
  viewingDetalleIngresoFormatted = computed(() => {
    const record = this.viewingDetalleRecord();
    return this.formatStringDate(record ? record['fecha_ingreso'] : null);
  });
  viewingDetalleHospFormatted = computed(() => {
    const record = this.viewingDetalleRecord();
    return this.formatStringDate(record ? record['fecha_hosp'] : null) || '-';
  });
  viewingDetalleDerechosEstado = computed(() => {
    const record = this.viewingDetalleRecord();
    return record ? this.getDerechosEstado(record) : '';
  });
  viewingDetalleKeys = computed(() => {
    const record = this.viewingDetalleRecord();
    return record ? this.getRecordKeys(record) : [];
  });
  viewingGiroCamaRecord = signal<ConsolidadoRecord | null>(null);
  historialCambios = signal<HistorialCambio[]>([]);
  historialTab = signal<'giro_cama' | 'gestion_estancia' | 'aut_estancia' | 'observaciones'>('giro_cama');
  derechosTab = signal<'validacion' | 'historial'>('validacion');
  derechosEstadoInput = signal<string>('Activo');
  derechosAutorizadorInput = signal<string>('');
  
  historialDerechos = computed(() => {
    const record = this.editingDerechosRecord();
    if (!record) return [];
    
    const histStr = record['historial_derechos'] as string;
    if (histStr && histStr.trim().startsWith('[')) {
      try {
        return JSON.parse(histStr);
      } catch {
        return [];
      }
    }
    
    // Fallback to historialCambios if historial_derechos is empty
    return this.historialCambios()
      .filter(c => c.campo === 'validacion_derechos' || c.campo === 'derechos_paciente' || c.campo === 'valdiacion_derechos')
      .map(c => {
        let estado = '';
        if (c.campo === 'derechos_paciente') {
          estado = this.parseDerechosHistory(c.valor_nuevo);
        } else if (c.campo === 'validacion_derechos' || c.campo === 'valdiacion_derechos') {
          estado = 'Actualizado'; // Or some generic status
        }
        
        return {
          estado: estado || c.valor_nuevo,
          fecha: c.cambiado_en,
          autorizador: c.campo === 'validacion_derechos' || c.campo === 'valdiacion_derechos' ? c.valor_nuevo : 'N/A',
          cambiado_en: c.cambiado_en // keep for compatibility
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  });

  parseDerechosHistory(valor: string): string {
    if (!valor || valor === 'null') return '';
    try {
      const parsed = JSON.parse(valor);
      return parsed?.estado || valor;
    } catch {
      return valor;
    }
  }

  getDerechosEstado(record: ConsolidadoRecord | null): string {
    if (!record) return 'Activo';
    
    // Try new column first (with typo as requested)
    if (record['valdiacion_derechos']) {
      return record['valdiacion_derechos'] as string;
    }
    
    if (!record['derechos_paciente']) return 'Activo';
    try {
      const parsed = typeof record['derechos_paciente'] === 'string' ? JSON.parse(record['derechos_paciente']) : record['derechos_paciente'];
      return parsed?.estado || 'Activo';
    } catch {
      return 'Activo';
    }
  }

  async openDerechosModal(record: ConsolidadoRecord) {
    this.derechosError.set(null);
    this.derechosTab.set('validacion');
    this.derechosEstadoInput.set(this.getDerechosEstado(record));
    // Use 'autorizador' first, then fallback to 'validacion_derechos'
    this.derechosAutorizadorInput.set((record['autorizador'] || record['validacion_derechos']) as string || '');
    this.editingDerechosRecord.set(record);
    this.historialCambios.set([]);
    this.loadingHistorialDerechos.set(true);
    try {
      const hc = record['hc'] as string;
      if (hc) {
        const historial = await this.consolidadoService.getHistorialCambios(hc);
        this.historialCambios.set(historial);
      }
    } catch (error) {
      console.error('Error fetching historial:', error);
    } finally {
      this.loadingHistorialDerechos.set(false);
    }
  }

  closeDerechosModal() {
    this.editingDerechosRecord.set(null);
    this.derechosError.set(null);
  }

  private getBogotaISOString(): string {
    const now = new Date();
    const bogotaFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    });
    
    const parts = bogotaFormatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}-05:00`;
  }

  private getBogotaShortDate(): string {
    return new Date().toLocaleString('es-CO', { 
      timeZone: 'America/Bogota',
      dateStyle: 'short', 
      timeStyle: 'short' 
    });
  }

  public getBogotaDateOnly(): string {
    const now = new Date();
    const bogotaFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = bogotaFormatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  }

  async saveDerechos() {
    const estado = this.derechosEstadoInput();
    const autorizador = this.derechosAutorizadorInput();
    
    if (!autorizador || !autorizador.trim()) {
      this.derechosError.set('Por favor, ingrese el nombre del autorizador.');
      return;
    }

    const record = this.editingDerechosRecord();
    if (!record || !record.id) {
      this.derechosError.set('Error: No se pudo identificar el registro para guardar.');
      return;
    }

    this.derechosError.set(null);
    const fechaActual = this.getBogotaISOString();

    this.saving.set(true);
    try {
      const newAutorizador = autorizador.trim();
      
      // Manage History
      let currentHistory: unknown[] = [];
      const histStr = record['historial_derechos'] as string;
      if (histStr && histStr.trim().startsWith('[')) {
        try {
          currentHistory = JSON.parse(histStr) as unknown[];
        } catch {
          currentHistory = [];
        }
      }

      const newEntry = {
        estado: estado,
        fecha: fechaActual,
        autorizador: newAutorizador
      };

      const updatedHistory = [newEntry, ...currentHistory];

      await this.consolidadoService.updateRegistro(record.id, {
        valdiacion_derechos: estado, // Typo as requested
        valdiacion_derechos_fecha: fechaActual, // Typo as requested
        autorizador: newAutorizador,
        historial_derechos: JSON.stringify(updatedHistory),
        // Keep old fields for backward compatibility if needed
        validacion_derechos: newAutorizador,
        validacion_derechos_fecha: fechaActual,
        derechos_paciente: { estado: estado }
      });

      // Insert history for tracking in historial_cambios too
      await this.consolidadoService.insertHistorialCambio({
        tabla: 'base_hoy',
        sourcerow: Number(record.id),
        campo: 'valdiacion_derechos',
        valor_antes: record.valdiacion_derechos || '',
        valor_nuevo: estado,
        cambiado_en: fechaActual,
        hc: record.hc || '',
        ingreso: record.ingreso || ''
      });

      this.closeDerechosModal();
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (errorMsg.includes('PGRST204') || errorMsg.includes('valdiacion_derechos') || errorMsg.includes('historial_derechos') || errorMsg.includes('22007') || errorMsg.includes('type time')) {
        this.derechosError.set('Error de Base de Datos: Las columnas nuevas no existen o tienen el tipo incorrecto. Ejecuta este SQL en Supabase: ' +
          'ALTER TABLE base_hoy ADD COLUMN IF NOT EXISTS valdiacion_derechos text; ' +
          'ALTER TABLE base_hoy ADD COLUMN IF NOT EXISTS valdiacion_derechos_fecha timestamp with time zone; ' +
          'ALTER TABLE base_hoy ADD COLUMN IF NOT EXISTS historial_derechos text; ' +
          'ALTER TABLE base_hoy ADD COLUMN IF NOT EXISTS autorizador text; ' +
          'ALTER TABLE base_hoy ALTER COLUMN historial_derechos TYPE text; ' +
          'ALTER TABLE base_hoy ALTER COLUMN valdiacion_derechos_fecha TYPE timestamp with time zone USING valdiacion_derechos_fecha::timestamp with time zone; ' +
          'y luego presiona "Reload Schema" en la sección API.');
      } else {
        this.derechosError.set(errorMsg);
      }
    } finally {
      this.saving.set(false);
    }
  }

  async anularDerechos() {
    const record = this.editingDerechosRecord();
    if (!record || !record.id) return;

    this.derechosError.set(null);
    const fechaActual = this.getBogotaISOString();

    this.saving.set(true);
    try {
      // Manage History
      let currentHistory: unknown[] = [];
      const histStr = record['historial_derechos'] as string;
      if (histStr && histStr.trim().startsWith('[')) {
        try {
          currentHistory = JSON.parse(histStr) as unknown[];
        } catch {
          currentHistory = [];
        }
      }

      const newEntry = {
        estado: 'Anulado',
        fecha: fechaActual,
        autorizador: 'SISTEMA (ANULACIÓN)'
      };

      const updatedHistory = [newEntry, ...currentHistory];

      // Update record to clear validation but keep trace in history
      await this.consolidadoService.updateRegistro(record.id, {
        valdiacion_derechos: 'Anulado',
        valdiacion_derechos_fecha: null,
        historial_derechos: JSON.stringify(updatedHistory),
        derechos_paciente: { estado: 'Anulado' },
        validacion_derechos: null,
        validacion_derechos_fecha: null,
        autorizador: null
      });

      // Insert history for the annulment
      await this.consolidadoService.insertHistorialCambio({
        tabla: 'base_hoy',
        sourcerow: Number(record.id),
        campo: 'valdiacion_derechos',
        valor_antes: record.valdiacion_derechos || '',
        valor_nuevo: 'Anulado',
        cambiado_en: fechaActual,
        hc: record.hc || '',
        ingreso: record.ingreso || ''
      });

      this.closeDerechosModal();
    } catch (error: unknown) {
      console.error('Error annulling derechos:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('PGRST204') || errorMsg.includes('valdiacion_derechos') || errorMsg.includes('historial_derechos') || errorMsg.includes('22007') || errorMsg.includes('type time')) {
        this.derechosError.set('Error de Base de Datos: Las columnas nuevas no existen o tienen el tipo incorrecto. Ejecuta este SQL en Supabase: ' +
          'ALTER TABLE base_hoy ADD COLUMN IF NOT EXISTS valdiacion_derechos text; ' +
          'ALTER TABLE base_hoy ADD COLUMN IF NOT EXISTS valdiacion_derechos_fecha timestamp with time zone; ' +
          'ALTER TABLE base_hoy ADD COLUMN IF NOT EXISTS historial_derechos text; ' +
          'ALTER TABLE base_hoy ADD COLUMN IF NOT EXISTS autorizador text; ' +
          'ALTER TABLE base_hoy ALTER COLUMN historial_derechos TYPE text; ' +
          'ALTER TABLE base_hoy ALTER COLUMN valdiacion_derechos_fecha TYPE timestamp with time zone USING valdiacion_derechos_fecha::timestamp with time zone; ' +
          'y luego presiona "Reload Schema" en la sección API.');
      } else {
        this.derechosError.set('Error al anular la validación.');
      }
    } finally {
      this.saving.set(false);
    }
  }
  
  historialGestionEstancia = computed(() => this.historialCambios().filter(c => c.campo === 'gestion_estancia').sort((a, b) => new Date(b.cambiado_en).getTime() - new Date(a.cambiado_en).getTime()));
  historialAutEstancia = computed(() => this.historialCambios().filter(c => c.campo === 'aut_estancia').sort((a, b) => new Date(b.cambiado_en).getTime() - new Date(a.cambiado_en).getTime()));
  historialObservaciones = computed(() => this.historialCambios().filter(c => c.campo === 'observaciones').sort((a, b) => new Date(b.cambiado_en).getTime() - new Date(a.cambiado_en).getTime()));

  groupedHistorial = computed(() => {
    const changes = this.historialCambios().filter(c => c.campo === 'area' || c.campo === 'cama');
    const sortedChanges = [...changes].sort((a, b) => new Date(a.cambiado_en).getTime() - new Date(b.cambiado_en).getTime());

    const groups: Record<string, {
      fecha: string;
      cama_antes: string;
      area_antes: string;
      area_nueva: string;
      cama_nueva: string;
    }> = {};

    let currentArea = '';
    let currentCama = '';

    const firstArea = sortedChanges.find(c => c.campo === 'area');
    if (firstArea) currentArea = firstArea.valor_antes;

    const firstCama = sortedChanges.find(c => c.campo === 'cama');
    if (firstCama) currentCama = firstCama.valor_antes;

    sortedChanges.forEach(c => {
      const dateObj = new Date(c.cambiado_en);
      const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}-${dateObj.getHours()}-${dateObj.getMinutes()}`;
      
      if (!groups[key]) {
        groups[key] = {
          fecha: c.cambiado_en,
          cama_antes: currentCama,
          area_antes: currentArea,
          area_nueva: currentArea,
          cama_nueva: currentCama
        };
      }

      if (c.campo === 'cama') {
        groups[key].cama_antes = c.valor_antes;
        groups[key].cama_nueva = c.valor_nuevo;
        currentCama = c.valor_nuevo;
      }
      if (c.campo === 'area') {
        groups[key].area_antes = c.valor_antes;
        groups[key].area_nueva = c.valor_nuevo;
        currentArea = c.valor_nuevo;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  });

  entidadesUnicas = computed(() => {
    const records = this.consolidadoService.allRegistros();
    const entidades = new Set<string>();
    records.forEach(r => {
      if (r['entidad']) {
        entidades.add(String(r['entidad']).trim());
      }
      if (r['eps_soat']) {
        entidades.add(String(r['eps_soat']).trim());
      }
    });
    return Array.from(entidades).filter(e => e !== '').sort();
  });

  getCortesEstancia(record: ConsolidadoRecord): CorteEstancia[] {
    try {
      if (record['cortes_estancia']) {
        return JSON.parse(String(record['cortes_estancia']));
      }
    } catch {
      return [];
    }
    // Fallback: if there's an existing aut_estancia_entidad but no cortes_estancia, we can return it as a legacy corte
    if (record['aut_estancia_entidad'] || record['fecha_egreso_entidad']) {
      return [{
        id: 'legacy',
        tipo: 'Legado',
        autorizacion: record['aut_estancia_entidad'] || '',
        fecha_corte: record['fecha_egreso_entidad'] || '',
        fecha_registro: '',
        base_hoy_id: Number(record.id)
      }];
    }
    return [];
  }

  async addCorte(tipo: string, autorizacion: string, fecha_corte: string) {
    if (!autorizacion || !fecha_corte) return;
    const record = this.editingEntidadRecord();
    if (!record || !record.id) return;
    
    const newCorte: CorteEstancia = {
      id: crypto.randomUUID(),
      base_hoy_id: Number(record.id),
      tipo,
      autorizacion,
      fecha_corte,
      fecha_registro: this.getBogotaISOString()
    };
    
    const cortes = this.getCortesEstancia(record).filter(c => c.id !== 'legacy');
    cortes.push(newCorte);
    
    this.saving.set(true);
    try {
      const updates = {
        cortes_estancia: JSON.stringify(cortes),
        aut_estancia_entidad: autorizacion,
        fecha_egreso_entidad: fecha_corte
      };
      await this.consolidadoService.updateRegistro(record.id, updates);
      // Update local record
      this.editingEntidadRecord.set({
        ...record,
        ...updates
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.saving.set(false);
    }
  }

  // Eliminar el método deleteCorte duplicado que estaba aquí (líneas 1973-2000)

  tipoCorteSeleccionado = signal('Direccionamiento');
  otroTipoCorte = signal('');

  tramiteAutorizador = signal<string>('');
  saving = signal(false);

  parsedTramites = computed(() => {
    const record = this.editingTramiteRecord();
    if (!record) return [];
    try {
      const hist = record['nombre_notif'];
      let parsed: TramiteHistory[] = [];
      if (typeof hist === 'string' && hist.trim().startsWith('[')) {
        parsed = JSON.parse(hist) as TramiteHistory[];
      } else if (Array.isArray(hist)) {
        parsed = hist as TramiteHistory[];
      } else if (typeof hist === 'string' && hist.trim().length > 0) {
        parsed = [{
          fecha: record['updated_at'] ? new Date(record['updated_at'] as string).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }) : '',
          tipo: (record['proceso_notif'] as string) || 'Otro',
          nota: hist
        }];
      }
      
      return parsed.map(entry => {
        const match = (entry.nota as string)?.match(/~~(.*?)~~\s*\(Eliminado por (.*?)\)/);
        if (match) {
          return { ...entry, nota: match[1], isDeleted: true, deletedBy: match[2] };
        }
        return entry;
      });
    } catch {
      return [];
    }
  });

  parsedObs = computed(() => {
    const record = this.editingObsRecord();
    if (!record) return [];
    const obsStr = String(record['observaciones'] || '');
    return obsStr.split('\n').filter(l => l.trim().length > 0).map(line => {
      // Match pattern: ~~text~~ (Eliminado por User)
      const match = line.match(/~~(.*?)~~\s*\(Eliminado por (.*?)\)/);
      if (match) {
        return { raw: line, text: match[1], isDeleted: true, deletedBy: match[2] };
      }
      return { raw: line, text: line, isDeleted: false };
    });
  });



  hasActiveFilters = computed(() => {
    return !!this.consolidadoService.searchQuery() || this.registros().length !== this.consolidadoService.allRegistros().length;
  });

  // Sorting Logic
  sortField = signal<'area' | 'entidad' | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  toggleSort(field: 'area' | 'entidad') {
    if (this.sortField() === field) {
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortField.set(null);
        this.sortDirection.set('asc');
      }
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(field: 'area' | 'entidad') {
    if (this.sortField() !== field) return ArrowUpDown;
    return this.sortDirection() === 'asc' ? ArrowUp : ArrowDown;
  }

  // Column Filters Logic
  columnFilters = signal<{ [col: string]: string }>({});
  activeColumnFilterInputs = signal<{ [col: string]: boolean }>({});

  toggleColumnFilterInput(col: string, event: Event) {
    event.stopPropagation();
    const current = this.activeColumnFilterInputs();
    this.activeColumnFilterInputs.set({ ...current, [col]: !current[col] });
  }

  setColumnFilter(col: string, value: string) {
    const current = this.columnFilters();
    this.columnFilters.set({ ...current, [col]: value });
  }

  filteredRegistros = computed<MappedConsolidadoRecord[]>(() => {
    const all = this.sortedRegistros();
    const globalQuery = this.consolidadoService.searchQuery().toLowerCase();
    const colFilters = this.columnFilters();
    
    let filtered = all.filter(r => {
      // Column filters
      if (colFilters['area'] && !String(r['area'] || '').toLowerCase().includes(colFilters['area'].toLowerCase()) && !String(r['cama'] || '').toLowerCase().includes(colFilters['area'].toLowerCase())) {
        return false;
      }
      if (colFilters['paciente'] && !String(r['nombre'] || '').toLowerCase().includes(colFilters['paciente'].toLowerCase()) && !String(r['hc'] || '').toLowerCase().includes(colFilters['paciente'].toLowerCase())) {
        return false;
      }
      if (colFilters['admision'] && !String(r._fechaIngresoFormatted || '').toLowerCase().includes(colFilters['admision'].toLowerCase()) && !String(r._fechaHospFormatted || '').toLowerCase().includes(colFilters['admision'].toLowerCase())) {
        return false;
      }
      if (colFilters['entidad'] && !String(r['entidad'] || '').toLowerCase().includes(colFilters['entidad'].toLowerCase()) && !String(r['eps_soat'] || '').toLowerCase().includes(colFilters['entidad'].toLowerCase())) {
        return false;
      }
      if (colFilters['gestion'] && !String(r['gestion_estancia'] || '').toLowerCase().includes(colFilters['gestion'].toLowerCase()) && !String(r['aut_estancia'] || '').toLowerCase().includes(colFilters['gestion'].toLowerCase())) {
        return false;
      }
      if (colFilters['novedades'] && !String(r['novedad'] || '').toLowerCase().includes(colFilters['novedades'].toLowerCase())) {
        return false;
      }

      // Global search
      if (globalQuery) {
        return String(r['area'] || '').toLowerCase().includes(globalQuery) ||
               String(r['cama'] || '').toLowerCase().includes(globalQuery) ||
               String(r['nombre'] || '').toLowerCase().includes(globalQuery) ||
               String(r['hc'] || '').toLowerCase().includes(globalQuery) ||
               String(r['ingreso'] || '').toLowerCase().includes(globalQuery) ||
               String(r['entidad'] || '').toLowerCase().includes(globalQuery) ||
               String(r['gestion_estancia'] || '').toLowerCase().includes(globalQuery) ||
               String(r['proceso_notif'] || '').toLowerCase().includes(globalQuery) ||
               String(r._latestTramite || '').toLowerCase().includes(globalQuery) ||
               String(r._visibleObs || '').toLowerCase().includes(globalQuery) ||
               String(r['novedad'] || '').toLowerCase().includes(globalQuery) ||
               String(r._derechosEstado || '').toLowerCase().includes(globalQuery);
      }

      return true;
    });

    // Apply sorting
    const field = this.sortField();
    if (field) {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        const valA = String(a[field] || '').toLowerCase();
        const valB = String(b[field] || '').toLowerCase();
        return valA.localeCompare(valB) * direction;
      });
    }

    return filtered;
  });

  // Pagination Logic
  currentPage = signal(1);
  pageSize = signal(50);
  
  totalPages = computed(() => Math.ceil(this.filteredRegistros().length / this.pageSize()) || 1);
  
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total - 1, total];
    }
    if (current >= total - 3) {
      return [1, 2, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  });
  
  paginationStart = computed(() => (this.currentPage() - 1) * this.pageSize());
  paginationEnd = computed(() => Math.min(this.paginationStart() + this.pageSize(), this.filteredRegistros().length));
  
  paginatedRegistros = computed(() => {
    return this.filteredRegistros().slice(this.paginationStart(), this.paginationEnd());
  });

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize.set(Number(select.value));
    this.currentPage.set(1); // Reset to first page when changing page size
  }

  toNumber(val: unknown): number {
    return Number(val) || 0;
  }

  getStringValue(val: unknown): string {
    return val ? String(val) : '';
  }

  copyToClipboard(text: string, event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copiado al portapapeles:', text);
    });
  }

  openObsModal(record: ConsolidadoRecord) {
    this.editingObsRecord.set(record);
  }

  trackById(index: number, item: MappedConsolidadoRecord) {
    return item._idStr;
  }

  closeObsModal() {
    this.editingObsRecord.set(null);
  }

  async saveObs(newNote: string) {
    if (!newNote.trim()) return;
    
    const record = this.editingObsRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      const currentObs = String(record['observaciones'] || '').trim();
      
      // Calculate next number
      const lines = currentObs.split('\n').filter(l => l.trim().length > 0);
      let nextNum = 1;
      if (lines.length > 0) {
        // Try to find the last number
        const lastLine = lines[lines.length - 1];
        const match = lastLine.match(/^(\d+)\./);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        } else {
          nextNum = lines.length + 1;
        }
      }

      const now = new Date();
      const bogotaFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      });
      const parts = bogotaFormatter.formatToParts(now);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
      
      const dateStr = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;

      const formattedNote = `${nextNum}. ${dateStr} - ${newNote.trim()}`;
      const updatedObs = currentObs ? `${currentObs}\n${formattedNote}` : formattedNote;

      await this.consolidadoService.updateRegistro(record.id, { observaciones: updatedObs });
      this.closeObsModal();
    } catch (error) {
      console.error('Error saving observation:', error);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteObs(index: number) {
    const record = this.editingObsRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      const obsStr = String(record['observaciones'] || '');
      const lines = obsStr.split('\n').filter(l => l.trim().length > 0);
      
      if (index >= 0 && index < lines.length) {
        const lineToDel = lines[index];
        // In a real app, we would get the current user's name from an auth service.
        // For now, we use a generic placeholder or prompt.
        const userName = 'Usuario Actual'; 
        lines[index] = `~~${lineToDel}~~ (Eliminado por ${userName})`;
        
        const updatedObs = lines.join('\n');
        await this.consolidadoService.updateRegistro(record.id, { observaciones: updatedObs });
        
        // Update local record so modal updates immediately
        this.editingObsRecord.set({ ...record, observaciones: updatedObs });
      }
    } catch (error) {
      console.error('Error deleting observation:', error);
    } finally {
      this.saving.set(false);
    }
  }
  
  formatStringDate(dStr: unknown): string {
    if (!dStr || dStr === 'N/A' || typeof dStr !== 'string') return 'N/A';
    const datePart = dStr.split(' ')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  }

  getLatestTramiteNota(val: unknown): string {
    if (!val) return '';
    try {
      if (typeof val === 'string' && val.trim().startsWith('[')) {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const active = parsed.filter(p => !p.nota.includes('~~'));
          if (active.length > 0) return active[0].nota;
          return '';
        }
      } else if (typeof val === 'string' && val.trim().includes('~~')) {
        return '';
      }
    } catch {
      // Fallback to string
    }
    const cleanStr = String(val).trim();
    return cleanStr === '' ? '' : cleanStr;
  }

  getLatestTramiteDate(val: unknown): string {
    if (!val) return '';
    try {
      if (typeof val === 'string' && val.trim().startsWith('[')) {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const active = parsed.filter(p => !p.nota.includes('~~'));
          if (active.length > 0) return active[0].fecha || '';
          return '';
        }
      }
    } catch {
      // Fallback
    }
    return '';
  }

  activeTramites = computed(() => this.parsedTramites().filter(t => !t.isDeleted));
  deletedTramites = computed(() => this.parsedTramites().filter(t => t.isDeleted));

  getVisibleObservaciones(obs: unknown): string {
    if (!obs) return 'Sin observaciones';
    const lines = String(obs).split('\n');
    const visibleLines = lines.filter(l => !l.match(/~~(.*?)~~\s*\(Eliminado por (.*?)\)/) && l.trim().length > 0);
    return visibleLines.length > 0 ? visibleLines.join('\n') : 'Sin observaciones';
  }

  extractDays(val: unknown): string {
    if (!val) return '';
    if (val === 'Integral - No se gestiona') return '0';
    const match = String(val).match(/\d+/);
    return match ? match[0] : '';
  }

  async openGiroCamaModal(record: ConsolidadoRecord) {
    this.viewingGiroCamaRecord.set(record);
    this.historialCambios.set([]);
    try {
      const hc = record['hc'] as string;
      if (hc) {
        const historial = await this.consolidadoService.getHistorialCambios(hc);
        this.historialCambios.set(historial);
      }
    } catch (error) {
      console.error('Error fetching historial:', error);
    }
  }

  closeGiroCamaModal() {
    this.viewingGiroCamaRecord.set(null);
  }

  getHistorialCambios(record: ConsolidadoRecord | null): HistorialCambio[] {
    if (!record) return [];
    
    console.log('--- DEBUG HISTORIAL ---');
    console.log('nombre_notif:', record['nombre_notif']);
    console.log('historial_cambios:', record['historial_cambios']);
    
    // Try to find where the history is
    const hist = record['historial_cambios'] || record['nombre_notif'];
    
    let arr: HistorialCambio[] = [];
    
    if (Array.isArray(hist)) {
      arr = hist;
    } else if (typeof hist === 'string') {
      try {
        const parsed = JSON.parse(hist);
        arr = Array.isArray(parsed) ? parsed : [];
      } catch {
        console.log('Failed to parse history string');
        arr = [];
      }
    }
    
    console.log('Parsed history:', arr);
    return arr.filter(item => typeof item === 'object' && item !== null);
  }

  hasTramiteHistory(record: ConsolidadoRecord): boolean {
    const latest = this.getLatestTramiteNota(record['nombre_notif']);
    return latest.length > 0;
  }

  tramiteTab = signal<'activos' | 'historico'>('activos');

  openTramiteModal(record: ConsolidadoRecord) {
    this.editingTramiteRecord.set(record);
    this.tramiteOption.set([]);
    this.tramiteTab.set('activos');
    this.tramiteAutorizador.set(record.autorizador || '');
  }

  closeTramiteModal() {
    this.editingTramiteRecord.set(null);
    this.tramiteOption.set([]);
  }

  openSoportesModal(r: ConsolidadoRecord) {
    const current = String(r['soportes'] || '');
    let history: SoporteEntry[] = [];
    
    try {
      if (current.trim().startsWith('[')) {
        history = JSON.parse(current);
      } else if (current.trim()) {
        // Migration: if it was a simple string, convert to first entry
        history = [{
          id: crypto.randomUUID(),
          fecha_solicitud: this.getBogotaDateOnly(),
          autorizacion_recibida: true,
          soporte_pdf_presente: true
        }];
      }
    } catch (e) {
      console.error('Error parsing soportes history:', e);
    }

    this.soportesHistory.set(history);
    this.isAddingSoporte.set(history.length === 0);
    this.resetNewSoporte();
    this.editingSoportesRecord.set(r);
  }

  resetNewSoporte() {
    this.newSoporte.set({
      fecha_solicitud: this.getBogotaDateOnly(),
      autorizacion_recibida: false,
      soporte_pdf_presente: false
    });
  }

  addSoporteEntry() {
    const entry: SoporteEntry = {
      id: crypto.randomUUID(),
      fecha_solicitud: this.newSoporte().fecha_solicitud || this.getBogotaDateOnly(),
      periodo_desde: this.newSoporte().periodo_desde,
      periodo_hasta: this.newSoporte().periodo_hasta,
      autorizacion_recibida: !!this.newSoporte().autorizacion_recibida,
      soporte_pdf_presente: !!this.newSoporte().soporte_pdf_presente,
      fecha_registro_soporte: this.getBogotaISOString()
    };

    this.soportesHistory.update(prev => [entry, ...prev]);
    this.isAddingSoporte.set(false);
    this.resetNewSoporte();
  }

  removeSoporteEntry(id: string) {
    this.soportesHistory.update(prev => prev.filter(e => e.id !== id));
  }

  updateNewSoporteField(field: keyof SoporteEntry, value: string) {
    this.newSoporte.update(s => ({ ...s, [field]: value }));
  }

  getLatestSoporte(r: ConsolidadoRecord): SoporteEntry | null {
    const current = String(r['soportes'] || '');
    try {
      if (current.trim().startsWith('[')) {
        const history = JSON.parse(current) as SoporteEntry[];
        return history.length > 0 ? history[0] : null;
      }
    } catch {
      // Not JSON
    }
    return null;
  }

  closeSoportesModal() {
    this.editingSoportesRecord.set(null);
    this.soportesHistory.set([]);
    this.isAddingSoporte.set(false);
    this.resetNewSoporte();
  }

  async saveSoportes() {
    const record = this.editingSoportesRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      const soportes = JSON.stringify(this.soportesHistory());
      await this.consolidadoService.updateRegistro(record.id, { soportes });
      this.closeSoportesModal();
    } catch (error) {
      console.error('Error saving soportes:', error);
    } finally {
      this.saving.set(false);
    }
  }

  async saveTramite(tipoSelect: string, otroTipo: string | undefined, nota: string, autorizador?: string) {
    const record = this.editingTramiteRecord();
    if (!record || !record.id) return;

    const tipoFinal = tipoSelect === 'Otro' ? (otroTipo || 'Otro') : tipoSelect;
    
    if (!tipoFinal || !nota.trim()) return;

    this.saving.set(true);
    try {
      let rawHistory: unknown[] = [];
      const histStr = record['nombre_notif'];
      if (typeof histStr === 'string' && histStr.trim().startsWith('[')) {
        try {
          rawHistory = JSON.parse(histStr);
        } catch {
          rawHistory = [];
        }
      } else if (Array.isArray(histStr)) {
        rawHistory = [...histStr];
      } else if (typeof histStr === 'string' && histStr.trim().length > 0) {
        rawHistory = [{
          fecha: record['updated_at'] ? new Date(record['updated_at'] as string).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }) : '',
          tipo: record['proceso_notif'] || 'Otro',
          nota: histStr
        }];
      }

      const newEntry = {
        fecha: this.getBogotaShortDate(),
        tipo: tipoFinal,
        nota: nota.trim()
      };
      
      const updatedHistory = [newEntry, ...rawHistory];

      const updateData: Partial<ConsolidadoRecord> = {};

      // If it's ACTIVO, we update the validation of rights and skip the tramite update
      if (tipoFinal === 'ACTIVO') {
        const bogotaISO = this.getBogotaISOString();
        const finalAutorizador = autorizador?.trim() || record.autorizador || '';
        
        updateData.validacion_derechos = finalAutorizador;
        updateData.validacion_derechos_fecha = bogotaISO;
        updateData.derechos_paciente = { estado: 'Activo' };
        updateData.autorizador = finalAutorizador;

        // Also insert history for these fields
        await this.consolidadoService.insertHistorialCambio({
          tabla: 'base_hoy',
          sourcerow: Number(record.id),
          campo: 'derechos_paciente',
          valor_antes: JSON.stringify(record.derechos_paciente || {}),
          valor_nuevo: JSON.stringify({ estado: 'Activo' }),
          cambiado_en: bogotaISO,
          hc: record.hc || '',
          ingreso: record.ingreso || ''
        });

        await this.consolidadoService.insertHistorialCambio({
          tabla: 'base_hoy',
          sourcerow: Number(record.id),
          campo: 'validacion_derechos',
          valor_antes: record.validacion_derechos || '',
          valor_nuevo: finalAutorizador,
          cambiado_en: bogotaISO,
          hc: record.hc || '',
          ingreso: record.ingreso || ''
        });
      } else {
        // For other types, we update the tramite fields
        updateData.proceso_notif = tipoFinal;
        updateData.nombre_notif = JSON.stringify(updatedHistory);
      }

      await this.consolidadoService.updateRegistro(record.id, updateData);
      
      // Update local record to reflect changes immediately
      this.editingTramiteRecord.set({
        ...record,
        ...updateData
      });
      
      this.closeTramiteModal();
    } catch (error) {
      console.error('Error saving tramite:', error);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteTramite(index: number) {
    const record = this.editingTramiteRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      const { data: { user } } = await this.supabaseService.client.auth.getUser();
      const userEmail = user?.email || 'Usuario';
      const currentHistory = this.parsedTramites();
      if (index >= 0 && index < currentHistory.length) {
        // Mark as deleted in the original format so it saves correctly
        // Since parsedTramites strips the ~~ we need to re-add it or just modify the raw history
        let rawHistory: TramiteHistory[] = [];
        const histStr = record['nombre_notif'];
        if (typeof histStr === 'string' && histStr.trim().startsWith('[')) {
          try {
            rawHistory = JSON.parse(histStr) as TramiteHistory[];
          } catch {
            rawHistory = [];
          }
        } else if (Array.isArray(histStr)) {
          rawHistory = [...histStr] as TramiteHistory[];
        } else if (typeof histStr === 'string' && histStr.trim().length > 0) {
          rawHistory = [{
            fecha: record['updated_at'] ? new Date(record['updated_at'] as string).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }) : '',
            tipo: (record['proceso_notif'] as string) || 'Otro',
            nota: histStr
          }];
        }

        if (rawHistory[index]) {
          rawHistory[index].nota = `~~${rawHistory[index].nota}~~ (Eliminado por ${userEmail})`;
          
          await this.consolidadoService.updateRegistro(record.id, { 
            nombre_notif: JSON.stringify(rawHistory)
          });
          
          this.editingTramiteRecord.set({
            ...record,
            nombre_notif: JSON.stringify(rawHistory)
          });
        }
      }
    } catch (error) {
      console.error('Error deleting tramite:', error);
    } finally {
      this.saving.set(false);
    }
  }

  openGestionModal(record: ConsolidadoRecord) {
    this.editingGestionRecord.set(record);
    this.tipoContratoInputValue.set(record['confirmacion_pgp'] as string || '');
    this.autInputValue.set(record['aut_estancia'] as string || 'NO');
    
    // Set base date
    const dbDate = record['fecha_proxima_gestion'] as string || '';
    const todayStr = this.getBogotaDateOnly();
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
      // Si escoge OTRO, lo forzamos a manejar INTEGRAL o estado vacío de días para lógica especial
      this.gestionDiasInput.set(-1); // Indicador especial para INTEGRAL
      this.fechaGestionInputValue.set('');
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
    if (days === null || days <= 0 && days !== -1) return '0';
    if (days === -1) return 'otro';
    if ([1, 3, 5, 20].includes(days as number)) return days!.toString();
    // Default to 'otro' if a manual custom value is entered, but here we specifically wanted -1 as INTEGRAL
    return 'otro';
  }

  async saveGestion(aut_estancia: string, tipo_contrato: string, fecha_proxima_gestion: string) {
    const record = this.editingGestionRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      let gestionStr = 'Integral - No se gestiona';
      const days = this.gestionDiasInput();
      
      let nextDateResult = fecha_proxima_gestion || null;

      if (days === -1) {
         gestionStr = 'INTEGRAL';
         nextDateResult = null; // No intentar guardar la palabra 'INTEGRAL' en una columna tipo date de Supabase
      } else if (fecha_proxima_gestion && days !== null && days > 0) {
         gestionStr = `Cada ${days} días`;
      } else {
         nextDateResult = ''; // Don't save if there's no valid frequency
      }

      await this.consolidadoService.updateRegistro(record.id, { 
        aut_estancia: aut_estancia,
        confirmacion_pgp: (aut_estancia === 'NO' || aut_estancia === 'PGP' || aut_estancia === 'PP') ? tipo_contrato : null,
        gestion_estancia: gestionStr,
        fecha_proxima_gestion: nextDateResult || null
      });
      this.closeGestionModal();
    } catch (error) {
      console.error('Error saving gestion:', error);
      alert('Error al guardar la gestión de estancia');
    } finally {
      this.saving.set(false);
    }
  }

  openEntidadModal(record: ConsolidadoRecord) {
    this.editingEntidadRecord.set(record);
    this.epsSearchText.set((record['eps_soat'] as string || '').trim());
    this.entidadInputValue.set(record['entidad'] as string || '');
    this.contratoInputValue.set(record['contrato'] as string || '');
    this.entidadTab.set('datos');
    if (record.id) {
      this.cortesEstancia.set(this.getCortesEstancia(record));
    }
  }

  closeEntidadModal() {
    this.editingEntidadRecord.set(null);
  }

  async saveCorte(tipo: string, autorizacion: string, fecha_corte: string) {
    const record = this.editingEntidadRecord();
    if (!record || !record.id) return;

    if (!tipo || !autorizacion || !fecha_corte) {
      alert('Por favor complete todos los campos para registrar el corte.');
      return;
    }

    const nuevoCorte = {
      base_hoy_id: Number(record.id),
      tipo,
      autorizacion,
      fecha_corte
    };

    try {
      const corte = await this.consolidadoService.addCorteEstancia(nuevoCorte);
      if (corte) {
        this.cortesEstancia.update(cortes => [corte, ...cortes]);

        // Sincronizar el caché nativo de la tabla para que la vista Consolidado general lo lea inmediatamente
        const remaining = this.cortesEstancia();
        const latestInfo = remaining[0];
        const updates = {
           cortes_estancia: JSON.stringify(remaining),
           aut_estancia_entidad: latestInfo ? latestInfo.autorizacion : record['aut_estancia_entidad'],
           fecha_egreso_entidad: latestInfo ? latestInfo.fecha_corte : record['fecha_egreso_entidad']
        };
        await this.consolidadoService.updateRegistro(record.id, updates);
        
        this.editingEntidadRecord.set({
           ...record,
           ...updates
        });
      }
    } catch (error) {
      console.error('Error al guardar corte:', error);
      alert('Error al guardar el corte.');
    }
  }

  async deleteCorte(id: string) {
    // confirm() no funciona en iframe, se elimina directamente en desarrollo
    try {
      const record = this.editingEntidadRecord();
      if (!record || !record.id) return;

      if (id !== 'legacy') {
        const success = await this.consolidadoService.deleteCorteEstancia(id);
        if (!success) {
           alert('Error al eliminar el corte.');
           return;
        }
      }

      this.cortesEstancia.update(cortes => cortes.filter(c => c.id !== id));

      // Sincronizar nuevamente al eliminar
      const remaining = this.cortesEstancia();
      const latestInfo = remaining.length > 0 ? remaining[0] : null;
      
      const updates = {
         cortes_estancia: remaining.length > 0 ? JSON.stringify(remaining) : (null as any),
         aut_estancia_entidad: latestInfo ? latestInfo.autorizacion : (null as any),
         fecha_egreso_entidad: latestInfo ? latestInfo.fecha_corte : (null as any)
      };
      
      await this.consolidadoService.updateRegistro(record.id, updates);
      
      this.editingEntidadRecord.set({
         ...record,
         ...updates
      });
    } catch (error) {
      console.error('Error al eliminar corte:', error);
      alert('Error al eliminar el corte.');
    }
  }

  async saveEntidad() {
    const record = this.editingEntidadRecord();
    if (!record) return;
    
    if (!record.id && !record.ingreso) {
      console.error('No se puede guardar: el registro no tiene un ID o Ingreso válido.', record);
      alert('Error: El registro no tiene un identificador válido en la base de datos. No se puede guardar.');
      return;
    }

    const entidad = this.entidadInputValue() || '';
    const eps_soat = this.epsSearchText() || '';
    const contrato = this.contratoInputValue() || '';

    this.saving.set(true);
    console.log('Iniciando guardado de entidad para record:', record.id || record.ingreso, { entidad, eps_soat, contrato });
    try {
      const success = await this.consolidadoService.updateRegistro(record.id as string | number, { 
        entidad: entidad.trim(),
        eps_soat: eps_soat.trim(),
        contrato: contrato.trim(),
        ingreso: record.ingreso // Incluimos ingreso para fallback si id falta
      });
      
      if (success) {
        console.log('Guardado exitoso para record:', record.id);
        this.closeEntidadModal();
      } else {
        console.warn('No se pudo actualizar el registro en Supabase para record:', record.id);
        alert('No se pudo encontrar el registro en la base de datos para actualizar. Por favor, recarga la página e intenta de nuevo.');
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error('Error saving entidad:', e);
      if (errorMsg.includes('eps_soat') || errorMsg.includes('PGRST204')) {
        alert('Error de Base de Datos: Falta la columna "eps_soat" en la tabla "base_hoy". \n\nPara solucionar esto, ejecuta el siguiente comando SQL en Supabase:\n\nALTER TABLE base_hoy ADD COLUMN eps_soat text;\n\nLuego, en la sección API de Supabase, presiona "Reload Schema" para que los cambios surtan efecto.');
      } else {
        alert('Error al guardar la entidad: ' + errorMsg);
      }
    } finally {
      this.saving.set(false);
    }
  }

  openDetalleModal(record: ConsolidadoRecord) {
    this.viewingDetalleRecord.set(record);
  }

  closeDetalleModal() {
    this.viewingDetalleRecord.set(null);
  }

  parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  calcularDiasCorte(record: ConsolidadoRecord): number {
    const baseDateStr = (record['fecha_egreso_entidad'] || record['fecha_ingreso']) as string;
    const baseDate = this.parseDate(baseDateStr);
    if (!baseDate) return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    baseDate.setHours(0,0,0,0);
    const diffTime = today.getTime() - baseDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getRecordKeys(record: ConsolidadoRecord): string[] {
    if (!record) return [];
    // Filter out internal fields if necessary, e.g., id
    return Object.keys(record).filter(k => k !== 'id').sort();
  }

  formatKey(key: string): string {
    return key.replace(/_/g, ' ');
  }
}

