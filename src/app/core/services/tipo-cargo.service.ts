import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TipoCargo, TipoCargoResponse, TipoCargosResponse } from '../models/tipo-cargo.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class TipoCargoService {
  private apiUrl = `${environment.apiUrl}/api/rol-cargo/v1`;

  // Catalogo de roles/cargos: cambia poco, se cachea y se invalida en cada mutacion.
  private tipoCargosCache$?: Observable<ApiResponse<TipoCargo[]>>;
  private tipoCargosColaboradoresCache$?: Observable<ApiResponse<TipoCargo[]>>;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los tipos de cargo (con cache compartido entre suscriptores)
   * @returns lista de tipos de cargo
   */
  getTipoCargos(): Observable<ApiResponse<TipoCargo[]>> {
    if (!this.tipoCargosCache$) {
      this.tipoCargosCache$ = this.http.get<ApiResponse<TipoCargo[]>>(`${this.apiUrl}/findall`).pipe(
        catchError(err => { this.tipoCargosCache$ = undefined; return throwError(() => err); }),
        shareReplay(1)
      );
    }
    return this.tipoCargosCache$;
  }

  /**
   * Obtiene todos los tipos de cargo para colaboradores (accesible por pastores)
   */
  getTipoCargosParaColaboradores(): Observable<ApiResponse<TipoCargo[]>> {
    if (!this.tipoCargosColaboradoresCache$) {
      this.tipoCargosColaboradoresCache$ = this.http.get<ApiResponse<TipoCargo[]>>(`${this.apiUrl}/findall-cargo`).pipe(
        catchError(err => { this.tipoCargosColaboradoresCache$ = undefined; return throwError(() => err); }),
        shareReplay(1)
      );
    }
    return this.tipoCargosColaboradoresCache$;
  }

  /** Invalida el cache de tipos de cargo; llamar tras cualquier mutacion. */
  private invalidateCache(): void {
    this.tipoCargosCache$ = undefined;
    this.tipoCargosColaboradoresCache$ = undefined;
  }

  /**
   * Obtiene un tipo de cargo por id
   * @param id id del tipo de cargo
   * @returns tipo de cargo encontrado
   */
  getTipoCargoById(id: number): Observable<TipoCargoResponse> {
    return this.http.get<TipoCargoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  /**
   * Crea un tipo de cargo
   * @param tipoCargo tipo de cargo a crear
   * @returns tipo de cargo creado
   */
  createTipoCargo(tipoCargo: TipoCargo): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, tipoCargo).pipe(tap(() => this.invalidateCache()));
  }

  /**
   * Actualiza un tipo de cargo
   * @param tipoCargo tipo de cargo a actualizar
   * @returns tipo de cargo actualizado
   */
  updateTipoCargo(tipoCargo: TipoCargo): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, tipoCargo).pipe(tap(() => this.invalidateCache()));
  }

  /**
   * Cambia el estado de un tipo de cargo
   * @param id id del tipo de cargo
   * @returns true si se cambio el estado
   */
  toggleEstado(id: number): Observable<ApiResponse<TipoCargo>> {
    return this.http.put<ApiResponse<TipoCargo>>(`${this.apiUrl}/estado/${id}`, {}).pipe(tap(() => this.invalidateCache()));
  }

  deleteTipoCargo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`).pipe(tap(() => this.invalidateCache()));
  }
}
