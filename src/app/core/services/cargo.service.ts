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

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getCargos(): Observable<CargosResponse> {
    return this.http.get<CargosResponse>(`${this.apiUrl}/findall`, { headers: this.getHeaders() });
  }

  getCargoById(id: number): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(`${this.apiUrl}/showbyid/${id}`, { headers: this.getHeaders() });
  }

  createCargo(cargo: Partial<Cargo>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, cargo, { headers: this.getHeaders() });
  }

  updateCargo(cargo: Partial<Cargo>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, cargo, { headers: this.getHeaders() });
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {}, { headers: this.getHeaders() });
  }
}
