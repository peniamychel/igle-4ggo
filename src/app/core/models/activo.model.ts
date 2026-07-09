export interface Activo {
  id?: number;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  estadoConservacion?: string; // BUENO, REGULAR, MALO
  valorEstimado?: number;
  fechaAdquisicion?: Date | string;
  iglesiaId: number;
  iglesiaNombre?: string;
  codigo?: string;
  uriFoto?: string;
}

export interface ActivoResponse {
  message: string;
  datos: Activo[];
  nombreModelo: string;
}

export interface ActivoDetailResponse {
  message: string;
  datos: Activo;
  nombreModelo: string;
}
