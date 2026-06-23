import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
   * Obtiene todos los cargos
   * @returns lista de cargos
   */
  getCargos(): Observable<CargosResponse> {
    return this.http.get<CargosResponse>(`${this.apiUrl}/findall`);
  }

  /**
   * Obtiene un cargo por id
   * @param id id del cargo
   * @returns cargo encontrado
   */
  getCargoById(id: number): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  /**
   * Crea un cargo
   * @param cargo cargo a crear
   * @returns cargo creado
   */
  createCargo(cargo: Partial<Cargo>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, cargo);
  }

  /**
   * Actualiza un cargo
   * @param cargo cargo a actualizar
   * @returns cargo actualizado
   */
  updateCargo(cargo: Partial<Cargo>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, cargo);
  }

  /**
   * Cambia el estado de un cargo
   * @param id id del cargo
   * @param fechaFin fecha de fin opcional (formato yyyy-MM-dd)
   * @returns true si el nuevo estado es activo, false si es inactivo
   */
  toggleEstado(id: number, fechaFin?: string): Observable<boolean> {
    let url = `${this.apiUrl}/estado/${id}`;
    if (fechaFin) {
      url += `?fechaFin=${fechaFin}`;
    }
    return this.http.put<boolean>(url, {});
  }

  /**
   * Sube el acta de asignación para un cargo
   * @param id id del cargo
   * @param file archivo a subir
   * @returns URL del archivo subido
   */
  uploadActaAsignacion(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/acta-asignacion`, formData);
  }

  /**
   * Sube el acta de deslindación para un cargo
   * @param id id del cargo
   * @param file archivo a subir
   * @returns URL del archivo subido
   */
  uploadActaDeslindacion(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/acta-deslindacion`, formData);
  }

  /**
   * Elimina un cargo
   * @param id id del cargo
   */
  deleteCargo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
