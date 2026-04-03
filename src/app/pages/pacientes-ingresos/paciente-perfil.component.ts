// CAMBIOS: Se ajustaron los campos del template para usar los nombres reales de Supabase (nombre, hc, ingreso, area, cama, estado) y se corrigió el acceso a campos en las secciones de cirugías, turnos, egresos y notas operatorias.
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PacienteIngresoService } from '../../services/paciente-ingreso.service';
import { PacienteIngreso } from '../../models/paciente-ingreso';
import { DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-paciente-perfil',
  standalone: true,
  imports: [DatePipe, NgClass, MatIconModule, RouterLink],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="bg-slate-50 p-6 h-full overflow-y-auto">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <button routerLink="/pacientes-ingresos" class="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1 class="text-2xl font-bold text-slate-800">Perfil Integral del Paciente</h1>
          </div>
          <div class="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200 flex items-center gap-2">
            <mat-icon class="text-sm">verified</mat-icon>
            <span class="text-sm font-bold uppercase tracking-wider">Datos Consolidados (Parallel Query)</span>
          </div>
        </div>

        @if (cargando()) {
          <div class="flex flex-col items-center justify-center py-20">
            <mat-icon class="animate-spin text-4xl text-emerald-600 mb-4">refresh</mat-icon>
            <p class="text-slate-500 font-medium">Cargando historial completo del paciente...</p>
          </div>
        } @else if (paciente()) {
          @let p = paciente()!;
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Patient Info Card -->
            <div class="lg:col-span-1 space-y-6">
              <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="bg-emerald-600 p-6 text-white">
                  <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <mat-icon class="text-3xl">person</mat-icon>
                  </div>
                  <h2 class="text-xl font-bold leading-tight uppercase">{{ p.nombre }}</h2>
                  <p class="text-emerald-100 text-sm mt-1">HC: {{ p.hc }}</p>
                </div>
                <div class="p-6 space-y-4">
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Número de Ingreso</p>
                    <p class="text-lg font-mono font-bold text-slate-800">{{ p.ingreso }}</p>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                      <p class="text-sm font-bold text-slate-700">{{ p.area || 'N/A' }} - {{ p.cama || 'N/A' }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" 
                            [ngClass]="p.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                        {{ p.estado }}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EPS / Aseguradora</p>
                    <p class="text-sm font-bold text-indigo-600">{{ p.egresos?.[0]?.entidad || p.cirugias?.[0]?.entity || 'N/A' }}</p>
                  </div>
                </div>
              </div>

              <!-- Stats Summary -->
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Resumen de Actividad</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div class="flex items-center gap-3">
                      <mat-icon class="text-emerald-600">medical_services</mat-icon>
                      <span class="text-sm font-medium text-slate-700">Cirugías</span>
                    </div>
                    <span class="text-lg font-bold text-slate-800">{{ p.cirugias?.length || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div class="flex items-center gap-3">
                      <mat-icon class="text-indigo-600">event_note</mat-icon>
                      <span class="text-sm font-medium text-slate-700">Turnos</span>
                    </div>
                    <span class="text-lg font-bold text-slate-800">{{ p.turnos?.length || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div class="flex items-center gap-3">
                      <mat-icon class="text-amber-600">description</mat-icon>
                      <span class="text-sm font-medium text-slate-700">Notas Op.</span>
                    </div>
                    <span class="text-lg font-bold text-slate-800">{{ p.nota_operatoria?.length || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline / Detailed Info -->
            <div class="lg:col-span-2 space-y-6">
              
              <!-- Cirugías Section -->
              <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 class="font-bold text-slate-800 flex items-center gap-2">
                    <mat-icon class="text-emerald-600">medical_services</mat-icon>
                    Historial de Cirugías
                  </h3>
                </div>
                <div class="p-0">
                  @if (p.cirugias && p.cirugias.length > 0) {
                    <div class="divide-y divide-slate-100">
                      @for (c of p.cirugias; track c.id) {
                        <div class="p-4 hover:bg-slate-50 transition-colors">
                          <div class="flex justify-between items-start mb-2">
                            <div>
                              <p class="text-sm font-bold text-slate-800">{{ c.procedure }}</p>
                              <p class="text-[10px] text-slate-500 uppercase font-medium">{{ c.specialty }} • {{ c.surgeon }}</p>
                            </div>
                            <span class="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{{ c.date | date:'dd/MM/yyyy' }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase" 
                                  [ngClass]="{
                                    'bg-emerald-100 text-emerald-700': c.estado === 'OK' || c.estado === 'HECHO',
                                    'bg-amber-100 text-amber-700': c.estado === 'CAMBIO' || c.estado === 'ADICION'
                                  }">
                              {{ c.estado }}
                            </span>
                            <span class="text-[10px] text-slate-400 font-mono">CUPS: {{ c.cups }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="p-8 text-center text-slate-400 italic text-sm">No hay cirugías registradas para este ingreso.</div>
                  }
                </div>
              </div>

              <!-- Turnos Section -->
              <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 class="font-bold text-slate-800 flex items-center gap-2">
                    <mat-icon class="text-indigo-600">event_note</mat-icon>
                    Turnos y Programación
                  </h3>
                </div>
                <div class="p-0">
                  @if (p.turnos && p.turnos.length > 0) {
                    <div class="divide-y divide-slate-100">
                      @for (t of p.turnos; track t.id) {
                        <div class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                          <div>
                            <p class="text-sm font-bold text-slate-800">{{ t.cups_descripcion || 'Procedimiento sin nombre' }}</p>
                            <p class="text-[10px] text-slate-500 uppercase font-medium">{{ t.especialidad }} • {{ t.especialista }}</p>
                          </div>
                          <div class="text-right">
                            <p class="text-xs font-bold text-indigo-600">{{ t.fecha | date:'dd/MM/yyyy' }}</p>
                            <p class="text-[10px] text-slate-400">{{ t.hora_24_h }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="p-8 text-center text-slate-400 italic text-sm">No hay turnos programados.</div>
                  }
                </div>
              </div>

              <!-- Notas Operatorias Section -->
              <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 class="font-bold text-slate-800 flex items-center gap-2">
                    <mat-icon class="text-amber-600">description</mat-icon>
                    Notas Operatorias
                  </h3>
                </div>
                <div class="p-0">
                  @if (p.nota_operatoria && p.nota_operatoria.length > 0) {
                    <div class="divide-y divide-slate-100">
                      @for (n of p.nota_operatoria; track n.id) {
                        <div class="p-4 hover:bg-slate-50 transition-colors">
                          <div class="flex justify-between items-center mb-1">
                            <p class="text-sm font-bold text-slate-800">{{ n.procedimiento }}</p>
                            <span class="text-[10px] text-slate-500">{{ n.fecha | date:'dd/MM/yyyy' }} {{ n.hora }}</span>
                          </div>
                          <p class="text-xs text-slate-600 line-clamp-2 italic">"{{ n.observacion || 'Sin hallazgos registrados' }}"</p>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="p-8 text-center text-slate-400 italic text-sm">No hay notas operatorias registradas.</div>
                  }
                </div>
              </div>

            </div>
          </div>
        } @else {
          <div class="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <mat-icon class="text-6xl text-slate-200 mb-4">person_off</mat-icon>
            <h2 class="text-xl font-bold text-slate-800 mb-2">Paciente no encontrado</h2>
            <p class="text-slate-500 mb-6">No pudimos encontrar datos para el número de ingreso proporcionado.</p>
            <button routerLink="/pacientes-ingresos" class="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors">
              Volver a la lista
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class PacientePerfilComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ingresoService = inject(PacienteIngresoService);
  
  paciente = signal<PacienteIngreso | null>(null);
  cargando = signal<boolean>(true);

  ngOnInit() {
    const numero = this.route.snapshot.paramMap.get('ingreso');
    if (numero) {
      this.loadFullData(numero);
    } else {
      this.cargando.set(false);
    }
  }

  async loadFullData(numero: string) {
    this.cargando.set(true);
    try {
      const data = await this.ingresoService.getPacienteCompleto(numero);
      this.paciente.set(data);
    } catch (error) {
      console.error('Error loading full patient data:', error);
    } finally {
      this.cargando.set(false);
    }
  }
}
