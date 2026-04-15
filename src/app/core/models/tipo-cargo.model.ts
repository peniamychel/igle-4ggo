export interface TipoCargo {
  id?: number;
  tipo: string;
  nombre: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TipoCargoResponse {
  success: boolean;
  message: string;
  datos: TipoCargo;
  nombreModelo: string;
}

export interface TipoCargosResponse {
  success: boolean;
  message: string;
  datos: TipoCargo[];
  nombreModelo: string;
}
