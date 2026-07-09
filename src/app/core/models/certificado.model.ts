import { Evento } from './evento.model';
import { TipoCertificado } from './tipo-certificado.model';

export interface Certificado {
  id?: number;
  eventoId: number;
  tipoCertificadoId: number;
  plantillaCertificadoId?: number;
  motivoCertificado: string;
  codigoCertificado?: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  eventoDto?: Evento;
  tipoCertificadoDto?: TipoCertificado;
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
