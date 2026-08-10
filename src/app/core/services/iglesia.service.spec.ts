import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IglesiaService } from './iglesia.service';
import { environment } from '../../../environments/environment';

/**
 * getIglesias() cachea con shareReplay(1) porque el catálogo de iglesias
 * cambia poco y se pide desde muchos componentes a la vez. Lo que hay que
 * probar es justo lo que un mock nunca ejercita: que dos suscriptores
 * comparten UNA sola petición HTTP, que cada mutación (create/update/
 * toggleEstado/foto/orden/delete) invalida el caché, y que un error de red
 * limpia el caché en vez de dejarlo "envenenado" repitiendo el mismo error
 * para siempre.
 */
describe('IglesiaService', () => {
  let service: IglesiaService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/iglesia/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(IglesiaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('caché de getIglesias', () => {

    it('dos llamadas seguidas comparten UNA sola petición HTTP', () => {
      service.getIglesias().subscribe();
      service.getIglesias().subscribe();

      // Si el caché no funcionara, expectOne fallaría por encontrar 2 requests.
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).toBe('GET');
      req.flush({ datos: [] });
    });

    it('un segundo suscriptor recibe el mismo valor ya emitido, sin pedir de nuevo', () => {
      let primero: any;
      let segundo: any;

      service.getIglesias().subscribe(r => primero = r);
      httpMock.expectOne(`${base}/findall`).flush({ datos: [{ id: 1 }] });

      service.getIglesias().subscribe(r => segundo = r);
      httpMock.expectNone(`${base}/findall`); // no debe salir una segunda petición
      expect(segundo).toEqual(primero);
    });

    it('tras un error de red, el caché se limpia: el siguiente intento SÍ vuelve a pedir', () => {
      service.getIglesias().subscribe({ error: () => {} });
      httpMock.expectOne(`${base}/findall`).error(new ProgressEvent('network error'));

      // Si el caché quedara "pegado" al error, esta segunda llamada no generaría
      // una petición nueva y el catálogo de iglesias quedaría roto para siempre.
      service.getIglesias().subscribe();
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).toBe('GET');
      req.flush({ datos: [] });
    });
  });

  describe('cada mutación invalida el caché', () => {

    function esperarInvalidacion(disparar: () => void) {
      // Llena el caché.
      service.getIglesias().subscribe();
      httpMock.expectOne(`${base}/findall`).flush({ datos: [] });

      disparar();

      // Si la mutación invalidó el caché, pedirlo de nuevo genera OTRA petición.
      service.getIglesias().subscribe();
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).withContext('debe repetir la petición: el caché se invalidó').toBe('GET');
      req.flush({ datos: [] });
    }

    it('createIglesia invalida el caché', () => {
      esperarInvalidacion(() => {
        service.createIglesia({ nombre: 'Palmar' } as any).subscribe();
        httpMock.expectOne(`${base}/create`).flush({});
      });
    });

    it('updateIglesia invalida el caché', () => {
      esperarInvalidacion(() => {
        service.updateIglesia({ id: 1, nombre: 'Palmar' } as any).subscribe();
        httpMock.expectOne(`${base}/update`).flush({});
      });
    });

    it('toggleEstado invalida el caché', () => {
      esperarInvalidacion(() => {
        service.toggleEstado(1).subscribe();
        httpMock.expectOne(`${base}/estado/1`).flush({});
      });
    });

    it('uploadFoto invalida el caché', () => {
      esperarInvalidacion(() => {
        service.uploadFoto(1, new File(['x'], 'f.jpg')).subscribe();
        httpMock.expectOne(`${base}/1/foto`).flush({});
      });
    });

    it('deleteIglesia invalida el caché', () => {
      esperarInvalidacion(() => {
        service.deleteIglesia(1).subscribe();
        httpMock.expectOne(`${base}/delete/1`).flush({});
      });
    });

    it('updateOrden invalida el caché', () => {
      esperarInvalidacion(() => {
        service.updateOrden([3, 1, 2]).subscribe();
        const req = httpMock.expectOne(`${base}/update-orden`);
        expect(req.request.body).toEqual([3, 1, 2]);
        req.flush({});
      });
    });
  });

  describe('otros endpoints', () => {

    it('getIglesiaById no pasa por el caché: siempre pide de nuevo', () => {
      service.getIglesiaById(5).subscribe();
      service.getIglesiaById(5).subscribe();

      const reqs = httpMock.match(`${base}/showbyid/5`);
      expect(reqs.length).toBe(2);
      reqs.forEach(r => r.flush({}));
    });

    it('buscarNombreIglesiaExeptoId interpola nombre e id en la ruta', () => {
      service.buscarNombreIglesiaExeptoId('Palmar', 3).subscribe();
      const req = httpMock.expectOne(`${base}/showbynombreiglesiaexceptoid/Palmar/3`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('deleteFoto invalida el caché igual que uploadFoto', () => {
      service.getIglesias().subscribe();
      httpMock.expectOne(`${base}/findall`).flush({ datos: [] });

      service.deleteFoto(1).subscribe();
      const del = httpMock.expectOne(`${base}/1/foto`);
      expect(del.request.method).toBe('DELETE');
      del.flush({});

      service.getIglesias().subscribe();
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).toBe('GET');
      req.flush({ datos: [] });
    });
  });
});
