// CAMBIOS: Se ajustaron los campos para coincidir exactamente con Supabase (ingreso, fecha_salida, entidad, dias_hospit).
export interface Egreso {
  id: string;
  ingreso: string;
  fecha_salida: string;
  entidad: string;
  dias_hospit: number;
  
  // Campos adicionales usados en la UI
  nombre: string | null;
  documento: string | null;
  hospitalizacion: string | null;
  servicio: string | null;
  cama: string | null;
  columna_w: string | null;
  municipio: string | null;
  contrato: string | null;
  dias_ingreso: number | null;
  hc15: string | null;
  hc19: string | null;
  hc19_des: string | null;
  estado_y: string | null;
  estado_2: string | null;
  autorizador: string | null;
  observacion: string | null;
  area: string | null;
  area_egreso_s: string | null;
  area_de_egreso_2: string | null;
  facturador: string | null;
}
