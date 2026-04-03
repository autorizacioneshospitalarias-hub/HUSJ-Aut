import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { 
        path: '', 
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        pathMatch: 'full' 
      },
      { 
        path: 'consolidado', 
        loadComponent: () => import('./pages/consolidado/consolidado.component').then(m => m.ConsolidadoComponent) 
      },
      { 
        path: 'estancias-nuevas', 
        loadComponent: () => import('./pages/consolidado/consolidado.component').then(m => m.ConsolidadoComponent) 
      },
      { 
        path: 'pgp-aic', 
        loadComponent: () => import('./pages/consolidado/consolidado.component').then(m => m.ConsolidadoComponent) 
      },
      { 
        path: 'seguimiento', 
        loadComponent: () => import('./pages/consolidado/consolidado.component').then(m => m.ConsolidadoComponent) 
      },
      { 
        path: 'validacion-derechos', 
        loadComponent: () => import('./pages/consolidado/consolidado.component').then(m => m.ConsolidadoComponent) 
      },
      { 
        path: 'sin-convenio', 
        loadComponent: () => import('./pages/sin-convenio/sin-convenio.component').then(m => m.SinConvenioComponent) 
      },
      { 
        path: 'giro-cama', 
        loadComponent: () => import('./pages/consolidado/giro-cama.component').then(m => m.GiroCamaComponent) 
      },
      { 
        path: 'turnos', 
        loadComponent: () => import('./pages/turnos/turnos.component').then(m => m.TurnosComponent) 
      },
      { 
        path: 'nota-operatoria', 
        loadComponent: () => import('./pages/nota-operatoria/nota-operatoria.component').then(m => m.NotaOperatoriaComponent) 
      },
      { 
        path: 'cirugias', 
        loadComponent: () => import('./pages/cirugias/cirugias.component').then(m => m.CirugiasComponent) 
      },
      { 
        path: 'egresos', 
        loadComponent: () => import('./pages/egresos/egresos.component').then(m => m.EgresosComponent) 
      },
      { 
        path: 'pacientes-ingresos', 
        loadComponent: () => import('./pages/pacientes-ingresos/pacientes-ingresos.component').then(m => m.PacientesIngresosComponent) 
      },
      {
        path: 'lista-pacientes',
        redirectTo: 'pacientes-ingresos',
        pathMatch: 'full'
      },
      { 
        path: 'paciente-perfil/:ingreso', 
        loadComponent: () => import('./pages/pacientes-ingresos/paciente-perfil.component').then(m => m.PacientePerfilComponent) 
      },
      {
        path: 'anexos',
        children: [
          {
            path: 'formulario',
            loadComponent: () => import('./pages/formulario/formulario.component').then(m => m.FormularioComponent)
          }
        ]
      }
    ]
  }
];
