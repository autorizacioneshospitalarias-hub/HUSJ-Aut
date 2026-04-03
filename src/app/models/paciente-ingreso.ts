// CAMBIOS: Se ajustaron los campos para coincidir exactamente con Supabase (ingreso, hc, nombre, area, cama, estado) y se eliminaron nombres legacy.
import { Cirugia } from './cirugia';
import { Turno } from './turno';
import { Egreso } from './egreso';
import { NotaOperatoria } from './nota-operatoria';

export interface PacienteIngreso {
  id?: string;
  ingreso: string;
  hc: string;
  nombre: string;
  area: string;
  cama: string;
  estado: string;
  created_at?: string;
  
  // Campos adicionales usados en la UI
  paciente_nombre: string | null;
  patientName: string | null;
  documento: string | null;
  numero_ingreso: string | null;
  admissionNumber: string | null;
  eps: string | null;
  entity: string | null;
  piso: string | null;
  fecha_ingreso: string | null;
  
  // Relaciones
  cirugias?: Cirugia[];
  turnos?: Turno[];
  egresos?: Egreso[];
  nota_operatoria?: NotaOperatoria[];
}
