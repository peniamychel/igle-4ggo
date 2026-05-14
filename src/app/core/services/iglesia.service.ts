import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Iglesia, IglesiaResponse, IglesiaDetail, IglesiasResponse } from '../models/iglesia.model';
import { ApiResponse } from '../models/interfaces/api.response';


@Injectable({
  providedIn: 'root'
})

export class IglesiaService {

  private apiUrl = `${environment.apiUrl}/api/iglesia/v1`;

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
   * Obtiene todas las iglesias
   * @returns lista de iglesias
   */
  getIglesias(): Observable<ApiResponse<[Iglesia]>> {
    const url = `${this.apiUrl}/findall`;
    return this.http.get<ApiResponse<[Iglesia]>>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtiene una iglesia por id
   * @param id id de la iglesia
   * @returns iglesia encontrada
   */
  getIglesiaById(id: number): Observable<IglesiaDetail> {
    return this.http.get<IglesiaDetail>(`${this.apiUrl}/showbyid/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Crea una iglesia
   * @param iglesia iglesia a crear
   * @returns iglesia creada
   */
  createIglesia(iglesia: Iglesia): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, iglesia, { headers: this.getHeaders() });
  }

  /**
   * Actualiza una iglesia
   * @param iglesia iglesia a actualizar
   * @returns iglesia actualizada
   */
  updateIglesia(iglesia: Iglesia): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, iglesia, { headers: this.getHeaders() });
  }

  /**
   * Actualiza una iglesia
   * @param iglesia iglesia a actualizar
   * @returns iglesia actualizada
   */
  updateIglesia2(iglesia: Iglesia): Observable<ApiResponse<Iglesia>> {
    const url = `${this.apiUrl}/update2/${iglesia.id}`;
    return this.http.put<ApiResponse<Iglesia>>(url, iglesia, { headers: this.getHeaders() });
  }

  /**
   * Cambia el estado de una iglesia
   * @param id id de la iglesia
   * @returns true si se cambio el estado
   */
  toggleEstado(id: number): Observable<boolean> {
    const url = `${this.apiUrl}/estado/${id}`;
    return this.http.put<boolean>(url, {}, { headers: this.getHeaders() });
  }

  /**
   * Busca el nombre de una iglesia si ya existe
   * @param nameIglesia nombre de la iglesia a buscar
   * @returns iglesia encontrada
   */
  buscarNombreIglesia(nameIglesia: string): Observable<Iglesia> {
    return this.http.get<Iglesia>(`${this.apiUrl}/showbynombreiglesia/${nameIglesia}`, { headers: this.getHeaders() });
  }

  /**
   * Busca el nombre de una iglesia si ya existe pero excepto al id enviado
   * @param nameIglesia nombre de la iglesia a buscar
   * @param id id de la iglesia a excluir
   * @returns iglesia encontrada
   */
  buscarNombreIglesiaExeptoId(nameIglesia: string, id: number): Observable<Iglesia> {
    return this.http.get<Iglesia>(`${this.apiUrl}/showbynombreiglesiaexceptoid/${nameIglesia}/${id}`, { headers: this.getHeaders() });
  }

}
