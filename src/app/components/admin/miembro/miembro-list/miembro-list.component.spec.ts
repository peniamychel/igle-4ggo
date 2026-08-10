import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MiembroListComponent } from './miembro-list.component';
import { MiembroService } from '../../../../core/services/miembro.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Miembro } from '../../../../core/models/miembro.model';

/**
 * Se mockean los servicios (ya tienen su propio spec) para aislar la
 * ORQUESTACIÓN propia del componente: la traducción del filtro de estado a
 * boolean|undefined, que cambiar un filtro resetea a la página 1, y el guard
 * de traspaso que no abre el diálogo si el miembro no tiene iglesia activa
 * (una llamada a HTTP evitada, no sólo una validación visual).
 */
describe('MiembroListComponent', () => {
  let component: MiembroListComponent;
  let fixture: ComponentFixture<MiembroListComponent>;
  let miembroService: jasmine.SpyObj<MiembroService>;
  let iglesiaService: jasmine.SpyObj<IglesiaService>;
  let authService: jasmine.SpyObj<AuthService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const respuestaVacia = { message: '', datos: { content: [] as Miembro[], totalElements: 0 } } as any;

  function nuevoMiembro(overrides: Partial<Miembro> = {}): Miembro {
    return {
      id: 1, nombre: 'Carlos', apellido: 'Perez', lugarConvercion: '', interventores: '',
      detalles: '', fechaNac: new Date(), celular: '', sexo: '', direccion: '', uriFoto: '',
      estado: true, ...overrides
    };
  }

  beforeEach(async () => {
    miembroService = jasmine.createSpyObj('MiembroService',
      ['getMiembrosPaged', 'toggleEstado', 'deleteMiembro', 'downloadTemplate', 'importExcel']);
    iglesiaService = jasmine.createSpyObj('IglesiaService', ['getIglesias']);
    authService = jasmine.createSpyObj('AuthService', ['isLoggedRolAdmin', 'hasPrivilegio']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    miembroService.getMiembrosPaged.and.returnValue(of(respuestaVacia));
    iglesiaService.getIglesias.and.returnValue(of({ datos: [] } as any));
    authService.isLoggedRolAdmin.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [MiembroListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MiembroService, useValue: miembroService },
        { provide: IglesiaService, useValue: iglesiaService },
        { provide: AuthService, useValue: authService },
        { provide: MatSnackBar, useValue: snackBar }
        // MatDialog NO se reemplaza con useValue: el componente terminaba
        // recibiendo una instancia REAL distinta de la registrada acá (mismo
        // token, pero la inyectada en el componente no era ===  a la del
        // provider) — un mismatch de identidad de token entre la compilación
        // del componente y la del spec. En vez de pelear con eso, se deja que
        // Angular resuelva la instancia real y se espía DIRECTO sobre ella.
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MiembroListComponent);
    component = fixture.componentInstance;

    // El componente importa MatDialogModule directamente en su propio
    // `imports` (patrón standalone); ese NgModule declara su PROPIO provider
    // de MatDialog (no depende sólo de providedIn:'root'), así que crea una
    // instancia local que SOMBREA a la del injector raíz — TestBed.inject(MatDialog)
    // devuelve una instancia distinta de la que el componente realmente recibe
    // en su constructor. Hay que pedirla al injector del propio componente.
    dialog = fixture.debugElement.injector.get(MatDialog) as unknown as jasmine.SpyObj<MatDialog>;
    spyOn(dialog, 'open');
  });

  describe('ngOnInit', () => {

    it('un pastor (no admin) NO pide el catálogo de iglesias', () => {
      authService.isLoggedRolAdmin.and.returnValue(false);
      fixture.detectChanges();

      expect(iglesiaService.getIglesias).not.toHaveBeenCalled();
    });

    it('un admin SÍ pide el catálogo de iglesias, para el filtro', () => {
      authService.isLoggedRolAdmin.and.returnValue(true);
      fixture.detectChanges();

      expect(iglesiaService.getIglesias).toHaveBeenCalled();
    });

    it('sólo incluye en el filtro las iglesias ACTIVAS', () => {
      authService.isLoggedRolAdmin.and.returnValue(true);
      iglesiaService.getIglesias.and.returnValue(of({
        datos: [{ id: 1, nombre: 'Palmar', estado: true }, { id: 2, nombre: 'Cerrada', estado: false }]
      } as any));

      fixture.detectChanges();

      expect(component.iglesias.map(i => i.nombre)).toEqual(['Palmar']);
    });

    it('siempre carga miembros, sin importar el rol', () => {
      fixture.detectChanges();
      expect(miembroService.getMiembrosPaged).toHaveBeenCalled();
    });
  });

  describe('loadMiembros: traducción del filtro de estado', () => {

    beforeEach(() => fixture.detectChanges());

    it('"active" se traduce a true', () => {
      component.selectedEstado = 'active';
      component.loadMiembros();

      expect(miembroService.getMiembrosPaged).toHaveBeenCalledWith(
        jasmine.any(Number), jasmine.any(Number), jasmine.any(String), true, jasmine.any(String));
    });

    it('"inactive" se traduce a false', () => {
      component.selectedEstado = 'inactive';
      component.loadMiembros();

      expect(miembroService.getMiembrosPaged).toHaveBeenCalledWith(
        jasmine.any(Number), jasmine.any(Number), jasmine.any(String), false, jasmine.any(String));
    });

    it('"all" se traduce a undefined, no a un booleano', () => {
      component.selectedEstado = 'all';
      component.loadMiembros();

      expect(miembroService.getMiembrosPaged).toHaveBeenCalledWith(
        jasmine.any(Number), jasmine.any(Number), jasmine.any(String), undefined, jasmine.any(String));
    });

    it('un error de red apaga el spinner y avisa por snackbar, no lo deja cargando para siempre', () => {
      miembroService.getMiembrosPaged.and.returnValue(throwError(() => 'fallo de red'));

      component.loadMiembros();

      expect(component.isLoading).toBeFalse();
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('applyFilters: resetea a la primera página', () => {

    beforeEach(() => fixture.detectChanges());

    it('cambiar un filtro estando en otra página vuelve a la página 0', () => {
      component.pageIndex = 3;
      component.applyFilters();

      expect(component.pageIndex).toBe(0);
      const args = miembroService.getMiembrosPaged.calls.mostRecent().args;
      expect(args[0]).toBe(0); // page
    });

    it('onSearchChange actualiza el texto y aplica filtros (vuelve a página 0)', () => {
      component.pageIndex = 2;
      const evento = { target: { value: 'carlos' } } as unknown as Event;

      component.onSearchChange(evento);

      expect(component.searchText).toBe('carlos');
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('onPageChange', () => {

    beforeEach(() => fixture.detectChanges());

    it('actualiza pageIndex y pageSize y recarga con esos valores, SIN resetear a 0', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25 });

      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(25);
      const args = miembroService.getMiembrosPaged.calls.mostRecent().args;
      expect(args[0]).toBe(2); // page
      expect(args[1]).toBe(25); // size
    });
  });

  describe('openTraspasoDialog: guard cuando el miembro no tiene iglesia activa', () => {

    beforeEach(() => {
      authService.isLoggedRolAdmin.and.returnValue(true);
      iglesiaService.getIglesias.and.returnValue(of({
        datos: [{ id: 1, nombre: 'Palmar', estado: true }]
      } as any));
      fixture.detectChanges();
    });

    it('sin iglesia que matchee el nombre del miembro: avisa y NO abre el diálogo', () => {
      const miembro = nuevoMiembro({ iglesiaNombre: 'Iglesia Inexistente' });

      component.openTraspasoDialog(miembro);

      expect(dialog.open).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('con la iglesia encontrada, SÍ abre el diálogo con miembro e iglesia', () => {
      const miembro = nuevoMiembro({ iglesiaNombre: 'Palmar' });
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as MatDialogRef<any>);

      component.openTraspasoDialog(miembro);

      expect(dialog.open).toHaveBeenCalled();
      const args = dialog.open.calls.mostRecent().args[1] as any;
      expect(args.data.miembro).toBe(miembro);
      expect(args.data.iglesia.nombre).toBe('Palmar');
    });
  });

  describe('toggleEstado: sólo actúa si se confirma el diálogo', () => {

    beforeEach(() => fixture.detectChanges());

    it('si se cancela el diálogo de confirmación, NO llama al servicio', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);

      component.toggleEstado(nuevoMiembro());

      expect(miembroService.toggleEstado).not.toHaveBeenCalled();
    });

    it('si se confirma, llama al servicio y recarga la lista', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      miembroService.toggleEstado.and.returnValue(of({}));

      component.toggleEstado(nuevoMiembro({ id: 5 }));

      expect(miembroService.toggleEstado).toHaveBeenCalledWith(5);
    });
  });

  describe('deleteMiembro', () => {

    beforeEach(() => fixture.detectChanges());

    it('si se cancela, no borra nada', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);

      component.deleteMiembro(nuevoMiembro());

      expect(miembroService.deleteMiembro).not.toHaveBeenCalled();
    });

    it('un error del backend (miembro con dependencias) muestra un mensaje claro, no genérico', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      miembroService.deleteMiembro.and.returnValue(throwError(() => ({ status: 409 })));

      component.deleteMiembro(nuevoMiembro({ id: 5 }));

      const mensaje = (snackBar.open as jasmine.Spy).calls.mostRecent().args[0];
      expect(mensaje).toContain('cargos');
    });
  });

  describe('importarExcel', () => {

    beforeEach(() => fixture.detectChanges());

    it('sin archivo seleccionado, no llama al servicio', () => {
      const evento = { target: { files: null } } as unknown as Event;

      component.importarExcel(evento);

      expect(miembroService.importExcel).not.toHaveBeenCalled();
    });

    it('con errores/omitidos en la importación, abre el diálogo de reporte en vez de un snackbar genérico', () => {
      const file = new File(['x'], 'm.xlsx');
      const input = { files: [file] as unknown as FileList, value: 'x' } as HTMLInputElement;
      const evento = { target: input } as unknown as Event;
      miembroService.importExcel.and.returnValue(of({
        message: 'ok', datos: { imported: 1, omitidos: 1, importados: [{}], errores: [{}] }
      }));
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as MatDialogRef<any>);

      component.importarExcel(evento);

      expect(dialog.open).toHaveBeenCalled();
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('sin nada importado ni con errores, muestra un mensaje simple en vez del diálogo', () => {
      const file = new File(['x'], 'm.xlsx');
      const input = { files: [file] as unknown as FileList, value: 'x' } as HTMLInputElement;
      const evento = { target: input } as unknown as Event;
      miembroService.importExcel.and.returnValue(of({ message: 'Sin filas', datos: {} }));

      component.importarExcel(evento);

      expect(dialog.open).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('getAge', () => {

    beforeEach(() => fixture.detectChanges());

    it('sin fecha de nacimiento, un texto explícito en vez de "NaN años"', () => {
      expect(component.getAge(null)).toBe('Edad desconocida');
    });

    it('con fecha, arma el texto "N años"', () => {
      const hoy = new Date();
      const nacimiento = new Date(hoy.getFullYear() - 30, hoy.getMonth(), hoy.getDate() - 1);
      expect(component.getAge(nacimiento)).toBe('30 años');
    });
  });
});
