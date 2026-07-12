import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Iglesia, IglesiaDetail } from '../models/iglesia.model';
import { ApiResponse } from '../models/interfaces/api.response';


@Injectable({
  providedIn: 'root'
})

export class IglesiaService {

  private apiUrl = `${environment.apiUrl}/api/iglesia/v1`;

  // Cache del catalogo de iglesias: cambia poco, se reutiliza entre componentes
  // en vez de re-pedirlo en cada navegacion. Se invalida en cada mutacion.
  private iglesiasCache$?: Observable<ApiResponse<[Iglesia]>>;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las iglesias (con cache compartido entre suscriptores)
   * @returns lista de iglesias
   */
  getIglesias(): Observable<ApiResponse<[Iglesia]>> {
    if (!this.iglesiasCache$) {
      const url = `${this.apiUrl}/findall`;
      this.iglesiasCache$ = this.http.get<ApiResponse<[Iglesia]>>(url).pipe(shareReplay(1));
    }
    return this.iglesiasCache$;
  }

  /** Invalida el cache de iglesias; llamar tras cualquier mutacion. */
  private invalidateCache(): void {
    this.iglesiasCache$ = undefined;
  }

  /**
   * Obtiene una iglesia por id
   * @param id id de la iglesia
   * @returns iglesia encontrada
   */
  getIglesiaById(id: number): Observable<IglesiaDetail> {
    return this.http.get<IglesiaDetail>(`${this.apiUrl}/showbyid/${id}`);
  }

  /**
   * Crea una iglesia
   * @param iglesia iglesia a crear
   * @returns iglesia creada
   */
  createIglesia(iglesia: Iglesia): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, iglesia).pipe(tap(() => this.invalidateCache()));
  }

  /**
   * Actualiza una iglesia
   * @param iglesia iglesia a actualizar
   * @returns iglesia actualizada
   */
  updateIglesia(iglesia: Iglesia): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, iglesia).pipe(tap(() => this.invalidateCache()));
  }

  /**
   * Actualiza una iglesia
   * @param iglesia iglesia a actualizar
   * @returns iglesia actualizada
   */
  updateIglesia2(iglesia: Iglesia): Observable<ApiResponse<Iglesia>> {
    const url = `${this.apiUrl}/update2/${iglesia.id}`;
    return this.http.put<ApiResponse<Iglesia>>(url, iglesia).pipe(tap(() => this.invalidateCache()));
  }

  /**
   * Cambia el estado de una iglesia
   * @param id id de la iglesia
   * @returns true si se cambio el estado
   */
  toggleEstado(id: number): Observable<any> {
    const url = `${this.apiUrl}/estado/${id}`;
    return this.http.put<any>(url, {}).pipe(tap(() => this.invalidateCache()));
  }

  /**
   * Busca el nombre de una iglesia si ya existe
   * @param nameIglesia nombre de la iglesia a buscar
   * @returns iglesia encontrada
   */
  buscarNombreIglesia(nameIglesia: string): Observable<Iglesia> {
    return this.http.get<Iglesia>(`${this.apiUrl}/showbynombreiglesia/${nameIglesia}`);
  }

  /**
   * Busca el nombre de una iglesia si ya existe pero excepto al id enviado
   * @param nameIglesia nombre de la iglesia a buscar
   * @param id id de la iglesia a excluir
   * @returns iglesia encontrada
   */
  buscarNombreIglesiaExeptoId(nameIglesia: string, id: number): Observable<Iglesia> {
    return this.http.get<Iglesia>(`${this.apiUrl}/showbynombreiglesiaexceptoid/${nameIglesia}/${id}`);
  }

  uploadFoto(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/foto`, formData).pipe(tap(() => this.invalidateCache()));
  }

  deleteFoto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/foto`).pipe(tap(() => this.invalidateCache()));
  }

  updateOrden(ids: number[]): Observable<ApiResponse<void>> {
    const url = `${this.apiUrl}/update-orden`;
    return this.http.put<ApiResponse<void>>(url, ids).pipe(tap(() => this.invalidateCache()));
  }

  deleteIglesia(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/delete/${id}`).pipe(tap(() => this.invalidateCache()));
  }

}
