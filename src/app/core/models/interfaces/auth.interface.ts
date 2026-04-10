export interface Role {
  authority: string;
}

export interface LoginResponse {
  roles: Role[];
  mensaje: string;
  token: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}