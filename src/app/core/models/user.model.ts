import { PrivilegioDto } from './interfaces/privilegio.interface';

export interface User {
  id?: number;
  email: string;
  username: string;
  name: string | null;
  apellidos: string | null;
  uriFoto: string | null;
  estado: boolean;
  password?: string;
  roles: Role[];
  miembroId?: number;
  iglesiaNombre?: string;
  privilegios?: PrivilegioDto[];
}

export interface Role {
  id: number;
  name?: string;
  nombre?: string;
  nombreRol?: string;
}

export interface UserResponse {
  message: string;
  datos: User[];
  nombreModelo: string;
}

export interface SingleUserResponse {
  message: string;
  datos: User;
  nombreModelo: string;
}

export interface CreateUserDto {
  email: string;
  username: string;
  name: string;
  apellidos: string;
  uriFoto: string;
  password: string;
  roles?: string[];
  miembroId?: number;
  privilegioIds?: number[];
}

export interface UpdateUserDto {
  id?: number;
  username: string;
  email: string;
  name: string;
  apellidos: string;
  miembroId?: number;
  privilegioIds?: number[];
  estado?: boolean;
}

export interface ChangePasswordDto {
  id: number;
  currentPassword: string;
  newPassword: string;
}

export interface AdminResetPasswordDto {
  id: number;
  newPassword: string;
}
