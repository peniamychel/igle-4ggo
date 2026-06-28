import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoginResponse, LoginRequest } from '../../models/interfaces/auth.interface';

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

  private handleSuccessfulLogin(response: LoginResponse): void {
    if (response.token) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    if (response.iglesias) {
      localStorage.setItem('user_iglesias', JSON.stringify(response.iglesias));
    }
    if (response.roles) {
      // Normalizar roles para soportar tanto objetos de tipo Role como strings planos
      const normalizedRoles = response.roles.map((r: any) => {
        if (typeof r === 'string') {
          return { authority: r };
        }
        return r;
      });

      const roleAuthority = normalizedRoles.find(r => r.authority && r.authority.startsWith('ROLE_'));
      localStorage.setItem(this.ROLE, roleAuthority ? roleAuthority.authority : (normalizedRoles[0]?.authority || ''));
      const privilegios = normalizedRoles
        .filter(r => r.authority && !r.authority.startsWith('ROLE_'))
        .map(r => r.authority);
      localStorage.setItem('privilegios', JSON.stringify(privilegios));
    }
    localStorage.setItem("nombreuser", response.username);
    this.currentUserSubject.next(response);
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
          if (!response.requiresSelection) {
            this.handleSuccessfulLogin(response);
          }
        })
      );
  }

  /**
   * Selecciona el cargo/iglesia para el inicio de sesión
   * @param preAuthToken token de pre-autenticación
   * @param iglesiaId ID de la iglesia seleccionada
   * @returns respuesta del inicio de sesión final
   */
  selectCargo(preAuthToken: string, iglesiaId: number): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/select-cargo`, { preAuthToken, iglesiaId })
      .pipe(
        tap(response => {
          this.handleSuccessfulLogin(response);
        })
      );
  }

  /**
   * Cambia la iglesia/cargo activa de forma dinámica
   * @param iglesiaId ID de la iglesia a la cual cambiar
   * @returns respuesta del inicio de sesión con el nuevo token
   */
  switchChurch(iglesiaId: number): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/switch-church`, { iglesiaId })
      .pipe(
        tap(response => {
          this.handleSuccessfulLogin(response);
        })
      );
  }

  /**
   * Obtiene la decodificación del token actual
   */
  getDecodedToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      return JSON.parse(decodedJson);
    } catch (e) {
      return null;
    }
  }

  /**
   * Obtiene el nombre de la iglesia del contexto del token actual
   */
  getCurrentIglesiaNombre(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded.iglesiaNombre : null;
  }

  /**
   * Obtiene el nombre del cargo del contexto del token actual
   */
  getCurrentCargoNombre(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded.cargoNombre : null;
  }

  /**
   * Obtiene el ID de la iglesia del contexto del token actual
   */
  getCurrentIglesiaId(): number | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded.iglesiaId : null;
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
    localStorage.removeItem("privilegios");
    localStorage.removeItem("user_iglesias");
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
    // Delegado en isAuthenticated() para mantener una sola implementación
    return this.isAuthenticated();
  }

  /**
   * Verifica si el rol del usuario es administrador
   * @returns true si el rol del usuario es administrador, false en caso contrario
   */
  isLoggedRolAdmin() {
    return localStorage.getItem('role') === 'ROLE_ADMIN';
  }

  /**
   * Verifica si el rol del usuario es encargado de iglesia
   * @returns true si el rol del usuario es encargado de iglesia, false en caso contrario
   */
  isLoggedRolEncargado() {
    return localStorage.getItem('role') === 'ROLE_ENCARGADO_IGLESIA';
  }

  /**
   * Verifica si el usuario posee un privilegio (o alguno de varios).
   *
   * Modelo de 2 niveles: los privilegios son strings del tipo
   * `Ver <Entidad>` / `Escribir <Entidad>` que viajan en el JWT y se guardan
   * en `localStorage['privilegios']` (array de strings) tras el login.
   *
   * - El rol ADMIN tiene bypass: siempre devuelve `true` (el backend le
   *   asigna TODOS los privilegios por código, pero reforzamos acá).
   * - La comparación es EXACTA (sensible a mayúsculas/acentos): los nombres
   *   deben coincidir con `privilegio.nombre` en la BD.
   *
   * @param privilegio Nombre del privilegio, o lista de nombres (basta con
   *                   tener uno solo de la lista).
   * @returns `true` si el usuario tiene el privilegio (o es admin).
   */
  hasPrivilegio(privilegio: string | string[]): boolean {
    if (this.isLoggedRolAdmin()) return true;

    const raw = localStorage.getItem('privilegios');
    if (!raw) return false;

    let userPrivileges: string[];
    try {
      userPrivileges = JSON.parse(raw);
    } catch {
      return false;
    }
    if (!Array.isArray(userPrivileges)) return false;

    const buscados = Array.isArray(privilegio) ? privilegio : [privilegio];
    return buscados.some(p => userPrivileges.includes(p));
  }
}
