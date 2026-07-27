export interface AccionDto {
  id?: number;
  servicioId?: number;
  servicioCodigo?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  authorityCode?: string; // Formato SERVICIO:ACCION (ej: MIEMBROS:VER)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServicioDto {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  orden?: number;
  activo?: boolean;
  acciones?: AccionDto[];
  createdAt?: Date;
  updatedAt?: Date;
}
