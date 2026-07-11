import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EventoAceptacion } from '../models/evento-aceptacion.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class EventoAceptacionService {
  private apiUrl = `${environment.apiUrl}/api/evento-aceptacion/v1`;

  constructor(private http: HttpClient) { }

  decidir(dto: EventoAceptacion): Observable<ApiResponse<EventoAceptacion>> {
    return this.http.post<ApiResponse<EventoAceptacion>>(`${this.apiUrl}/decidir`, dto);
  }

  getDecisionesPorIglesia(iglesiaId: number): Observable<ApiResponse<EventoAceptacion[]>> {
    return this.http.get<ApiResponse<EventoAceptacion[]>>(`${this.apiUrl}/iglesia/${iglesiaId}`);
  }

  getDecisionPorEventoYIglesia(eventoId: number, iglesiaId: number): Observable<ApiResponse<EventoAceptacion>> {
    return this.http.get<ApiResponse<EventoAceptacion>>(`${this.apiUrl}/evento/${eventoId}/iglesia/${iglesiaId}`);
  }
}
