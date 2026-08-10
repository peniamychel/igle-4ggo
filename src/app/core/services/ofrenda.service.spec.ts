import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { OfrendaService } from './ofrenda.service';
import { environment } from '../../../environments/environment';

/**
 * getOfrendasByPeriod y getResumenPeriodo son los endpoints identificados en
 * la revisión de seguridad del backend como susceptibles al 500-en-vez-de-400
 * cuando falta el query param requerido (GlobalExceptionHandler no maneja
 * MissingServletRequestParameterException todavía). Acá se confirma que el
 * FRONTEND, al menos, siempre construye la URL con start y end presentes —
 * la firma TypeScript los exige como string, no como opcionales — así que
 * esa clase de 500 sólo se dispararía si alguien más golpea el endpoint
 * directamente (Postman, otro cliente), no por este servicio.
 */
describe('OfrendaService', () => {
  let service: OfrendaService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/ofrenda/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(OfrendaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getOfrendasByPeriod', () => {

    it('siempre manda start y end como query params', () => {
      service.getOfrendasByPeriod('2026-01-01', '2026-01-31').subscribe();

      const req = httpMock.expectOne(`${base}/periodo?start=2026-01-01&end=2026-01-31`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getResumenPeriodo', () => {

    it('sin iglesiaId, el query param no se agrega', () => {
      service.getResumenPeriodo('2026-01-01', '2026-01-31').subscribe();

      const req = httpMock.expectOne(`${base}/resumen-periodo?start=2026-01-01&end=2026-01-31`);
      expect(req.request.urlWithParams).not.toContain('iglesiaId');
      req.flush({});
    });

    it('con iglesiaId, se agrega como tercer query param', () => {
      service.getResumenPeriodo('2026-01-01', '2026-01-31', 5).subscribe();

      const req = httpMock.expectOne(`${base}/resumen-periodo?start=2026-01-01&end=2026-01-31&iglesiaId=5`);
      expect(req.request.urlWithParams).toContain('iglesiaId=5');
      req.flush({});
    });

    it('iglesiaId=0 es falsy: el query param NO se agrega (mismo patrón de riesgo ya visto en otros servicios)', () => {
      service.getResumenPeriodo('2026-01-01', '2026-01-31', 0).subscribe();

      const req = httpMock.expectOne(`${base}/resumen-periodo?start=2026-01-01&end=2026-01-31`);
      expect(req.request.urlWithParams).not.toContain('iglesiaId');
      req.flush({});
    });
  });

  it('createOfrenda: POST con la ofrenda como body', () => {
    const ofrenda = { monto: 100 };
    service.createOfrenda(ofrenda as any).subscribe();
    const req = httpMock.expectOne(`${base}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(ofrenda);
    req.flush({});
  });

  it('deleteOfrenda: DELETE con el id en la ruta', () => {
    service.deleteOfrenda(3).subscribe();
    const req = httpMock.expectOne(`${base}/delete/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
