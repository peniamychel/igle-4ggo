export interface Iglesia {
  id?: number;
  nombre: string;
  direccion: string;
  telefono: number;
  fechaFundacion: Date;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IglesiasResponse {
  message: string;
  datos: Iglesia[];
  nombreModelo: string;
}

export interface IglesiaResponse {
  message: string;
  datos: Iglesia;
  nombreModelo: string;
}

export interface IglesiaDetail {
  message: string;
  datos: Iglesia;
  nombreModelo: string;
}