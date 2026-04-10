export interface MiembroIglesia {
  id?: number;
  miembroId: number;
  iglesiaId: number;
  fecha: Date;
  motivoTraspaso?: string;
  fechaTraspaso?: Date;
  uriCartaTraspaso?: string;
  estado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MiembroIglesiaResponse {
  message: string;
  datos: MiembroIglesia[];
  nombreModelo: string;
}

export interface MiembroIglesiaDetail {
  message: string;
  datos: MiembroIglesia;
  nombreModelo: string;
}