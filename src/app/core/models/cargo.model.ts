import { Iglesia } from './iglesia.model';
import { TipoCargo } from './tipo-cargo.model';
import { Miembro } from './miembro.model';

export interface Cargo {
  id?: number;
  tipoCargoId: number;
  iglesiaId: number;
  idMiembro: number;
  detalle: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Opcionales para renderizar en UI
  tipoCargoDto?: TipoCargo;
  iglesiaDto?: Iglesia;
  miembroDto?: Miembro;
}

export interface CargoResponse {
  success: boolean;
  message: string;
  datos: Cargo;
  nombreModelo: string;
}

export interface CargosResponse {
  success: boolean;
  message: string;
  datos: Cargo[];
  nombreModelo: string;
}
