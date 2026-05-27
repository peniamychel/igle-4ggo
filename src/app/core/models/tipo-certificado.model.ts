export interface TipoCertificado {
  id?: number;
  nombre: string;
  fecha: Date;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TipoCertificadoResponse {
  success: boolean;
  message: string;
  datos: TipoCertificado;
  nombreModelo: string;
}

export interface TipoCertificadosResponse {
  success: boolean;
  message: string;
  datos: TipoCertificado[];
  nombreModelo: string;
}
