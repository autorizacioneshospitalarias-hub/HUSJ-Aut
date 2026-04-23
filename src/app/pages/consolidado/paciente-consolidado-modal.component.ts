import { Component, input, output, inject, signal, computed, effect } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { LucideAngularModule, Maximize, Minimize, X, User, LogIn, Bed, ClipboardList, Check, SearchX, FileText, Stethoscope, FileCheck2 } from 'lucide-angular';
import { ConsolidadoRecord } from '../../services/consolidado.service';
import { CirugiaService } from '../../services/cirugia.service';
import { NotaOperatoriaService } from '../../services/nota-operatoria.service';
import { TurnoService } from '../../services/turno.service';

@Component({
  selector: 'app-paciente-consolidado-modal',
  standalone: true,
  imports: [LucideAngularModule, NgClass],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full transition-all duration-300 flex flex-col overflow-hidden animate-in zoom-in-95"
           [ngClass]="isExpanded() ? 'h-[98vh] max-w-[98vw]' : 'h-[90vh] max-w-5xl'">
        <!-- Header -->
        <div class="px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 class="text-base font-bold text-slate-800">Consolidado: {{ record()?.nombre }}</h2>
          <div class="flex items-center gap-1">
            <button (click)="isExpanded.set(!isExpanded())" class="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <lucide-icon [name]="isExpanded() ? Minimize : Maximize" class="w-4 h-4"></lucide-icon>
            </button>
            <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        </div>
        
        <!-- Patient Summary Header -->
        <div class="px-4 py-4 bg-slate-100/50 border-b border-slate-200 grid grid-cols-4 gap-4">
          <!-- Paciente -->
          <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
            <div class="flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-2 mb-1">
              <div class="p-1 flex items-center justify-center">
                <lucide-icon [name]="User" class="w-4 h-4 text-slate-500"></lucide-icon>
              </div>
              <h5 class="font-bold text-xs uppercase tracking-wider">Paciente</h5>
            </div>
            <div class="flex flex-col gap-1.5 text-xs">
              <div class="flex justify-between items-start gap-2">
                <span class="text-slate-500 font-medium">Documento</span>
                <span class="font-semibold text-slate-800 text-right">{{ r['hc'] }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-slate-500 font-medium">EPS</span>
                <span class="font-semibold text-slate-800 leading-tight line-clamp-2" [title]="r['eps_soat'] || r['entidad'] || 'No registrada'">
                  {{ r['eps_soat'] || r['entidad'] || 'No registrada' }}
                </span>
              </div>
            </div>
          </div>
          <!-- Admisión -->
          <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
            <div class="flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-2 mb-1">
              <div class="p-1 flex items-center justify-center">
                <lucide-icon [name]="LogIn" class="w-4 h-4 text-slate-500"></lucide-icon>
              </div>
              <h5 class="font-bold text-xs uppercase tracking-wider">Admisión</h5>
            </div>
            <div class="flex flex-col gap-1.5 text-xs">
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">Ingreso</span>
                <span class="font-semibold text-slate-800">{{ r['ingreso'] }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">F. Ingreso</span>
                <span class="font-semibold text-slate-800">{{ getIngresoDate() }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">F. Hosp</span>
                <span class="font-semibold text-slate-800">{{ getHospDate() }}</span>
              </div>
            </div>
          </div>
          <!-- Estancia -->
          <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
            <div class="flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-2 mb-1">
              <div class="p-1 flex items-center justify-center">
                <lucide-icon [name]="Bed" class="w-4 h-4 text-slate-500"></lucide-icon>
              </div>
              <h5 class="font-bold text-xs uppercase tracking-wider">Estancia</h5>
            </div>
            <div class="flex flex-col gap-1.5 text-xs">
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">Días Ingreso</span>
                <span class="font-semibold text-slate-800">{{ r['dias_ingr'] }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">Días Estancia</span>
                <span class="font-semibold text-slate-800">{{ r['dias_hosp'] }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">Total Días</span>
                <span class="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{{ totalDays() }}</span>
              </div>
            </div>
          </div>
          <!-- Registros -->
          <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
            <div class="flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-2 mb-1">
              <div class="p-1 flex items-center justify-center">
                <lucide-icon [name]="ClipboardList" class="w-4 h-4 text-slate-500"></lucide-icon>
              </div>
              <h5 class="font-bold text-xs uppercase tracking-wider">Registros</h5>
            </div>
            <div class="flex flex-col gap-1.5 text-xs">
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">Notas</span>
                <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold min-w-[24px] text-center">{{ notaCount() }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">Cirugías</span>
                <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold min-w-[24px] text-center">{{ cirugiaCount() }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-slate-500 font-medium">Turnos</span>
                <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold min-w-[24px] text-center">{{ turnoCount() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-200 px-6 gap-4 bg-white">
          @for (tab of tabs; track tab) {
            <button (click)="activeTab.set(tab)"
                    class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                    [ngClass]="activeTab() === tab ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'">
              {{ tab }}
            </button>
          }
        </div>

        <!-- Content -->
        <div class="flex-1 p-6 bg-slate-50 flex flex-col overflow-hidden">
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col overflow-hidden">
            <div class="flex items-center justify-between mb-4 shrink-0">
              <div class="flex items-center gap-4">
                <h3 class="text-lg font-semibold text-slate-800">{{ activeTab() }}</h3>
              </div>
              <div class="flex items-center gap-2">
                <input type="text" 
                       (input)="searchTerm.set($any($event.target).value)" 
                       [value]="searchTerm()"
                       placeholder="Buscar..." 
                       class="px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                @if (cupsFilter()) {
                  <button (click)="cupsFilter.set(null)" class="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium hover:bg-emerald-200 transition-colors shadow-sm border border-emerald-200">
                    CUPS: {{ cupsFilter() }}
                    <lucide-icon [name]="X" class="w-3 h-3"></lucide-icon>
                  </button>
                }
                @if (folioFilter()) {
                  <button (click)="folioFilter.set(null)" class="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium hover:bg-blue-200 transition-colors shadow-sm border border-blue-200">
                    Folio: {{ folioFilter() }}
                    <lucide-icon [name]="X" class="w-3 h-3"></lucide-icon>
                  </button>
                }
              </div>
            </div>
            @if (cargando()) {
              <p class="text-slate-500">Cargando información...</p>
            } @else {
              @if (activeTab() === 'TODO') {
                <div class="grid grid-cols-3 gap-6 h-full overflow-hidden">
                  <!-- Turnos -->
                  <div class="flex flex-col gap-3 overflow-hidden" [class.invisible]="searchTerm() && filteredTurnos().length === 0" [class.pointer-events-none]="searchTerm() && filteredTurnos().length === 0">
                    <h4 class="font-bold text-slate-700 border-b pb-2 text-sm">Turnos ({{filteredTurnos().length}})</h4>
                    <div class="flex-1 overflow-y-auto space-y-2 pr-2">
                      @for (turno of filteredTurnos(); track turno.id) {
                        <div class="p-3 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
                          <div class="font-bold text-slate-800">{{ turno.cups_descripcion }}</div>
                          <div class="text-slate-600"><span class="font-bold">Fecha:</span> {{ turno.fecha }} {{ formatTime(turno.hora_24_h) }}</div>
                          @if (turno.especialidad) {
                            <div class="text-slate-600"><span class="font-bold">Especialidad:</span> {{ turno.especialidad }}</div>
                          }
                          @if (turno.autorizador) {
                            <div class="text-slate-600"><span class="font-bold">Autorizador:</span> {{ turno.autorizador }}</div>
                          }
                          @if (turno.estado) {
                            <div class="text-slate-600"><span class="font-bold">Estado Aut.:</span> <span class="px-1.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-tight bg-slate-200">{{ turno.estado }}</span></div>
                          }
                          <div class="flex flex-wrap gap-2 pt-1">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-300" (click)="cupsFilter.set(turno.cups)">
                              <lucide-icon [name]="Stethoscope" class="w-3 h-3"></lucide-icon>
                              CUPS: {{ turno.cups }}
                            </span>
                            @if (turno.folio) {
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-300" (click)="folioFilter.set(turno.folio)">
                                <lucide-icon [name]="FileText" class="w-3 h-3"></lucide-icon>
                                Folio: {{ turno.folio }}
                              </span>
                            }
                            @if (turno.autorizacion) {
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-300 bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full" title="Autorización">
                                Aut: <lucide-icon [name]="Check" class="w-3 h-3"></lucide-icon>{{ turno.autorizacion }}
                              </span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                  <!-- Notas -->
                  <div class="flex flex-col gap-3 overflow-hidden" [class.invisible]="searchTerm() && filteredNotas().length === 0" [class.pointer-events-none]="searchTerm() && filteredNotas().length === 0">
                    <h4 class="font-bold text-slate-700 border-b pb-2 text-sm">Notas ({{filteredNotas().length}})</h4>
                    <div class="flex-1 overflow-y-auto space-y-2 pr-2">
                      @for (nota of filteredNotas(); track nota.id) {
                        <div class="p-3 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
                          <div class="font-bold text-slate-800">{{ nota.procedimiento }}</div>
                          <div class="text-slate-600"><span class="font-bold">Fecha:</span> {{ nota.fecha }} {{ formatTime(nota.hora) }}</div>
                          @if (nota.autorizador) {
                            <div class="text-slate-600"><span class="font-bold">Autorizador:</span> {{ nota.autorizador }}</div>
                          }
                          @if (nota.autorizacion) {
                            <div class="text-slate-600"><span class="font-bold">Estado Aut.:</span> <span class="px-1.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-tight bg-slate-200">{{ nota.autorizacion }}</span></div>
                          }
                          <div class="flex flex-wrap gap-2 pt-1">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-300" (click)="cupsFilter.set(nota.cups)">
                              <lucide-icon [name]="Stethoscope" class="w-3 h-3"></lucide-icon>
                              CUPS: {{ nota.cups }}
                            </span>
                            @if (nota.folio) {
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-300" (click)="folioFilter.set(nota.folio)">
                                <lucide-icon [name]="FileText" class="w-3 h-3"></lucide-icon>
                                Folio: {{ nota.folio }}
                              </span>
                            }
                            @if (nota.autorizacion) {
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-300 bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full" title="Autorización">
                                Aut: <lucide-icon [name]="Check" class="w-3 h-3"></lucide-icon>{{ nota.autorizacion }}
                              </span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                  <!-- Cirugías -->
                  <div class="flex flex-col gap-3 overflow-hidden" [class.invisible]="searchTerm() && filteredCirugias().length === 0" [class.pointer-events-none]="searchTerm() && filteredCirugias().length === 0">
                    <h4 class="font-bold text-slate-700 border-b pb-2 text-sm">Cirugías ({{filteredCirugias().length}})</h4>
                    <div class="flex-1 overflow-y-auto space-y-2 pr-2">
                      @for (cirugia of filteredCirugias(); track cirugia.id) {
                        <div class="p-3 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
                          <div class="font-bold text-slate-800">{{ cirugia.procedure }}</div>
                          <div class="text-slate-600"><span class="font-bold">Fecha:</span> {{ cirugia.date }}</div>
                          @if (cirugia.specialty) {
                            <div class="text-slate-600"><span class="font-bold">Especialidad:</span> {{ cirugia.specialty }}</div>
                          }
                          @if (cirugia.estado) {
                            <div class="text-slate-600"><span class="font-bold">Estado:</span> {{ cirugia.estado }}</div>
                          }
                          @if (cirugia.authorization) {
                            <div class="text-slate-600"><span class="font-bold">Autorización:</span> {{ cirugia.authorization }}</div>
                          }
                          <div class="flex flex-wrap gap-2 pt-1">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-300" (click)="cupsFilter.set(cirugia.cups)">
                              <lucide-icon [name]="Stethoscope" class="w-3 h-3"></lucide-icon>
                              CUPS: {{ cirugia.cups }}
                            </span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              } @else {
                <div class="space-y-6 overflow-y-auto flex-1">
                  @if (activeTab() === 'Nota Operatoria') {
                    <div class="space-y-3">
                      <h4 class="font-bold text-slate-700 border-b pb-2">Nota Operatoria</h4>
                      @for (nota of filteredNotas(); track nota.id) {
                        <div class="p-4 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                          <div class="col-span-2 font-bold text-slate-800">{{ nota.procedimiento }}</div>
                          <div class="text-slate-600"><span class="font-bold">Fecha:</span> {{ nota.fecha }} {{ formatTime(nota.hora) }}</div>
                          <div class="text-slate-600"><span class="font-bold">Cirujano:</span> {{ nota.cirujano }}</div>
                          <div class="text-slate-600"><span class="font-bold">CUPS:</span> {{ nota.cups }}</div>
                          <div class="text-slate-600"><span class="font-bold">Folio:</span> {{ nota.folio || 'N/A' }}</div>
                          <div class="text-slate-600 flex items-center gap-1">
                             <span class="font-bold">Autorización:</span>
                             @if (nota.autorizacion === 'SI' || nota.autorizacion === 'SÍ') {
                                <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold ml-1">
                                    <lucide-icon [name]="Check" class="w-3 h-3"></lucide-icon> SI
                                </span>
                             } @else if (nota.autorizacion === 'NO') {
                                <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold ml-1">
                                    <lucide-icon [name]="X" class="w-3 h-3"></lucide-icon> NO
                                </span>
                             } @else {
                                <span class="ml-1 text-[10px]">{{ nota.autorizacion }}</span>
                             }
                          </div>
                          <div class="col-span-2 text-slate-600"><span class="font-bold">Observación:</span> {{ nota.observacion }}</div>
                        </div>
                      }
                    </div>
                  }
                  @if (activeTab() === 'Liquidación Cx') {
                    <div class="space-y-3">
                      <h4 class="font-bold text-slate-700 border-b pb-2">Liquidación Cx</h4>
                      @for (cirugia of filteredCirugias(); track cirugia.id) {
                        <div class="p-4 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                          <div class="col-span-2 font-bold text-slate-800">{{ cirugia.procedure }}</div>
                          <div class="text-slate-600"><span class="font-bold">Fecha:</span> {{ cirugia.date }}</div>
                          <div class="text-slate-600"><span class="font-bold">Cirujano:</span> {{ cirugia.surgeon }}</div>
                          <div class="text-slate-600"><span class="font-bold">Especialidad:</span> {{ cirugia.specialty }}</div>
                          <div class="text-slate-600"><span class="font-bold">Estado:</span> {{ cirugia.estado }}</div>
                        </div>
                      }
                    </div>
                  }
                  @if (activeTab() === 'Turnos Quirúrgicos') {
                    <div class="space-y-3">
                      <h4 class="font-bold text-slate-700 border-b pb-2">Turnos Quirúrgicos</h4>
                      @for (turno of filteredTurnos(); track turno.id) {
                        <div class="p-4 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                          <div class="col-span-2 font-bold text-slate-800">{{ turno.cups_descripcion }}</div>
                          <div class="text-slate-600"><span class="font-bold">Fecha:</span> {{ turno.fecha }} {{ formatTime(turno.hora_24_h) }}</div>
                          <div class="text-slate-600"><span class="font-bold">Especialista:</span> {{ turno.especialista }}</div>
                          <div class="text-slate-600"><span class="font-bold">Estado:</span> {{ turno.estado }}</div>
                          <div class="text-slate-600"><span class="font-bold">Folio:</span> {{ turno.folio || 'N/A' }}</div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class PacienteConsolidadoModalComponent {
  record = input<ConsolidadoRecord | null>(null);
  
  // Getter for easier access in template
  get r() { return this.record() as ConsolidadoRecord; }
  
  close = output<void>();
  
  private cirugiaService = inject(CirugiaService);
  private notaOperatoriaService = inject(NotaOperatoriaService);
  private turnoService = inject(TurnoService);
  
  tabs = ['TODO', 'Nota Operatoria', 'Liquidación Cx', 'Turnos Quirúrgicos'];
  activeTab = signal('TODO');
  searchTerm = signal('');
  isExpanded = signal(false);
  
  // Icons
  Maximize = Maximize;
  Minimize = Minimize;
  X = X;
  User = User;
  LogIn = LogIn;
  Bed = Bed;
  ClipboardList = ClipboardList;
  Check = Check; // Import Check
  SearchX = SearchX;
  FileText = FileText; // Import FileText
  Stethoscope = Stethoscope; // Import Stethoscope
  FileCheck2 = FileCheck2; // Import FileCheck2
  
  cargando = signal(false);
  notas = signal<any[]>([]);
  cirugias = signal<any[]>([]);
  turnos = signal<any[]>([]);

  notaCount = computed(() => this.notas().length);
  cirugiaCount = computed(() => this.cirugias().length);
  turnoCount = computed(() => this.turnos().length);

  cupsFilter = signal<string | null>(null);
  folioFilter = signal<string | null>(null);
  sortOrder = signal<'desc' | 'asc'>('asc');

  toggleSort() {
    this.sortOrder.update(val => val === 'desc' ? 'asc' : 'desc');
  }

  private parseDate(fecha: string | null | undefined, hora: string | null | undefined): number {
    if (!fecha) return 0;
    // If fecha already contains 'T', it's likely an ISO string
    const dateString = fecha.includes('T') ? fecha : `${fecha}T${this.formatTime(hora) || '00:00:00'}`;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  formatTime(timeStr: string | null | undefined): string {
    if (!timeStr) return '';
    if (timeStr.includes('GMT') || timeStr.includes('Standard Time') || timeStr.length > 10) {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }
    return timeStr;
  }

  getIngresoDate(): string {
    return this.formatDate(this.r['fecha_ingreso'] as string);
  }

  getHospDate(): string {
    return this.formatDate(this.r['fecha_hosp'] as string) || 'N/A';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    // Remove extra time info if present
    const datePart = dateStr.split(' ')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

// No changes needed to parseDate, just ensuring it's used correctly
  filteredNotas = computed(() => {
    let result = this.notas();
    const cFilter = this.cupsFilter();
    const fFilter = this.folioFilter();
    const sTerm = this.searchTerm().toLowerCase();
    
    if (cFilter) result = result.filter(n => n.cups === cFilter);
    if (fFilter) result = result.filter(n => n.folio === fFilter);
    if (sTerm) result = result.filter(n => 
      n.procedimiento?.toLowerCase().includes(sTerm) || 
      n.autorizador?.toLowerCase().includes(sTerm) ||
      n.cups?.toLowerCase().includes(sTerm) ||
      String(n.folio || '').toLowerCase().includes(sTerm) ||
      n.observacion?.toLowerCase().includes(sTerm)
    );
    
    return result.sort((a, b) => {
      const dateA = this.parseDate(a.fecha, a.hora);
      const dateB = this.parseDate(b.fecha, b.hora);
      return this.sortOrder() === 'asc' ? dateA - dateB : dateB - dateA;
    });
  });

  filteredCirugias = computed(() => {
    let result = this.cirugias();
    const cFilter = this.cupsFilter();
    const fFilter = this.folioFilter();
    const sTerm = this.searchTerm().toLowerCase();
    
    if (cFilter) result = result.filter(c => c.cups === cFilter);
    if (fFilter) result = []; // Cirugias don't have folio
    if (sTerm) result = result.filter(c => 
      c.procedure?.toLowerCase().includes(sTerm) ||
      c.specialty?.toLowerCase().includes(sTerm) ||
      c.cups?.toLowerCase().includes(sTerm) ||
      c.authorization?.toLowerCase().includes(sTerm) ||
      c.estado?.toLowerCase().includes(sTerm)
    );
    
    return result.sort((a, b) => {
      const dateA = this.parseDate(a.date, null);
      const dateB = this.parseDate(b.date, null);
      return this.sortOrder() === 'asc' ? dateA - dateB : dateB - dateA;
    });
  });

  filteredTurnos = computed(() => {
    let result = this.turnos();
    const cFilter = this.cupsFilter();
    const fFilter = this.folioFilter();
    const sTerm = this.searchTerm().toLowerCase();
    
    if (cFilter) result = result.filter(t => t.cups === cFilter);
    if (fFilter) result = result.filter(t => t.folio === fFilter);
    if (sTerm) result = result.filter(t => 
      t.cups_descripcion?.toLowerCase().includes(sTerm) ||
      t.especialidad?.toLowerCase().includes(sTerm) ||
      t.autorizador?.toLowerCase().includes(sTerm) ||
      t.autorizacion?.toLowerCase().includes(sTerm) ||
      t.cups?.toLowerCase().includes(sTerm) ||
      t.folio?.toLowerCase().includes(sTerm) ||
      t.estado?.toLowerCase().includes(sTerm)
    );
    
    return result.sort((a, b) => {
      const dateA = this.parseDate(a.fecha, a.hora_24_h);
      const dateB = this.parseDate(b.fecha, b.hora_24_h);
      return this.sortOrder() === 'asc' ? dateA - dateB : dateB - dateA;
    });
  });

  totalDays = computed(() => {
    const r = this.record();
    if (!r || !r['fecha_ingreso']) return 0;
    const start = new Date(r['fecha_ingreso'] as string);
    const end = r['fecha_egreso_entidad'] ? new Date(r['fecha_egreso_entidad'] as string) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  constructor() {
    effect(async () => {
      const record = this.record();
      if (record) {
        this.cargando.set(true);
        const ingreso = record['ingreso'] as string;
        
        await Promise.all([
          this.notaOperatoriaService.getNotasByIngreso(ingreso).then(n => {
            console.log('Notas cargadas:', n);
            this.notas.set(n);
          }),
          this.cirugiaService.getCirugiasByIngreso(ingreso).then(c => {
            console.log('Cirugías cargadas:', c);
            this.cirugias.set(c);
          }),
          this.turnoService.getTurnosByIngreso(ingreso).then(t => {
            console.log('Turnos cargados:', t);
            this.turnos.set(t);
          })
        ]);
        
        this.cargando.set(false);
      }
    });
  }
}
