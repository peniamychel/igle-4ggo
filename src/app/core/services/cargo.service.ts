import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cargo, CargoResponse, CargosResponse } from '../models/cargo.model';

@Injectable({
  providedIn: 'root'
})
export class CargoService {
  private apiUrl = `${environment.apiUrl}/api/cargo/v1`;

  /**
   * Constructor del servicio
   * @param http HttpClient para realizar las peticiones a la API
   */
  constructor(private http: HttpClient) { }

  /**
   * Obtiene los headers con el token
   * @returns headers con el token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Obtiene todos los cargos
   * @returns lista de cargos
   */
  getCargos(): Observable<CargosResponse> {
    return this.http.get<CargosResponse>(`${this.apiUrl}/findall`, { headers: this.getHeaders() });
  }

  /**
   * Obtiene un cargo por id
   * @param id id del cargo
   * @returns cargo encontrado
   */
  getCargoById(id: number): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(`${this.apiUrl}/showbyid/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Crea un cargo
   * @param cargo cargo a crear
   * @returns cargo creado
   */
  createCargo(cargo: Partial<Cargo>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, cargo, { headers: this.getHeaders() });
  }

  /**
   * Actualiza un cargo
   * @param cargo cargo a actualizar
   * @returns cargo actualizado
   */
  updateCargo(cargo: Partial<Cargo>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, cargo, { headers: this.getHeaders() });
  }

  /**
   * Cambia el estado de un cargo
   * @param id id del cargo
   * @returns true si se cambio el estado
   */
  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {}, { headers: this.getHeaders() });
  }
}
