export interface PrivilegioDto {
  id?: number;
  nombre: string;
  acto: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PrivilegioResponse {
  id: number;
  nombre: string;
  acto: string;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
  roles: { id: number; name: string }[];
}
