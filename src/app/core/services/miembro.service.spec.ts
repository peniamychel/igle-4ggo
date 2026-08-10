import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MiembroService } from './miembro.service';
import { environment } from '../../../environments/environment';

/**
 * getMiembrosPaged() construye la URL a mano en vez de usar HttpParams, y es
 * justo el servicio que dispara el default de la lista de Miembros — el que
 * alimentó el bug de INNER JOIN encontrado en MiembroDao (ver memoria del
 * proyecto). Lo relevante para probar es la condición de omisión de cada
 * parámetro: con qué valores el filtro SÍ y NO termina en la URL, porque de
 * eso depende qué recibe el backend como `null` vs un valor real.
 */
describe('MiembroService', () => {
  let service: MiembroService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/miembro/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MiembroService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getMiembrosPaged: qué se manda y qué se omite', () => {

    it('con todos los valores por defecto, la URL NO lleva searchText, estado ni iglesiaNombre', () => {
      // Éste es el request real de la carga inicial de /miembro: sin filtros
      // tocados. iglesiaNombre='all' NO viaja como texto "all" — se omite,
      // igual que estado indefinido. El backend recibe null en los tres.
      service.getMiembrosPaged().subscribe();

      const req = httpMock.expectOne(`${base}/findall/paged?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], totalElements: 0 });
    });

    it('searchText vacío se omite; con contenido va urlencodeado', () => {
      service.getMiembrosPaged(0, 10, '').subscribe();
      expect(httpMock.expectOne(`${base}/findall/paged?page=0&size=10`).request.method).toBe('GET');

      service.getMiembrosPaged(0, 10, 'Perez Ñ').subscribe();
      const url = `${base}/findall/paged?page=0&size=10&searchText=${encodeURIComponent('Perez Ñ')}`;
      expect(httpMock.expectOne(url).request.url).toContain('searchText');
    });

    it('estado=false SÍ viaja: si se tratara como "falsy" se perdería el filtro de inactivos', () => {
      // El bug clásico de construir URLs a mano: `if (estado)` hubiera omitido
      // el false. Acá está bien hecho (`!== undefined`), pero es exactamente
      // el tipo de regresión silenciosa que hay que fijar con un test.
      service.getMiembrosPaged(0, 10, '', false).subscribe();

      const req = httpMock.expectOne(`${base}/findall/paged?page=0&size=10&estado=false`);
      expect(req.request.urlWithParams).toContain('estado=false');
    });

    it('estado=true también viaja', () => {
      service.getMiembrosPaged(0, 10, '', true).subscribe();

      const req = httpMock.expectOne(`${base}/findall/paged?page=0&size=10&estado=true`);
      expect(req.request.urlWithParams).toContain('estado=true');
    });

    it('estado indefinido (no tocar el filtro) se omite', () => {
      service.getMiembrosPaged(0, 10, '', undefined).subscribe();

      const req = httpMock.expectOne(`${base}/findall/paged?page=0&size=10`);
      expect(req.request.urlWithParams).not.toContain('estado');
    });

    it('iglesiaNombre real se manda urlencodeado', () => {
      service.getMiembrosPaged(0, 10, '', undefined, 'Palmar Ñ').subscribe();

      const url = `${base}/findall/paged?page=0&size=10&iglesiaNombre=${encodeURIComponent('Palmar Ñ')}`;
      expect(httpMock.expectOne(url).request.urlWithParams).toContain('iglesiaNombre');
    });

    it('iglesiaNombre="all" y cadena vacía se omiten por igual', () => {
      service.getMiembrosPaged(0, 10, '', undefined, 'all').subscribe();
      expect(httpMock.expectOne(`${base}/findall/paged?page=0&size=10`).request.urlWithParams)
        .not.toContain('iglesiaNombre');

      service.getMiembrosPaged(0, 10, '', undefined, '').subscribe();
      expect(httpMock.expectOne(`${base}/findall/paged?page=0&size=10`).request.urlWithParams)
        .not.toContain('iglesiaNombre');
    });

    it('page y size no son opcionales: siempre viajan, incluso en 0', () => {
      service.getMiembrosPaged(2, 25).subscribe();

      const req = httpMock.expectOne(`${base}/findall/paged?page=2&size=25`);
      expect(req.request.urlWithParams).toContain('page=2');
      expect(req.request.urlWithParams).toContain('size=25');
    });

    it('con los cuatro filtros a la vez, el orden es page&size&searchText&estado&iglesiaNombre', () => {
      service.getMiembrosPaged(1, 20, 'carlos', true, 'Palmar').subscribe();

      const req = httpMock.expectOne(
        `${base}/findall/paged?page=1&size=20&searchText=carlos&estado=true&iglesiaNombre=Palmar`
      );
      expect(req.request.method).toBe('GET');
    });
  });

  describe('otros endpoints: construcción de URL/verbo/body', () => {

    it('getMiembros: GET a /findall', () => {
      service.getMiembros().subscribe();
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getMiembroById: interpola el id en la ruta', () => {
      service.getMiembroById(42).subscribe();
      const req = httpMock.expectOne(`${base}/showbyid/42`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('createMiembro: POST con el objeto como body', () => {
      const miembro = { nombre: 'Carlos' };
      service.createMiembro(miembro).subscribe();
      const req = httpMock.expectOne(`${base}/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(miembro);
      req.flush({});
    });

    it('updateMiembro: PUT a /update, no lleva el id en la ruta', () => {
      service.updateMiembro({ id: 1, nombre: 'Carlos' }).subscribe();
      const req = httpMock.expectOne(`${base}/update`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('toggleEstado: PUT con body vacío', () => {
      service.toggleEstado(5).subscribe();
      const req = httpMock.expectOne(`${base}/estado/5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({});
    });

    it('uploadPhoto: POST multipart con el archivo bajo la clave "file"', () => {
      const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
      service.uploadPhoto(7, file).subscribe();

      const req = httpMock.expectOne(`${base}/7/foto`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).get('file')).toBe(file);
      req.flush({});
    });

    it('deletePhoto: DELETE', () => {
      service.deletePhoto(7).subscribe();
      const req = httpMock.expectOne(`${base}/7/foto`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('buscarCi: interpola el CI en la ruta', () => {
      service.buscarCi('12345678').subscribe();
      const req = httpMock.expectOne(`${base}/buscarci/12345678`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('deleteMiembro: DELETE con el id en la ruta', () => {
      service.deleteMiembro(9).subscribe();
      const req = httpMock.expectOne(`${base}/delete/9`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('importExcel: sin iglesiaId, el query param NO se agrega', () => {
      const file = new File(['x'], 'm.xlsx');
      service.importExcel(file).subscribe();

      const req = httpMock.expectOne(`${base}/importar`);
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush({});
    });

    it('importExcel: con iglesiaId, se agrega como query param', () => {
      const file = new File(['x'], 'm.xlsx');
      service.importExcel(file, 3).subscribe();

      const req = httpMock.expectOne(`${base}/importar?iglesiaId=3`);
      expect(req.request.urlWithParams).toContain('iglesiaId=3');
      req.flush({});
    });

    it('importExcel: iglesiaId=0 es falsy, así que el query param NO se agrega (mismo patrón de riesgo que estado)', () => {
      // A diferencia de getMiembrosPaged (que usa !== undefined para estado),
      // acá el chequeo es `if (iglesiaId)`. Un id real 0 es imposible en la
      // práctica (IDENTITY empieza en 1), así que hoy es inofensivo — pero se
      // fija con test porque es la misma clase de bug que si algún día
      // cambiara la semántica de "sin iglesia" a 0 en vez de ausente.
      const file = new File(['x'], 'm.xlsx');
      service.importExcel(file, 0).subscribe();

      const req = httpMock.expectOne(`${base}/importar`);
      expect(req.request.urlWithParams).not.toContain('iglesiaId');
      req.flush({});
    });

    it('downloadTemplate: pide un blob, no JSON', () => {
      service.downloadTemplate().subscribe();
      const req = httpMock.expectOne(`${base}/plantilla`);
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob());
    });

    it('getMiembrosSinIglesia y getMiembrosSinIglesiaParaAsignacion: rutas fijas distintas', () => {
      service.getMiembrosSinIglesia().subscribe();
      expect(httpMock.expectOne(`${base}/sin-iglesia`).request.method).toBe('GET');

      service.getMiembrosSinIglesiaParaAsignacion().subscribe();
      expect(httpMock.expectOne(`${base}/sin-iglesia-asignacion`).request.method).toBe('GET');
    });
  });
});
