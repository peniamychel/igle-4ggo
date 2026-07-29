import { Miembro } from './miembro.model';
import { Evento } from './evento.model';
import { Certificado } from './certificado.model';

export interface ParticipacionEvento {
  id?: number;
  miembroId: number;
  eventoId: number;
  certificadoId: number | null;
  entregadoPorId?: number;
  /** Código corto impreso; verificación limitada y con datos reducidos. */
  codigoUnico?: string;
  /** Token del QR (UUID): verificación completa. */
  tokenVerificacion?: string;
  estado?: boolean;
  entregado?: boolean;
  fechaEntrega?: string;
  /** Libro y folio del registro físico, se asientan al generar el PDF. */
  numeroLibro?: string;
  numeroFolio?: string;
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
