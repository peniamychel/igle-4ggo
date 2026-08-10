import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuditLogService, AuditLog } from './audit-log.service';
import { environment } from '../../../environments/environment';

/**
 * mapToAuditLog() clasifica cada entrada de bitácora del backend
 * (accion="CREAR_MIEMBRO", "TRASPASO_SOLICITADO", etc., texto libre) en una
 * de seis categorías cerradas por coincidencia de substring. getFilteredLogs
 * y getStats encadenan filtros sobre esa clasificación. Como la clasificación
 * es por substring, el orden de los `if` importa: una acción que matchea dos
 * palabras clave (p. ej. "IMPORTAR_TRASPASO") cae en la que se evalúa
 * primero, y eso hay que fijarlo con test para que un reordenamiento futuro
 * sea una decisión, no un accidente.
 */
describe('AuditLogService', () => {
  let service: AuditLogService;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/api/bitacora/v1/findall`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuditLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function dto(overrides: Partial<any> = {}) {
    return {
      id: 1, username: 'carlos', userFullName: 'Carlos Perez',
      accion: 'CREAR_MIEMBRO', modulo: 'MIEMBRO', descripcion: 'Creó un miembro',
      fecha: '2026-01-15T10:00:00', ipAddress: '10.0.0.1', usuarioId: 1,
      ...overrides
    };
  }

  describe('mapToAuditLog: clasificación de la acción', () => {

    const casos: Array<[string, AuditLog['accion']]> = [
      ['CREAR_MIEMBRO', 'Creación'],
      ['CLONAR_EVENTO', 'Creación'],
      ['MODIFICAR_MIEMBRO', 'Modificación'],
      ['EDITAR_IGLESIA', 'Modificación'],
      ['SUBIR_FOTO', 'Modificación'],
      ['TRASPASO_ACEPTADO', 'Modificación'],
      ['ELIMINAR_CARGO', 'Eliminación'],
      ['BORRAR_ACTIVO', 'Eliminación'],
      ['IMPORTAR_EXCEL', 'Exportación'],
      ['EXPORTAR_PDF', 'Exportación'],
      ['ADVERTENCIA_LOGIN', 'Advertencia'],
      ['LOGIN_FAILED', 'Advertencia'],
      ['ACCION_DESCONOCIDA', 'Acceso'], // ninguna palabra clave: cae al default
    ];

    for (const [accion, esperado] of casos) {
      it(`"${accion}" clasifica como "${esperado}"`, (done) => {
        service.getLogs().subscribe(logs => {
          expect(logs[0].accion).toBe(esperado);
          done();
        });
        httpMock.expectOne(url).flush({ datos: [dto({ accion })] });
      });
    }

    it('la clasificación no distingue mayúsculas de minúsculas', (done) => {
      service.getLogs().subscribe(logs => {
        expect(logs[0].accion).toBe('Creación');
        done();
      });
      httpMock.expectOne(url).flush({ datos: [dto({ accion: 'crear_miembro' })] });
    });
  });

  describe('mapToAuditLog: estado (SUCCESS/FAILED)', () => {

    it('la descripción con "fallido" marca el estado como FAILED aunque la acción no lo diga', (done) => {
      service.getLogs().subscribe(logs => {
        expect(logs[0].estado).toBe('FAILED');
        done();
      });
      httpMock.expectOne(url).flush({
        datos: [dto({ accion: 'LOGIN', descripcion: 'Intento fallido de acceso' })]
      });
    });

    it('sin ninguna señal de fallo, el estado es SUCCESS', (done) => {
      service.getLogs().subscribe(logs => {
        expect(logs[0].estado).toBe('SUCCESS');
        done();
      });
      httpMock.expectOne(url).flush({ datos: [dto({ accion: 'CREAR_MIEMBRO' })] });
    });
  });

  describe('mapToAuditLog: valores de respaldo cuando falta el dato', () => {

    it('sin userFullName, usa username; sin ninguno de los dos, "Sistema"', (done) => {
      service.getLogs().subscribe(logs => {
        expect(logs[0].usuario).toBe('carlos');
        expect(logs[1].usuario).toBe('Sistema');
        done();
      });
      httpMock.expectOne(url).flush({
        datos: [
          dto({ userFullName: undefined, username: 'carlos' }),
          dto({ id: 2, userFullName: undefined, username: undefined })
        ]
      });
    });

    it('sin ipAddress cae a 127.0.0.1', (done) => {
      service.getLogs().subscribe(logs => {
        expect(logs[0].ip).toBe('127.0.0.1');
        done();
      });
      httpMock.expectOne(url).flush({ datos: [dto({ ipAddress: undefined })] });
    });

    it('rol depende de usuarioId: con id es "Usuario Registrado", sin id es "Sistema"', (done) => {
      service.getLogs().subscribe(logs => {
        expect(logs[0].rol).toBe('Usuario Registrado');
        expect(logs[1].rol).toBe('Sistema');
        done();
      });
      httpMock.expectOne(url).flush({
        datos: [dto({ usuarioId: 1 }), dto({ id: 2, usuarioId: undefined })]
      });
    });
  });

  describe('getLogs: forma de la respuesta', () => {

    it('respuesta sin "datos" da lista vacía, no revienta', (done) => {
      service.getLogs().subscribe(logs => {
        expect(logs).toEqual([]);
        done();
      });
      httpMock.expectOne(url).flush({});
    });
  });

  describe('getFilteredLogs: los tres filtros se combinan con AND', () => {

    function tresLogs() {
      return {
        datos: [
          dto({ id: 1, accion: 'CREAR_MIEMBRO', username: 'carlos', userFullName: 'Carlos Perez', descripcion: 'Creó un miembro', fecha: new Date().toISOString() }),
          // userFullName explícito y SIN "carlos": si se dejara el default de dto()
          // ('Carlos Perez' para las tres filas), la búsqueda de texto libre por
          // 'carlos' matchearía a los tres via el campo `usuario`, no sólo a los
          // que tienen username='carlos' — exactamente lo que este fixture
          // necesita distinguir.
          dto({ id: 2, accion: 'ELIMINAR_CARGO', username: 'ana', userFullName: 'Ana Lopez', descripcion: 'Eliminó un cargo', fecha: new Date().toISOString() }),
          dto({ id: 3, accion: 'CREAR_EVENTO', username: 'carlos', userFullName: 'Carlos Perez', descripcion: 'Creó un evento', fecha: '2020-01-01T00:00:00' }), // viejo
        ]
      };
    }

    it('sin filtros, devuelve todo', (done) => {
      service.getFilteredLogs().subscribe(logs => {
        expect(logs.length).toBe(3);
        done();
      });
      httpMock.expectOne(url).flush(tresLogs());
    });

    it('filtro de acción: sólo compara con el traducido, no con el texto crudo del backend', (done) => {
      service.getFilteredLogs(undefined, 'Creación').subscribe(logs => {
        // "CREAR_MIEMBRO" y "CREAR_EVENTO" mapean a 'Creación'; "ELIMINAR_CARGO" no.
        expect(logs.map(l => l.id).sort()).toEqual([1, 3]);
        done();
      });
      httpMock.expectOne(url).flush(tresLogs());
    });

    it('"TODOS" no filtra por acción', (done) => {
      service.getFilteredLogs(undefined, 'TODOS').subscribe(logs => {
        expect(logs.length).toBe(3);
        done();
      });
      httpMock.expectOne(url).flush(tresLogs());
    });

    it('filtro de días excluye lo más viejo que el límite', (done) => {
      service.getFilteredLogs(undefined, undefined, 7).subscribe(logs => {
        expect(logs.map(l => l.id).sort()).toEqual([1, 2]); // el id 3 es de 2020
        done();
      });
      httpMock.expectOne(url).flush(tresLogs());
    });

    it('búsqueda de texto libre alcanza username, detalle y otros campos combinados', (done) => {
      service.getFilteredLogs('carlos').subscribe(logs => {
        expect(logs.map(l => l.id).sort()).toEqual([1, 3]);
        done();
      });
      httpMock.expectOne(url).flush(tresLogs());
    });

    it('los tres filtros combinados son un AND, no un OR', (done) => {
      // username=carlos Y acción=Creación Y dentro de 7 días -> sólo el id 1
      // (el id 3 es de carlos y Creación, pero es de 2020: el filtro de fecha lo saca).
      service.getFilteredLogs('carlos', 'Creación', 7).subscribe(logs => {
        expect(logs.map(l => l.id)).toEqual([1]);
        done();
      });
      httpMock.expectOne(url).flush(tresLogs());
    });
  });

  describe('getStats: agregados para el dashboard', () => {

    it('cuenta inicios de sesión exitosos y advertencias por dos vías independientes (accion=Advertencia O estado=FAILED)', (done) => {
      service.getStats().subscribe(stats => {
        expect(stats.totalEventos).toBe(3);
        expect(stats.iniciosSesion).toBe(1); // sólo el log1
        expect(stats.advertencias).toBe(2); // log2 por accion, log3 por estado — vías distintas
        done();
      });
      httpMock.expectOne(url).flush({
        datos: [
          // accion no clasifica (cae a "Acceso" por default) y nada indica fallo -> estado SUCCESS.
          // Cuenta como inicio de sesión, y NO como advertencia.
          dto({ id: 1, accion: 'ACCION_RARA', descripcion: 'Entró al sistema' }),
          // "ADVERTENCIA" en la accion clasifica como Advertencia directamente,
          // sin que el estado sea FAILED. Cuenta como advertencia por la accion,
          // NO como inicio de sesión (su accion no es "Acceso").
          dto({ id: 2, accion: 'ADVERTENCIA_LENTA', descripcion: 'Operación lenta' }),
          // La accion NO contiene ninguna palabra clave (cae a "Acceso"), pero la
          // DESCRIPCIÓN dice "fallido" -> estado FAILED. Cuenta como advertencia
          // por el estado, no por la accion; y no es inicio de sesión porque el
          // estado no es SUCCESS.
          dto({ id: 3, accion: 'ACCION_RARA', descripcion: 'Intento fallido de acceso' }),
        ]
      });
    });
  });
});
