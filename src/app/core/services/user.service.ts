import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  UserResponse,
  SingleUserResponse,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  AdminResetPasswordDto
} from '../models/user.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/api/usuario/v1`;


  constructor(private http: HttpClient) {
  }

  getAllUsers(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.API_URL}/findall`);
  }

  /**
   * Obtiene un usuario por id
   * @param id id del usuario
   * @returns usuario encontrado
   */
  getUserById(id: number): Observable<SingleUserResponse> {
    return this.http.get<SingleUserResponse>(`${this.API_URL}/showbyid/${id}`);
  }

  /**
   * Crea un usuario
   * @param user usuario a crear
   * @returns usuario creado
   */
  createUser(user: CreateUserDto): Observable<any> {
    return this.http.post(`${this.API_URL}/create`, user);
  }

  /**
   * Actualiza un usuario
   * @param user usuario a actualizar
   * @returns usuario actualizado
   */
  updateUser(user: UpdateUserDto): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/update`, user);
  }

  /**
   * Cambia la contraseña de un usuario (requiere currentPassword)
   * @param passwordData contraseña del usuario a cambiar
   * @returns true si se cambio la contraseña
   */
  changePassword(passwordData: ChangePasswordDto): Observable<any> {
    return this.http.put(`${this.API_URL}/change-password`, passwordData);
  }

  /**
   * Resetea la contraseña de un usuario (solo admin, sin currentPassword)
   * @param dto datos con id y nueva contraseña
   * @returns usuario actualizado
   */
  resetPassword(dto: AdminResetPasswordDto): Observable<any> {
    return this.http.put(`${this.API_URL}/reset-password`, dto);
  }

  /**
   * Sube la foto de un usuario
   * @param id id del usuario
   * @param file archivo a subir
   * @returns true si se subio la foto
   */
  uploadUserPhoto(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.API_URL}/${id}/foto`, formData);
  }

  /**
   * Elimina la foto de un usuario
   * @param id id del usuario
   * @returns void
   */
  deleteUserPhoto(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}/foto`);
  }

  /**
   * Elimina un usuario del sistema
   * @param id id del usuario
   * @returns respuesta de la API
   */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/delete/${id}`);
  }

  // getUserByNameForToken(): Observable<CreateUserDto> {
  //   return this.http.get<CreateUserDto>(`${this.API_URL}/findbyusername`, {});
  // }


  /**
   * Obtiene un usuario por nombre de usuario
   * @param username nombre de usuario
   * @returns usuario encontrado
   */
  getUserByNameForToken(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/findbyusername`).pipe(
      map((response) => {
        // Mapea la respuesta JSON a CreateUserDto
        const datos = response.datos;
        return {
          id: datos.id,
          email: datos.email,
          username: datos.username,
          name: datos.name,
          apellidos: datos.apellidos,
          uriFoto: datos.uriFoto,
          password: datos.password,
          roles: datos.roles ? datos.roles.map((role: any) => role.nombreRol || role.nombre || role.name || '') : []
        };
      })
    );
  }
}
