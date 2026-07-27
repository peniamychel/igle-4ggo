export interface PermisoDto {
  id?: number;
  nombre: string;
  acto?: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PrivilegioDto = PermisoDto;

export interface PermisoResponse {
  id?: number;
  nombre: string;
  acto?: string;
  estado?: boolean;
}

export type PrivilegioResponse = PermisoResponse;
