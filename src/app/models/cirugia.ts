// CAMBIOS: Se ajustaron los campos para coincidir exactamente con Supabase (admissionNumber, procedure, date, specialty, surgeon, cups, estado, entity).
export interface Cirugia {
  id: string;
  admissionNumber: string;
  procedure: string;
  date: string;
  specialty: string;
  surgeon: string;
  cups: string;
  estado: string;
  entity: string;
  
  // Additional fields used in UI (may be optional or from joined tables)
  patientName: string | null;
  documento: string | null;
  type: string | null;
  orNumber: string | null;
  gqx: string | null;
  novedad: string | null;
  imagesDx: string | null;
  authorization: string | null;
  auditLiquidation: string | null;
  anesthesiologist: string | null;
  assistant1: string | null;
  assistant2: string | null;
  status: string | null; // Usado para 'Verificado'
}
