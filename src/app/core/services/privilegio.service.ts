import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrivilegioDto, PrivilegioResponse } from '../models/interfaces/privilegio.interface';

@Injectable({
  providedIn: 'root'
})
export class PrivilegioService {
  private apiUrl = `${environment.apiUrl}/api/privilegios/v1`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAll(): Observable<PrivilegioDto[]> {
    return this.http.get<PrivilegioDto[]>(`${this.apiUrl}/findall`, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<PrivilegioDto> {
    return this.http.get<PrivilegioDto>(`${this.apiUrl}/showbyid/${id}`, { headers: this.getHeaders() });
  }

  create(dto: PrivilegioDto): Observable<PrivilegioDto> {
    return this.http.post<PrivilegioDto>(`${this.apiUrl}/create`, dto, { headers: this.getHeaders() });
  }

  update(id: number, dto: PrivilegioDto): Observable<PrivilegioDto> {
    return this.http.put<PrivilegioDto>(`${this.apiUrl}/update/${id}`, dto, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`, { headers: this.getHeaders() });
  }

  getPrivilegiosByRolCargo(rolCargoId: number): Observable<PrivilegioResponse[]> {
    return this.http.get<PrivilegioResponse[]>(`${this.apiUrl}/rol-cargo/${rolCargoId}/privilegios`, { headers: this.getHeaders() });
  }

  addPrivilegioToRolCargo(rolCargoId: number, privilegioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rol-cargo/${rolCargoId}/add/${privilegioId}`, {}, { headers: this.getHeaders() });
  }

  removePrivilegioFromRolCargo(rolCargoId: number, privilegioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rol-cargo/${rolCargoId}/remove/${privilegioId}`, { headers: this.getHeaders() });
  }
}
