import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../services/security/auth.service';

/**
 * Directiva estructural que renderiza el elemento solo si el usuario posee
 * el privilegio indicado (o alguno de los indicados).
 *
 * Uso en plantillas:
 *   <button *appHasPrivilegio="'Escribir Miembros'" (click)="crear()">Nuevo</button>
 *   <button *appHasPrivilegio="['Escribir Miembros', 'Escribir MiembroIglesia']">...</button>
 *
 * Modelo de privilegios de 2 niveles (Ver / Escribir por entidad).
 * El rol ADMIN tiene bypass en {@link AuthService.hasPrivilegio}.
 *
 * Reacciona a cambios del input (si el privilegio evaluado cambia en runtime),
 * pero NO re-evalúa automáticamente si los privilegios del usuario cambian sin
 * recargar; el login/logout ya fuerzan recarga de estado en la app.
 */
@Directive({
  selector: '[appHasPrivilegio]',
  standalone: true,
})
export class HasPrivilegioDirective {
  private hasView = false;

  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  @Input()
  set appHasPrivilegio(privilegio: string | string[] | undefined | null) {
    if (privilegio === undefined || privilegio === null || privilegio === '') {
      // Sin input: no renderiza (defensivo)
      this.clear();
      return;
    }
    const debeMostrar = this.auth.hasPrivilegio(privilegio);
    if (debeMostrar && !this.hasView) {
      this.vcr.createEmbeddedView(this.tpl);
      this.hasView = true;
    } else if (!debeMostrar && this.hasView) {
      this.clear();
    }
  }

  private clear(): void {
    this.vcr.clear();
    this.hasView = false;
  }
}
