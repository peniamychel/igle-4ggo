export interface Role {
  authority: string;
}

export interface LoginResponse {
  success: boolean;
  roles: Role[];
  message: string;
  token: string;
  refreshToken: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}