export interface EventoAceptacion {
  id?: number;
  eventoId: number;
  iglesiaId: number;
  estado: 'ACEPTADO' | 'ARCHIVADO';
  updatedAt?: string;
}
