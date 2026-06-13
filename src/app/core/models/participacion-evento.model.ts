import { Miembro } from './miembro.model';
import { Evento } from './evento.model';
import { Certificado } from './certificado.model';

export interface ParticipacionEvento {
  id?: number;
  miembroId: number;
  eventoId: number;
  certificadoId: number | null;
  fecha: string;
  entregadoPorId?: number;
  codigoUnico?: string;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;

  miembroDto?: Miembro;
  eventoDto?: Evento;
  certificadoDto?: Certificado;
}

export interface ParticipacionEventoResponse {
  success: boolean;
  message: string;
  datos: ParticipacionEvento;
  nombreModelo: string;
}

export interface ParticipacionesEventoResponse {
  success: boolean;
  message: string;
  datos: ParticipacionEvento[];
  nombreModelo: string;
}
