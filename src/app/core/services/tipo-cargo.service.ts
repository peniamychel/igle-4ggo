import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TipoCargo, TipoCargoResponse, TipoCargosResponse } from '../models/tipo-cargo.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class TipoCargoService {
  private apiUrl = `${environment.apiUrl}/api/rol-cargo/v1`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los tipos de cargo
   * @returns lista de tipos de cargo
   */
  getTipoCargos(): Observable<ApiResponse<TipoCargo[]>> {
    return this.http.get<ApiResponse<TipoCargo[]>>(`${this.apiUrl}/findall`);
  }

  /**
   * Obtiene todos los tipos de cargo para colaboradores (accesible por pastores)
   */
  getTipoCargosParaColaboradores(): Observable<ApiResponse<TipoCargo[]>> {
    return this.http.get<ApiResponse<TipoCargo[]>>(`${this.apiUrl}/findall-cargo`);
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
    return this.http.post(`${this.apiUrl}/create`, tipoCargo);
  }

  /**
   * Actualiza un tipo de cargo
   * @param tipoCargo tipo de cargo a actualizar
   * @returns tipo de cargo actualizado
   */
  updateTipoCargo(tipoCargo: TipoCargo): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, tipoCargo);
  }

  /**
   * Cambia el estado de un tipo de cargo
   * @param id id del tipo de cargo
   * @returns true si se cambio el estado
   */
  toggleEstado(id: number): Observable<ApiResponse<TipoCargo>> {
    return this.http.put<ApiResponse<TipoCargo>>(`${this.apiUrl}/estado/${id}`, {});
  }

  deleteTipoCargo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
