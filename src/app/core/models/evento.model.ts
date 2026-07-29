import { TipoEvento } from './tipo-evento.model';

export interface Evento {
  id?: number;
  tipoEventoId: number;
  iglesiaId?: number;
  nombre: string;
  motivo: string;
  ubicacion: string;
  localidad?: string;
  provincia?: string;
  departamento?: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: boolean;
  alcance?: string;
  mostrarEnCalendario?: boolean;
  habilitarInscripciones?: boolean;
  iglesiasInvitadas?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Entrada: al crear/editar, indica si el evento genera certificado.
  generaCertificado?: boolean;
  // Solo respuesta.
  archivado?: boolean;
  tieneCertificado?: boolean;

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
