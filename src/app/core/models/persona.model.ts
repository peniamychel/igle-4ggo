export interface Persona {
  id?: number;
  nombre: string;
  apellido: string;
  ci: number;
  fechaNac: Date;
  celular: string;
  sexo: string;
  direccion: string;
  uriFoto: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PersonaResponse {
  message: string;
  datos: Persona[];
  nombreModelo: string;
}

