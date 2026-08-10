import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ActivoService } from './activo.service';
import { environment } from '../../../environments/environment';

/** CRUD puro, sin caché ni transformaciones: se confirma verbo, ruta y body de cada endpoint. */
describe('ActivoService', () => {
  let service: ActivoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/activo/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ActivoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getActivos: GET a /findall', () => {
    service.getActivos().subscribe();
    const req = httpMock.expectOne(`${base}/findall`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getActivosByIglesia: interpola el id de la iglesia', () => {
    service.getActivosByIglesia(3).subscribe();
    const req = httpMock.expectOne(`${base}/iglesia/3`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createActivo: POST con el activo como body', () => {
    const activo = { nombre: 'Proyector' };
    service.createActivo(activo).subscribe();
    const req = httpMock.expectOne(`${base}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(activo);
    req.flush({});
  });

  it('updateActivo: PUT a /update', () => {
    service.updateActivo({ id: 1, nombre: 'Proyector' }).subscribe();
    const req = httpMock.expectOne(`${base}/update`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deleteActivo: DELETE con el id en la ruta', () => {
    service.deleteActivo(1).subscribe();
    const req = httpMock.expectOne(`${base}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('uploadFoto: POST multipart bajo la clave "file"', () => {
    const file = new File(['x'], 'foto.jpg');
    service.uploadFoto(1, file).subscribe();
    const req = httpMock.expectOne(`${base}/1/foto`);
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush({});
  });

  it('deleteFoto: DELETE', () => {
    service.deleteFoto(1).subscribe();
    const req = httpMock.expectOne(`${base}/1/foto`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
