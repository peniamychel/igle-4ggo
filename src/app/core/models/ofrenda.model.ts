export interface Ofrenda {
  id?: number;
  iglesiaId: number;
  iglesiaNombre?: string;
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  monto: number;
  fechaRecaudacion: string; // ISO date string (YYYY-MM-DD)
  conceptoDetalle?: string;
  usuarioTesoreroId?: number;
  usuarioTesoreroUsername?: string;
  fechaRegistro?: string;
}

export interface OfrendaResumen {
  ingresos: number;
  egresos: number;
  neto: number;
}
