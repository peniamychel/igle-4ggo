import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TipoCargo, TipoCargoResponse, TipoCargosResponse } from '../models/tipo-cargo.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class TipoCargoService {
  private apiUrl = `${environment.apiUrl}/api/tipocargo/v1`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Obtiene todos los tipos de cargo
   * @returns lista de tipos de cargo
   */
  getTipoCargos(): Observable<ApiResponse<TipoCargo[]>> {
    return this.http.get<ApiResponse<TipoCargo[]>>(
      `${this.apiUrl}/findall`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene un tipo de cargo por id
   * @param id id del tipo de cargo
   * @returns tipo de cargo encontrado
   */
  getTipoCargoById(id: number): Observable<TipoCargoResponse> {
    return this.http.get<TipoCargoResponse>(
      `${this.apiUrl}/showbyid/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crea un tipo de cargo
   * @param tipoCargo tipo de cargo a crear
   * @returns tipo de cargo creado
   */
  createTipoCargo(tipoCargo: TipoCargo): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create`,
      tipoCargo,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualiza un tipo de cargo
   * @param tipoCargo tipo de cargo a actualizar
   * @returns tipo de cargo actualizado
   */
  updateTipoCargo(tipoCargo: TipoCargo): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update`,
      tipoCargo,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cambia el estado de un tipo de cargo
   * @param id id del tipo de cargo
   * @returns true si se cambio el estado
   */
  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.apiUrl}/estado/${id}`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
