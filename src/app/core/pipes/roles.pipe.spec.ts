import { RolesPipe } from './roles.pipe';
import { Role } from '../models/user.model';

/**
 * Muestra los roles de un usuario como texto. Lo relevante es que tolera TRES
 * nombres de campo distintos (`nombre`, `name`, `nombreRol`) porque el backend
 * los devuelve distinto según el endpoint, y que nunca debe reventar con datos
 * incompletos: se renderiza en tablas de usuarios donde un throw dejaría la
 * fila entera en blanco.
 */
describe('RolesPipe', () => {
  let pipe: RolesPipe;

  beforeEach(() => {
    pipe = new RolesPipe();
  });

  it('se instancia', () => {
    expect(pipe).toBeTruthy();
  });

  it('devuelve cadena vacía si no hay roles o no es un array', () => {
    expect(pipe.transform(null as unknown as Role[])).toBe('');
    expect(pipe.transform(undefined as unknown as Role[])).toBe('');
    expect(pipe.transform('ROLE_ADMIN' as unknown as Role[])).toBe('');
  });

  it('devuelve cadena vacía con un array vacío', () => {
    expect(pipe.transform([])).toBe('');
  });

  it('usa "nombre" cuando está presente', () => {
    expect(pipe.transform([{ nombre: 'Pastor' } as Role])).toBe('Pastor');
  });

  it('cae a "name" y luego a "nombreRol" si no hay "nombre"', () => {
    expect(pipe.transform([{ name: 'Tesorero' } as unknown as Role])).toBe('Tesorero');
    expect(pipe.transform([{ nombreRol: 'ROLE_DIACONO' } as unknown as Role])).toBe('ROLE_DIACONO');
  });

  it('une varios roles con coma', () => {
    const roles = [{ nombre: 'Pastor' }, { nombre: 'Tesorero' }] as Role[];
    expect(pipe.transform(roles)).toBe('Pastor, Tesorero');
  });

  it('descarta los roles sin ningún nombre en vez de dejar comas sueltas', () => {
    // Sin el .filter(Boolean) esto daría "Pastor, , Tesorero".
    const roles = [{ nombre: 'Pastor' }, {}, { nombre: 'Tesorero' }] as Role[];
    expect(pipe.transform(roles)).toBe('Pastor, Tesorero');
  });
});
