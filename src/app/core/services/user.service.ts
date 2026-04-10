import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {
  User,
  UserResponse,
  SingleUserResponse,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRolesDto,
  ChangePasswordDto
} from '../models/user.model';
import {map} from 'rxjs/operators';

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

  getUserById(id: number): Observable<SingleUserResponse> {
    return this.http.get<SingleUserResponse>(`${this.API_URL}/showbyid/${id}`);
  }

  createUser(user: CreateUserDto): Observable<any> {
    return this.http.post(`${this.API_URL}/create`, user);
  }

  updateUser(user: {
    apellidos: any;
    name: string;
    id: number | undefined;
    email: any;
    username: any
  }): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/update`, user);
  }

  updateUserRoles(updateRoles: UpdateUserRolesDto): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/update-roles`, updateRoles);
  }

  changePassword(passwordData: ChangePasswordDto): Observable<any> {
    return this.http.put(`${this.API_URL}/change-password`, passwordData);
  }

  uploadUserPhoto(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.API_URL}/${id}/foto`, formData);
  }

  // getUserByNameForToken(): Observable<CreateUserDto> {
  //   return this.http.get<CreateUserDto>(`${this.API_URL}/findbyusername`, {});
  // }

  getUserByNameForToken(): Observable<CreateUserDto> {
    return this.http.get<any>(`${this.API_URL}/findbyusername`).pipe(
      map((response) => {
        // Mapea la respuesta JSON a CreateUserDto
        const datos = response.datos;
        return {
          email: datos.email,
          username: datos.username,
          name: datos.name,
          apellidos: datos.apellidos,
          uriFoto: datos.uriFoto,
          password: datos.password,
          roles: datos.roles.map((role: { id: number; name: string }) => role.name)
        } as CreateUserDto;
      })
    );
  }
}
