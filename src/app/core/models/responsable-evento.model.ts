import { Evento } from './evento.model';
import { Cargo } from './cargo.model';

export interface ResponsableEvento {
  id?: number;
  eventoId: number;
  cargoId: number;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  eventoDto?: Evento;
  cargoDto?: Cargo;
  nombreCompleto?: string;
  nombreCargo?: string;
}

export interface ResponsableEventoResponse {
  success: boolean;
  message: string;
  datos: ResponsableEvento;
  nombreModelo: string;
}

export interface ResponsablesEventoResponse {
  success: boolean;
  message: string;
  datos: ResponsableEvento[];
  nombreModelo: string;
}
