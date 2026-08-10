import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PlantillaCertificadoService } from './plantilla-certificado.service';
import { environment } from '../../../environments/environment';

/**
 * Su ruta base rompe el patrón `/api/<recurso>/v1` que usan el resto de los
 * servicios (acá es `/api/v1/<recurso>`) — se confirmó contra
 * PlantillaCertificadoController.java que el backend usa exactamente esa
 * misma ruta, así que no es un bug: es sólo una inconsistencia de estilo.
 */
describe('PlantillaCertificadoService', () => {
  let service: PlantillaCertificadoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/v1/plantilla-certificado`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PlantillaCertificadoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('findAll: GET a la raíz del recurso, sin sufijo', () => {
    service.findAll().subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('findById: GET con el id como último segmento', () => {
    service.findById(1).subscribe();
    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create: POST a la raíz del recurso', () => {
    const plantilla = { nombre: 'Estándar' } as any;
    service.create(plantilla).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(plantilla);
    req.flush({});
  });

  it('update: PUT con el id en la ruta', () => {
    service.update(1, { nombre: 'Estándar' } as any).subscribe();
    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('changeState: PUT a /estado/:id, no confundir con update', () => {
    service.changeState(1).subscribe();
    const req = httpMock.expectOne(`${base}/estado/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('delete: DELETE con el id como último segmento', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
