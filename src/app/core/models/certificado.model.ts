import { Evento } from './evento.model';

export interface Certificado {
  id?: number;
  eventoId: number;
  plantillaCertificadoId?: number;
  motivoCertificado: string;
  codigoCertificado?: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  eventoDto?: Evento;
}

export interface CertificadoResponse {
  success: boolean;
  message: string;
  datos: Certificado;
  nombreModelo: string;
}

export interface CertificadosResponse {
  success: boolean;
  message: string;
  datos: Certificado[];
  nombreModelo: string;
}
