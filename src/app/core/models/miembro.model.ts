export interface Miembro {
  id?: number;
  fechaConvercion?: Date;
  lugarConvercion: string;
  interventores: string;
  detalles: string;
  nombre: string;
  apellido: string;
  ci?: number;
  fechaNac: Date;
  celular: string;
  sexo: string;
  direccion: string;
  uriFoto: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MiembroResponse {
  message: string;
  datos: Miembro[];
  nombreModelo: string;
}

export interface MiembroDetail {
  message: string;
  datos: Miembro;
  nombreModelo: string;
}