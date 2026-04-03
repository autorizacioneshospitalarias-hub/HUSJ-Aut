import { Component, inject, signal, computed } from '@angular/core';
import { PacienteIngresoService } from '../../services/paciente-ingreso.service';
import { PacientesIngresosListComponent } from './pacientes-ingresos-list.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PacienteIngreso } from '../../models/paciente-ingreso';

@Component({
  selector: 'app-pacientes-ingresos',
  standalone: true,
  imports: [PacientesIngresosListComponent, HeaderComponent, MatIconModule, ReactiveFormsModule],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full bg-slate-50 overflow-hidden">
      <app-header></app-header>
      
      <div class="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div class="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Gestión de Ingresos de Pacientes</h2>
            <div class="flex items-center gap-2 mt-1">
              <p class="text-xs text-slate-500">Control de estancias, ubicación y trazabilidad de pacientes.</p>
              <span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                TOTAL: {{ filteredIngresos().length }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="openModal()" class="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
              <mat-icon class="text-[18px] w-5 h-5">person_add</mat-icon>
              Nuevo Ingreso
            </button>
            <button (click)="ingresoService.loadIngresos()" class="flex items-center justify-center w-9 h-9 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors" title="Actualizar">
              <mat-icon class="text-[18px] w-5 h-5 flex items-center justify-center" [class.animate-spin]="ingresoService.cargando()">refresh</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 relative p-6 overflow-hidden flex flex-col">
        <div class="max-w-7xl mx-auto w-full h-full flex flex-col">
          @if (ingresoService.cargando()) {
            <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <div class="flex flex-col items-center gap-3">
                <mat-icon class="animate-spin text-emerald-600 text-[32px] w-8 h-8">refresh</mat-icon>
                <p class="text-sm font-medium text-slate-600">Cargando ingresos...</p>
              </div>
            </div>
          }

          @if (ingresoService.error()) {
            <div class="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center justify-between gap-3 shrink-0">
              <div class="flex items-center gap-3">
                <mat-icon>error_outline</mat-icon>
                <div>
                  <p class="font-medium">Error al cargar los datos</p>
                  <p class="text-sm opacity-80">{{ ingresoService.error() }}</p>
                </div>
              </div>
              <button (click)="ingresoService.loadIngresos()" class="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-bold transition-colors">
                Reintentar
              </button>
            </div>
          }

          <app-pacientes-ingresos-list class="flex-1 overflow-hidden flex flex-col" [ingresos]="filteredIngresos()" (edit)="openModal($event)"></app-pacientes-ingresos-list>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
              <mat-icon class="text-emerald-600">{{ editingId() ? 'edit' : 'person_add' }}</mat-icon>
              {{ editingId() ? 'Editar Ingreso' : 'Registrar Nuevo Ingreso' }}
            </h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <form [formGroup]="ingresoForm" (ngSubmit)="save()" class="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label for="paciente_nombre" class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Nombre del Paciente</label>
                <input id="paciente_nombre" type="text" formControlName="paciente_nombre" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
                       placeholder="Nombre completo">
              </div>
              
              <div>
                <label for="documento" class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Documento</label>
                <input id="documento" type="text" formControlName="documento" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
                       placeholder="CC / TI / RC">
              </div>

              <div>
                <label for="ingreso" class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Número de Ingreso</label>
                <input id="ingreso" type="text" formControlName="ingreso" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
                       placeholder="Ej: 123456">
              </div>

              <div>
                <label for="fecha_ingreso" class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Fecha de Ingreso</label>
                <input id="fecha_ingreso" type="datetime-local" formControlName="fecha_ingreso" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50">
              </div>

              <div>
                <label for="estado" class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Estado</label>
                <select id="estado" formControlName="estado" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50">
                  <option value="Activo">Activo</option>
                  <option value="Egreso">Egreso</option>
                  <option value="Traslado">Traslado</option>
                </select>
              </div>

              <div>
                <label for="piso" class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Piso</label>
                <input id="piso" type="text" formControlName="piso" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
                       placeholder="Ej: 3">
              </div>

              <div>
                <label for="cama" class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Cama</label>
                <input id="cama" type="text" formControlName="cama" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
                       placeholder="Ej: 301-A">
              </div>

              <div class="md:col-span-2">
                <label for="eps" class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">EPS / Entidad</label>
                <input id="eps" type="text" formControlName="eps" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
                       placeholder="Nombre de la entidad">
              </div>
            </div>
            
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" (click)="closeModal()" class="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" [disabled]="ingresoForm.invalid || saving()" 
                      class="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
                @if (saving()) {
                  <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
                }
                {{ editingId() ? 'Actualizar' : 'Registrar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class PacientesIngresosComponent {
  ingresoService = inject(PacienteIngresoService);
  fb = inject(FormBuilder);
  
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);

  filteredIngresos = computed(() => {
    const term = this.ingresoService.searchQuery().toLowerCase().trim();
    const all = this.ingresoService.ingresos();
    
    if (!term) return [];
    
    return all.filter(i => 
      (i.nombre?.toLowerCase().includes(term)) ||
      (i.hc?.toLowerCase().includes(term)) ||
      (i.paciente_nombre?.toLowerCase().includes(term)) ||
      (i.patientName?.toLowerCase().includes(term)) ||
      (i.documento?.toLowerCase().includes(term)) ||
      (i.ingreso?.toLowerCase().includes(term)) ||
      (i.numero_ingreso?.toLowerCase().includes(term)) ||
      (i.admissionNumber?.toLowerCase().includes(term)) ||
      (i.eps?.toLowerCase().includes(term)) ||
      (i.entity?.toLowerCase().includes(term)) ||
      (i.piso?.toLowerCase().includes(term)) ||
      (i.cama?.toLowerCase().includes(term))
    );
  });

  ingresoForm = this.fb.group({
    paciente_nombre: ['', Validators.required],
    documento: ['', Validators.required],
    ingreso: ['', Validators.required],
    numero_ingreso: [''],
    fecha_ingreso: [new Date().toISOString().slice(0, 16), Validators.required],
    piso: [''],
    cama: [''],
    estado: ['Activo', Validators.required],
    eps: ['']
  });

  constructor() {
    this.ingresoService.loadIngresos();
  }

  openModal(ingreso?: PacienteIngreso) {
    if (ingreso) {
      this.editingId.set(ingreso.id || null);
      this.ingresoForm.patchValue({
        paciente_nombre: ingreso.paciente_nombre,
        documento: ingreso.documento,
        ingreso: ingreso.ingreso || ingreso.numero_ingreso,
        numero_ingreso: ingreso.numero_ingreso,
        fecha_ingreso: (ingreso.fecha_ingreso || ingreso.created_at || '').slice(0, 16),
        piso: ingreso.piso,
        cama: ingreso.cama,
        estado: ingreso.estado,
        eps: ingreso.eps
      });
    } else {
      this.editingId.set(null);
      this.ingresoForm.reset({
        paciente_nombre: '',
        documento: '',
        ingreso: '',
        numero_ingreso: '',
        fecha_ingreso: new Date().toISOString().slice(0, 16),
        piso: '',
        cama: '',
        estado: 'Activo',
        eps: ''
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  async save() {
    if (this.ingresoForm.invalid) return;
    
    this.saving.set(true);
    const formValue = this.ingresoForm.value as PacienteIngreso;
    
    try {
      if (this.editingId()) {
        await this.ingresoService.updateIngreso(this.editingId()!, formValue);
      } else {
        await this.ingresoService.createIngreso(formValue);
      }
      this.closeModal();
    } catch (error) {
      console.error('Error saving ingreso:', error);
    } finally {
      this.saving.set(false);
    }
  }
}
