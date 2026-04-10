import { Persona } from './persona.model';

export interface Miembro {
  id?: number;
  fechaConvercion?: Date;
  lugarConvercion: string;
  interventores: string;
  detalles: string;
  personaId: number;
  personaDto?: Persona;
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