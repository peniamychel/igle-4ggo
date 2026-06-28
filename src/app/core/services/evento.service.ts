import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evento, EventoResponse, EventosResponse } from '../models/evento.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private apiUrl = `${environment.apiUrl}/api/evento/v1`;

  constructor(private http: HttpClient) { }

  getEventos(): Observable<ApiResponse<Evento[]>> {
    return this.http.get<ApiResponse<Evento[]>>(`${this.apiUrl}/findall`);
  }

  getEventoById(id: number): Observable<EventoResponse> {
    return this.http.get<EventoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createEvento(evento: Evento): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, evento);
  }

  updateEvento(evento: Evento): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, evento);
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {});
  }

  deleteEvento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  cloneYearEvents(fromYear: number, toYear: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/clonar?from=${fromYear}&to=${toYear}`, {});
  }
}
