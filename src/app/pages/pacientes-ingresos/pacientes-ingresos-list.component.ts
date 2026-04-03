// CAMBIOS: Se ajustaron los campos del template para usar los nombres reales de Supabase (nombre, hc, ingreso, area, cama, estado) y se corrigió el enlace al perfil del paciente.
import { Component, input, output, computed, inject } from '@angular/core';
import { PacienteIngreso } from '../../models/paciente-ingreso';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PacienteIngresoService } from '../../services/paciente-ingreso.service';

@Component({
  selector: 'app-pacientes-ingresos-list',
  standalone: true,
  imports: [MatIconModule, NgClass, RouterLink],
  template: `
    <div class="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div class="rounded-xl shadow-sm border border-slate-200 flex-1 overflow-auto" [ngClass]="hasActiveFilters() ? 'bg-slate-100/50' : 'bg-white'">
        <table class="w-full text-xs text-left whitespace-nowrap">
          <thead class="bg-slate-50 text-[10px] uppercase text-slate-500 sticky top-0 z-10">
            <tr>
              <th class="px-4 py-2 font-semibold w-10">#</th>
              <th class="px-4 py-2 font-semibold">Admisión</th>
              <th class="px-4 py-2 font-semibold">Paciente</th>
              <th class="px-4 py-2 font-semibold">Documento</th>
              <th class="px-4 py-2 font-semibold">Ubicación</th>
              <th class="px-4 py-2 font-semibold">Estado</th>
              <th class="px-4 py-2 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-600">
            @for (ingreso of ingresos(); track ingreso.ingreso; let i = $index) {
              <tr class="transition-colors group" [ngClass]="hasActiveFilters() ? 'bg-white hover:bg-slate-50' : 'hover:bg-slate-50'">
                <td class="px-4 py-2 text-center text-slate-400 font-mono text-[10px]">{{ i + 1 }}</td>
                <td class="px-4 py-2 font-mono text-emerald-600 font-bold">{{ ingreso.ingreso }}</td>
                <td class="px-4 py-2 font-bold text-slate-900">{{ ingreso.nombre }}</td>
                <td class="px-4 py-2 text-[10px]">{{ ingreso.hc }}</td>
                <td class="px-4 py-2">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-slate-700">Área: {{ ingreso.area || 'N/A' }}</span>
                    <span class="text-[9px] text-slate-500">Cama: {{ ingreso.cama || 'N/A' }}</span>
                  </div>
                </td>
                <td class="px-4 py-2">
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-700': ingreso.estado === 'Activo',
                          'bg-slate-100 text-slate-700': ingreso.estado === 'Egreso',
                          'bg-amber-100 text-amber-700': ingreso.estado === 'Traslado'
                        }">
                    {{ ingreso.estado }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <a [routerLink]="['/paciente-perfil', ingreso.ingreso]" 
                       class="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                       title="Ver Perfil Integral">
                       <mat-icon class="text-[16px] w-4 h-4">visibility</mat-icon>
                    </a>
                    <button (click)="edit.emit(ingreso)" class="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                      <mat-icon class="text-[16px] w-4 h-4">edit</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-slate-500 italic">
                  No hay ingresos registrados.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PacientesIngresosListComponent {
  ingresos = input.required<PacienteIngreso[]>();
  edit = output<PacienteIngreso>();

  pacienteIngresoService = inject(PacienteIngresoService);

  hasActiveFilters = computed(() => {
    return !!this.pacienteIngresoService.searchQuery() || this.ingresos().length !== this.pacienteIngresoService.ingresos().length;
  });
}
