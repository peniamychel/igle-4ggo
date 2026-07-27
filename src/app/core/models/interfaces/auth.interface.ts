export interface Role {
  authority: string;
}

export interface CargoSelectOption {
  iglesiaId: number;
  iglesiaNombre: string;
  cargos: string[];
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  username: string;
  roles?: Role[];
  requiresSelection?: boolean;
  preAuthToken?: string;
  iglesias?: CargoSelectOption[];
}

export interface LoginRequest {
  username: string;
  password: string;
}