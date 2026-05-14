import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoginResponse, LoginRequest } from '../../models/interfaces/auth.interface';
import { LIVE_ANNOUNCER_DEFAULT_OPTIONS } from '@angular/cdk/a11y';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private readonly ROLE = 'role';
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);


  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  //Login de usuario
  /**
   * Inicia sesión en el sistema
   * @param credentials credenciales de inicio de sesión
   * @returns respuesta del inicio de sesión
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response));
          localStorage.setItem(this.ROLE, response.roles[0].authority);
          localStorage.setItem("nombreuser", response.username)
          // localStorage.setItem("",response.)
          this.currentUserSubject.next(response);
        })
      );
  }


  /**
   * Cierra sesión en el sistema
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE);
    localStorage.removeItem("nombreuser");
    localStorage.removeItem("datosUsuario");
    this.currentUserSubject.next(null);
  }

  /**
   * Obtiene el token de autorización
   * @returns token de autorización
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Verifica si el token de autorización está expirado
   * @returns true si el token está expirado, false en caso contrario
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const decoded = JSON.parse(decodedJson);
      const exp = decoded.exp;
      if (!exp) return false;
      return (Math.floor((new Date).getTime() / 1000)) >= exp;
    } catch (e) {
      return true;
    }
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si el usuario está autenticado, false en caso contrario
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  /**
   * Obtiene el usuario actual
   * @returns usuario actual
   */
  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si el usuario está autenticado, false en caso contrario
   */
  isAuth() {
    const authToken = localStorage.getItem('auth_token');
    return authToken !== null && authToken.length > 0 && !this.isTokenExpired();
  }

  /**
   * Verifica si el rol del usuario es administrador
   * @returns true si el rol del usuario es administrador, false en caso contrario
   */
  isLoggedRolAdmin() {
    // localStorage.get('role');
    return localStorage.getItem('role') === 'ROLE_ADMIN';
    // return localStorage.getItem(user_data[1]) === 'ROLE_ADMIN';
  }

  /**
   * Verifica si el rol del usuario es encargado de iglesia
   * @returns true si el rol del usuario es encargado de iglesia, false en caso contrario
   */
  isLoggedRolEncargado() {
    return localStorage.getItem('role') === 'ROLE_ENCARGADO_IGLESIA';
  }
}
