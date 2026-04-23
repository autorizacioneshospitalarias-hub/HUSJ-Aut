import { Component, input, signal, inject, computed } from '@angular/core';
import { Cirugia } from '../../models/cirugia';
import { CirugiaService } from '../../services/cirugia.service';
import { PacienteIngresoService } from '../../services/paciente-ingreso.service';
import { ConsolidadoService } from '../../services/consolidado.service';
import { DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Check, X, Clock } from 'lucide-angular';

@Component({
  selector: 'app-cirugia-detail',
  standalone: true,
  imports: [DatePipe, NgClass, MatIconModule, RouterLink, LucideAngularModule],
  template: `
    <div class="h-full overflow-y-auto bg-[#F3F4F6] p-6 animate-in fade-in duration-200">
      <div class="max-w-5xl mx-auto space-y-4">
        
        <!-- Cirugia Header Card -->
        <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-200 shadow-sm flex justify-between items-start relative overflow-hidden">
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200">
                {{ cirugia().estado }}
              </span>
              <span class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm border transition-colors"
                    [ngClass]="cirugia().type?.toUpperCase() === 'ENDOSCOPIA' ? 'bg-[#4285f4] text-white border-[#4285f4]' : 'bg-slate-200 text-slate-700 border-slate-300'">
                {{ cirugia().type }}
              </span>
              <mat-icon class="text-[16px] w-5 h-5 cursor-pointer text-emerald-600 hover:text-emerald-800" (click)="openRightsDialog(cirugia().id)">verified_user</mat-icon>
            </div>
            <div class="flex items-center gap-3 mb-1">
              <h2 class="text-base font-bold text-slate-900 leading-tight uppercase">{{ cirugia().patientName || getPatientName(cirugia().admissionNumber) }}</h2>
              <a [routerLink]="['/paciente-perfil', cirugia().admissionNumber]" 
                 class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1 transition-colors">
                <mat-icon class="text-[12px] w-3 h-3">visibility</mat-icon>
                PERFIL INTEGRAL
              </a>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-[11px]">
              <span class="font-mono text-slate-600 font-medium">CC: {{ cirugia().documento && cirugia().documento !== 'N/A' ? cirugia().documento : getPatientDocument(cirugia().admissionNumber) }}</span>
              <span class="text-slate-400">•</span>
              <span class="text-slate-600">Ingreso: {{ cirugia().admissionNumber }}</span>
              <span class="text-slate-400">•</span>
              <div class="flex items-start gap-1">
                <mat-icon class="text-[14px] w-4 h-4 text-emerald-600 mt-0.5">location_on</mat-icon>
                <div class="flex flex-col">
                  <span class="font-bold text-slate-700 leading-tight">{{ ubicacion().area }}</span>
                  <span class="text-[10px] text-slate-500">{{ ubicacion().cama }}</span>
                </div>
              </div>
              <span class="text-slate-400">•</span>
              <span class="font-bold text-indigo-600">{{ cirugia().entity }}</span>
            </div>
          </div>
          
          <div class="flex flex-col items-center bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha</span>
            <span class="text-lg font-bold text-emerald-600 font-mono leading-none mb-1">Qx: {{ cirugia().orNumber || 'N/A' }}</span>
            <span class="text-[11px] font-medium text-slate-500">{{ cirugia().date | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Main Info Column -->
          <div class="lg:col-span-2 space-y-5">
            
            <!-- Procedimiento Card -->
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Procedimiento Quirúrgico</h3>
                <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200 hover:text-slate-600 transition-colors inline-flex items-center gap-1 group/cups-detail"
                      (click)="copyToClipboard(cirugia().cups, $event)"
                      (keydown.enter)="copyToClipboard(cirugia().cups, $event)"
                      tabindex="0"
                      title="Copiar CUPS">
                  CUPS: {{ cirugia().cups }}
                  @if (copiedCups()) {
                    <mat-icon class="text-[12px] w-3 h-3 text-emerald-500">check</mat-icon>
                  } @else {
                    <mat-icon class="text-[12px] w-3 h-3 opacity-0 group-hover/cups-detail:opacity-100">content_copy</mat-icon>
                  }
                </span>
              </div>
              
              <div class="space-y-4">
                <div class="group relative pl-4 border-l-2 border-emerald-400 transition-colors pb-1">
                  <p class="text-xs font-bold text-slate-800 leading-snug">{{ cirugia().procedure }}</p>
                  <p class="text-[10px] text-slate-500 mt-1">GQX: {{ cirugia().gqx }}</p>
                </div>
              </div>
              
              <div class="pt-4 mt-4 border-t border-slate-100">
                <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Especialidad</p>
                <p class="text-[11px] text-slate-700 leading-relaxed">{{ cirugia().specialty }}</p>
              </div>
            </div>

            <!-- Equipo Médico -->
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Equipo Médico</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-[10px] text-slate-400 mb-0.5">Cirujano Principal</p>
                  <p class="font-bold text-sm text-slate-800">{{ cirugia().surgeon || 'No asignado' }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 mb-0.5">Anestesiólogo</p>
                  <p class="font-bold text-sm text-slate-800">{{ cirugia().anesthesiologist || 'No asignado' }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 mb-0.5">Ayudante 1</p>
                  <p class="text-[11px] text-slate-700">{{ cirugia().assistant1 || 'No asignado' }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 mb-0.5">Ayudante 2</p>
                  <p class="text-[11px] text-slate-700">{{ cirugia().assistant2 || 'No asignado' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Side Column -->
          <div class="space-y-5">
            <!-- Administrativo -->
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Administrativo</h3>
              <div class="space-y-2.5">
                <div class="flex items-start justify-between gap-2 group/auth">
                  <div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Autorización</p>
                    @if (normalizeAuth(cirugia().authorization) === 'SI') {
                      <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                        <lucide-icon [name]="Check" class="w-2.5 h-2.5"></lucide-icon>
                        SI
                      </span>
                    } @else if (normalizeAuth(cirugia().authorization) === 'NO') {
                      <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold">
                        <lucide-icon [name]="X" class="w-2.5 h-2.5"></lucide-icon>
                        NO
                      </span>
                    } @else if (normalizeAuth(cirugia().authorization) === 'PTE') {
                      <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                        <lucide-icon [name]="Clock" class="w-2.5 h-2.5"></lucide-icon>
                        PTE
                      </span>
                    } @else {
                      <p class="font-mono text-xs font-bold text-slate-400 italic">Sin autorizar</p>
                    }
                  </div>
                  <button (click)="openAuthModal(cirugia())" class="text-slate-400 hover:text-emerald-600 opacity-0 group-hover/auth:opacity-100 transition-opacity p-1 rounded hover:bg-emerald-50 shrink-0" title="Registrar autorización">
                    <mat-icon class="text-[16px] w-4 h-4">check_circle</mat-icon>
                  </button>
                </div>
                <div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase">Liquidación Auditoría</p>
                  <p class="text-[11px] text-slate-700 font-medium">{{ cirugia().auditLiquidation || 'N/A' }}</p>
                </div>
                <div class="pt-3 border-t border-slate-100">
                  <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Novedad</p>
                  <p class="text-[11px] text-slate-600 italic leading-relaxed">{{ cirugia().novedad || 'Sin novedades' }}</p>
                </div>
                <div class="pt-3 border-t border-slate-100">
                  <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Imágenes Dx</p>
                  <p class="text-[11px] text-slate-600">{{ cirugia().imagesDx || 'No registradas' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    @if (editingAuthRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <mat-icon class="text-emerald-600">check_circle</mat-icon>
              Registrar Autorización
            </h3>
            <button (click)="closeAuthModal()" class="text-slate-400 hover:text-slate-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="p-6 flex-1 overflow-y-auto">
            <div class="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p class="text-[11px] font-bold text-slate-700 mb-1">Paciente: <span class="font-normal">{{ editingAuthRecord()?.patientName }}</span></p>
              <p class="text-[11px] font-bold text-slate-700 mb-1">Procedimiento: <span class="font-normal">{{ editingAuthRecord()?.procedure }}</span></p>
              <p class="text-[11px] font-bold text-slate-700">CUPS: <span class="font-normal">{{ editingAuthRecord()?.cups }}</span></p>
            </div>
            
            <div class="space-y-4">
              <div>
                <label for="auth-select-detail" class="block text-xs font-bold text-slate-700 mb-1">Estado de Autorización</label>
                <select id="auth-select-detail" #authSelect [value]="editingAuthRecord()?.authorization || 'PTE'" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                       (keydown.enter)="saveAuth(authSelect.value)">
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="PTE">PTE</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
            <button (click)="closeAuthModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancelar</button>
            <button (click)="saveAuth(authSelect.value)" [disabled]="saving()" class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
              }
              Guardar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CirugiaDetailComponent {
  readonly Check = Check;
  readonly X = X;
  readonly Clock = Clock;

  cirugia = input.required<Cirugia>();
  cirugiaService = inject(CirugiaService);
  ingresoService = inject(PacienteIngresoService);
  consolidadoService = inject(ConsolidadoService);
  
  showRightsDialog = signal<string | null>(null);
  editingAuthRecord = signal<Cirugia | null>(null);
  saving = signal<boolean>(false);
  copiedCups = signal<boolean>(false);

  // Get patient name for a surgery
  getPatientName(admissionNumber: string) {
    if (!admissionNumber) return 'N/A';
    const ingresos = this.ingresoService.ingresos();
    const cleanAdmission = admissionNumber.toString().trim().toLowerCase();
    const ingreso = ingresos.find(i => String(i.ingreso).trim().toLowerCase() === cleanAdmission);
    return ingreso ? ingreso.nombre : 'N/A';
  }

  // Get patient document for a surgery
  getPatientDocument(admissionNumber: string) {
    if (!admissionNumber) return 'N/A';
    const ingresos = this.ingresoService.ingresos();
    const cleanAdmission = admissionNumber.toString().trim().toLowerCase();
    const ingreso = ingresos.find(i => String(i.ingreso).trim().toLowerCase() === cleanAdmission);
    return ingreso ? ingreso.hc : 'N/A';
  }

  ubicacion = computed(() => {
    if (this.consolidadoService.cargando() && this.consolidadoService.allRegistros().length === 0) return { area: '...', cama: '...' };
    
    const admission = this.cirugia().admissionNumber;
    const patientName = this.cirugia().patientName;
    if (!admission && !patientName) return { area: 'N/A', cama: 'N/A' };
    
    const registros = this.consolidadoService.allRegistros();
    const cleanAdmission = admission?.toString().trim().toLowerCase();
    
    // Try to find by admission number
    let registro = cleanAdmission ? registros.find(r => {
      const num = String(r.ingreso || '').trim().toLowerCase();
      return num === cleanAdmission || num.includes(cleanAdmission) || cleanAdmission.includes(num);
    }) : null;
    
    // Fallback: search by patient name if no match by admission number
    if (!registro && patientName) {
      const cleanName = patientName.trim().toLowerCase();
      registro = registros.find(r => String(r.nombre || '').trim().toLowerCase() === cleanName);
    }
    
    if (!registro) return { area: 'N/A', cama: 'N/A' };
    
    const area = registro.area || 'N/A';
    const cama = registro.cama || 'N/A';
    return { area, cama };
  });

  copyToClipboard(text: string | null | undefined, event: Event) {
    event.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedCups.set(true);
      setTimeout(() => {
        this.copiedCups.set(false);
      }, 2000);
    });
  }

  normalizeAuth(auth: string | null | undefined): string {
    return auth ? auth.toUpperCase() : '';
  }

  getAuthStatusTextClass(status: string | null | undefined): string {
    if (!status) return 'text-slate-400';
    switch (status.toUpperCase()) {
      case 'SI': return 'text-emerald-600';
      case 'NO': return 'text-red-600';
      case 'PTE': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  }

  openRightsDialog(id: string) {
    this.showRightsDialog.set(id);
  }

  openAuthModal(record: Cirugia) {
    this.editingAuthRecord.set(record);
  }

  closeAuthModal() {
    this.editingAuthRecord.set(null);
  }

  async saveAuth(newAuth: string) {
    const record = this.editingAuthRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      await this.cirugiaService.updateCirugia(record.id, { authorization: newAuth });
      this.closeAuthModal();
    } catch (error) {
      console.error('Error saving authorization:', error);
    } finally {
      this.saving.set(false);
    }
  }
}
