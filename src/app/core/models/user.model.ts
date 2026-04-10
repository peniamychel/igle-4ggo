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
}

export interface Role {
  id: number;
  name: string;
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
  roles: string[];
}


export interface UpdateUserDto {
  id: number;
  username: string;
  email: string;
  name: string;
  apellidos: string;
}

export interface UpdateUserRolesDto {
  id: number;
  roles: string[];
}

export interface ChangePasswordDto {
  id: number;
  currentPassword: string;
  newPassword: string;
}
