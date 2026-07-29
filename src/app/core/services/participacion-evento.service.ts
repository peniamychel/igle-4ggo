import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParticipacionEvento, ParticipacionEventoResponse, ParticipacionesEventoResponse } from '../models/participacion-evento.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class ParticipacionEventoService {
  private apiUrl = `${environment.apiUrl}/api/participacion-evento/v1`;

  constructor(private http: HttpClient) { }

  getParticipaciones(): Observable<ApiResponse<ParticipacionEvento[]>> {
    return this.http.get<ApiResponse<ParticipacionEvento[]>>(`${this.apiUrl}/findall`);
  }

  getParticipacionById(id: number): Observable<ParticipacionEventoResponse> {
    return this.http.get<ParticipacionEventoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createParticipacion(participacion: ParticipacionEvento): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, participacion);
  }

  updateParticipacion(participacion: ParticipacionEvento): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, participacion);
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {});
  }

  toggleEntregado(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/entregado/${id}`, {});
  }

  /**
   * Asienta la entrega con libro y folio. Es el único punto que marca una
   * participación como entregada: se llama al generar el PDF del certificado.
   */
  registrarEntrega(id: number, certificadoId: number, numeroLibro: string, numeroFolio: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/entregar/${id}`, { certificadoId, numeroLibro, numeroFolio });
  }

  deleteParticipacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
