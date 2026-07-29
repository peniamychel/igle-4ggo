export interface Miembro {
  id?: number;
  fechaConvercion?: Date;
  lugarConvercion: string;
  interventores: string;
  detalles: string;
  nombre: string;
  apellido: string;
  ci?: number;
  fechaNac: Date;
  celular: string;
  sexo: string;
  direccion: string;
  // Datos adicionales (opcionales), se completan en la sección desplegable del formulario
  localidadNacimiento?: string;
  provincia?: string;
  departamento?: string;
  nombrePadre?: string;
  nombreMadre?: string;
  uriFoto: string;
  iglesiaNombre?: string;
  cargoNombre?: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MiembroResponse {
  message: string;
  datos: Miembro[];
  nombreModelo: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface MiembroPaginatedResponse {
  message: string;
  datos: PaginatedResponse<Miembro>;
  nombreModelo: string;
}

export interface MiembroDetail {
  message: string;
  datos: Miembro;
  nombreModelo: string;
}