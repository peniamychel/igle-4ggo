import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Iglesia, IglesiaResponse, IglesiaDetail, IglesiasResponse } from '../models/iglesia.model';
import { Persona } from '../models/persona.model';
import { ApiResponse } from '../models/interfaces/api.response';


@Injectable({
  providedIn: 'root'
})
export class IglesiaService {
  private apiUrl = `${environment.apiUrl}/api/iglesia/v1`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getIglesias(): Observable<ApiResponse<[Iglesia]>> {
    const url = `${this.apiUrl}/findall`;
    return this.http.get<ApiResponse<[Iglesia]>>(url, { headers: this.getHeaders() });
  }

  getIglesiaById(id: number): Observable<IglesiaDetail> {
    return this.http.get<IglesiaDetail>(`${this.apiUrl}/showbyid/${id}`, { headers: this.getHeaders() });
  }

  createIglesia(iglesia: Iglesia): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, iglesia, { headers: this.getHeaders() });
  }

  updateIglesia(iglesia: Iglesia): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, iglesia, { headers: this.getHeaders() });
  }


  updateIglesia2(iglesia: Iglesia): Observable<ApiResponse<Iglesia>> {
    const url = `${this.apiUrl}/update2/${iglesia.id}`;
    return this.http.put<ApiResponse<Iglesia>>(url, iglesia, { headers: this.getHeaders() });
  }



  toggleEstado(id: number): Observable<boolean> {
    const url = `${this.apiUrl}/estado/${id}`;
    return this.http.put<boolean>(url, {}, { headers: this.getHeaders() });
  }

  /*busca el nombre de una igleia si ya existe*/
  buscarNombreIglesia(nameIglesia: string): Observable<Iglesia> {
    return this.http.get<Iglesia>(`${this.apiUrl}/showbynombreiglesia/${nameIglesia}`, { headers: this.getHeaders() });
  }
  buscarNombreIglesiaExeptoId(nameIglesia: string, id: number): Observable<Iglesia> {   //showbynombreiglesiaexceptoid/{nameIglesia}/{id}
    return this.http.get<Iglesia>(`${this.apiUrl}/showbynombreiglesiaexceptoid/${nameIglesia}/${id}`, { headers: this.getHeaders() });
  }

}
