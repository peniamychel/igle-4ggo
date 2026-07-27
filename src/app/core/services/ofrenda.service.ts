import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ofrenda, OfrendaResumen } from '../models/ofrenda.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class OfrendaService {
  private apiUrl = `${environment.apiUrl}/api/ofrenda/v1`;

  constructor(private http: HttpClient) { }

  getOfrendas(): Observable<ApiResponse<Ofrenda[]>> {
    return this.http.get<ApiResponse<Ofrenda[]>>(`${this.apiUrl}/findall`);
  }

  getOfrendaById(id: number): Observable<ApiResponse<Ofrenda>> {
    return this.http.get<ApiResponse<Ofrenda>>(`${this.apiUrl}/showbyid/${id}`);
  }

  createOfrenda(ofrenda: Ofrenda): Observable<ApiResponse<Ofrenda>> {
    return this.http.post<ApiResponse<Ofrenda>>(`${this.apiUrl}/create`, ofrenda);
  }

  updateOfrenda(ofrenda: Ofrenda): Observable<ApiResponse<Ofrenda>> {
    return this.http.put<ApiResponse<Ofrenda>>(`${this.apiUrl}/update`, ofrenda);
  }

  deleteOfrenda(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/delete/${id}`);
  }

  getOfrendasByPeriod(start: string, end: string): Observable<ApiResponse<Ofrenda[]>> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<ApiResponse<Ofrenda[]>>(`${this.apiUrl}/periodo`, { params });
  }

  getResumenPeriodo(start: string, end: string, iglesiaId?: number): Observable<ApiResponse<OfrendaResumen>> {
    let params = new HttpParams().set('start', start).set('end', end);
    if (iglesiaId) {
      params = params.set('iglesiaId', iglesiaId.toString());
    }
    return this.http.get<ApiResponse<OfrendaResumen>>(`${this.apiUrl}/resumen-periodo`, { params });
  }
}
