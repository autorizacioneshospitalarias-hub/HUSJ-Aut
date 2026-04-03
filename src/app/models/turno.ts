// CAMBIOS: Se ajustaron los campos para coincidir exactamente con Supabase (n_ingreso, fecha, hora_24_h, especialidad, especialista, cups_descripcion).
export interface Turno {
  id: string;
  n_ingreso: string;
  fecha: string;
  hora_24_h: string;
  especialidad: string;
  especialista: string;
  cups_descripcion: string;
  
  // Campos adicionales usados en la UI
  estado: string | null;
  prioridad: string | null;
  paciente: string | null;
  documento: string | null;
  edad: number | null;
  edad_en: string | null;
  genero: string | null;
  eps: string | null;
  folio: string | null;
  cups: string | null;
  anestesia: string | null;
  autorizador: string | null;
  dx: string | null;
  dx_descr: string | null;
  observacion: string | null;
  servicio_actual: string | null;
  cama: string | null;
  fecha_nacimiento: string | null;
  imagenes: string | null;
}
