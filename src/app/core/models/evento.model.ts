import { TipoEvento } from './tipo-evento.model';

export interface Evento {
  id?: number;
  tipoEventoId: number;
  iglesiaId?: number;
  nombre: string;
  motivo: string;
  uriFoto: string | null;
  ubicacion: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: boolean;
  alcance?: string;
  mostrarEnCalendario?: boolean;
  habilitarInscripciones?: boolean;
  iglesiasInvitadas?: string;
  createdAt?: Date;
  updatedAt?: Date;

  tipoEventoDto?: TipoEvento;
}

export interface EventoResponse {
  success: boolean;
  message: string;
  datos: Evento;
  nombreModelo: string;
}

export interface EventosResponse {
  success: boolean;
  message: string;
  datos: Evento[];
  nombreModelo: string;
}
