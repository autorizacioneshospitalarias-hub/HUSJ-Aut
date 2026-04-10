// CAMBIOS: Se ajustaron los campos para coincidir exactamente con Supabase (ingreso, fecha, hora, procedimiento, cups, autorizacion, observacion).
export interface NotaOperatoria {
  id: string;
  ingreso: string;
  fecha: string;
  procedimiento: string;
  
  // Fields from user's "real fields" list
  paciente: string | null;
  documento: string | null;
  cirujano: string | null;
  
  // Additional fields used in UI
  hora: string | null;
  cups: string | null;
  autorizacion: string | null;
  observacion: string | null;
  
  // Campos adicionales usados en la UI
  servicio: string | null;
  folio: string | null;
  dx: string | null;
  autorizador: string | null;
  tipo_ingreso: string | null;
  eps: string | null;
  soporte: string | null;
  especialidad?: string | null;
}

export interface SupabaseNotaOperatoria extends NotaOperatoria {
  Authorization?: string;
}
