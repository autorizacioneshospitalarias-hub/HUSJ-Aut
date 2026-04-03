import { Component, signal, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, DatePipe],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="h-full p-6 overflow-y-auto bg-slate-50">
      <div class="max-w-6xl mx-auto space-y-8">
        
        <!-- Header & Clock -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Bienvenido al Sistema de Autorizaciones</h1>
            <p class="text-slate-500 mt-1">Hospital Universitario San José de Popayán</p>
          </div>
          <div class="flex flex-col items-end bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md min-w-[200px]">
            <div class="text-3xl font-mono font-bold tracking-wider text-emerald-400">
              {{ currentTime() | date:'HH:mm:ss' }}
            </div>
            <div class="text-sm text-slate-400 font-medium uppercase tracking-widest mt-1">
              {{ currentTime() | date:'EEEE, d MMMM y' : '' : 'es-CO' }}
            </div>
          </div>
        </div>

        <!-- Quick Links Grid -->
        <div>
          <h2 class="text-lg font-semibold text-slate-700 mb-4 px-1">Módulos Principales</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <!-- Consolidado -->
            <a routerLink="/consolidado" class="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all duration-300 flex flex-col gap-4">
              <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <mat-icon class="text-[24px] w-6 h-6">grid_view</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">Consolidado Estancias</h3>
                <p class="text-sm text-slate-500 mt-1 line-clamp-2">Gestión general de estancias, seguimientos, validación de derechos y PGP.</p>
              </div>
              <div class="mt-auto pt-4 flex items-center text-xs font-bold text-emerald-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                Ingresar <mat-icon class="text-[14px] w-3.5 h-3.5 ml-1">arrow_forward</mat-icon>
              </div>
            </a>

            <!-- Turnos Quirúrgicos -->
            <a routerLink="/turnos" class="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:blue-300 transition-all duration-300 flex flex-col gap-4">
              <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <mat-icon class="text-[24px] w-6 h-6">calendar_today</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">Turnos Quirúrgicos</h3>
                <p class="text-sm text-slate-500 mt-1 line-clamp-2">Programación y visualización de turnos quirúrgicos.</p>
              </div>
              <div class="mt-auto pt-4 flex items-center text-xs font-bold text-blue-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                Ingresar <mat-icon class="text-[14px] w-3.5 h-3.5 ml-1">arrow_forward</mat-icon>
              </div>
            </a>

            <!-- Nota Operatoria -->
            <a routerLink="/nota-operatoria" class="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all duration-300 flex flex-col gap-4">
              <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <mat-icon class="text-[24px] w-6 h-6">article</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">Nota Operatoria</h3>
                <p class="text-sm text-slate-500 mt-1 line-clamp-2">Registro y consulta de notas operatorias de los pacientes.</p>
              </div>
              <div class="mt-auto pt-4 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                Ingresar <mat-icon class="text-[14px] w-3.5 h-3.5 ml-1">arrow_forward</mat-icon>
              </div>
            </a>

            <!-- Liquidación Cx -->
            <a routerLink="/cirugias" class="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all duration-300 flex flex-col gap-4">
              <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <mat-icon class="text-[24px] w-6 h-6">receipt_long</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-lg group-hover:text-purple-700 transition-colors">Liquidación Cx</h3>
                <p class="text-sm text-slate-500 mt-1 line-clamp-2">Gestión y liquidación de procedimientos quirúrgicos.</p>
              </div>
              <div class="mt-auto pt-4 flex items-center text-xs font-bold text-purple-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                Ingresar <mat-icon class="text-[14px] w-3.5 h-3.5 ml-1">arrow_forward</mat-icon>
              </div>
            </a>

            <!-- Egresos -->
            <a routerLink="/egresos" class="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all duration-300 flex flex-col gap-4">
              <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <mat-icon class="text-[24px] w-6 h-6">door_front</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-lg group-hover:text-amber-700 transition-colors">Egresos</h3>
                <p class="text-sm text-slate-500 mt-1 line-clamp-2">Control y seguimiento de pacientes egresados.</p>
              </div>
              <div class="mt-auto pt-4 flex items-center text-xs font-bold text-amber-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                Ingresar <mat-icon class="text-[14px] w-3.5 h-3.5 ml-1">arrow_forward</mat-icon>
              </div>
            </a>

            <!-- Formulario -->
            <a routerLink="/anexos/formulario" class="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-rose-300 transition-all duration-300 flex flex-col gap-4">
              <div class="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <mat-icon class="text-[24px] w-6 h-6">assignment</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-lg group-hover:text-rose-700 transition-colors">Formulario Anexo</h3>
                <p class="text-sm text-slate-500 mt-1 line-clamp-2">Diligenciamiento de formularios y anexos requeridos.</p>
              </div>
              <div class="mt-auto pt-4 flex items-center text-xs font-bold text-rose-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                Ingresar <mat-icon class="text-[14px] w-3.5 h-3.5 ml-1">arrow_forward</mat-icon>
              </div>
            </a>

          </div>
        </div>

      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentTime = signal<Date>(new Date());
  private timerId: ReturnType<typeof setInterval> | undefined;

  ngOnInit() {
    this.timerId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}
