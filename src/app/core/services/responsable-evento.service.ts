import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponsableEvento, ResponsableEventoResponse, ResponsablesEventoResponse } from '../models/responsable-evento.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class ResponsableEventoService {
  private apiUrl = `${environment.apiUrl}/api/responsable-evento/v1`;

  constructor(private http: HttpClient) { }

  getResponsables(): Observable<ApiResponse<ResponsableEvento[]>> {
    return this.http.get<ApiResponse<ResponsableEvento[]>>(`${this.apiUrl}/findall`);
  }

  getResponsableById(id: number): Observable<ResponsableEventoResponse> {
    return this.http.get<ResponsableEventoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createResponsable(responsable: ResponsableEvento): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, responsable);
  }

  updateResponsable(responsable: ResponsableEvento): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, responsable);
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {});
  }

  deleteResponsable(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
