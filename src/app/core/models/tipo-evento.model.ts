export interface TipoEvento {
  id?: number;
  nombre: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TipoEventoResponse {
  success: boolean;
  message: string;
  datos: TipoEvento;
  nombreModelo: string;
}

export interface TipoEventosResponse {
  success: boolean;
  message: string;
  datos: TipoEvento[];
  nombreModelo: string;
}
