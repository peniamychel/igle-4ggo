import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResponsableEventoService } from '../../../../core/services/responsable-evento.service';
import { Evento } from '../../../../core/models/evento.model';
import { Cargo } from '../../../../core/models/cargo.model';
import { ResponsableEvento } from '../../../../core/models/responsable-evento.model';
import { forkJoin } from 'rxjs';

interface PendingResponsable {
  eventoId: number;
  cargoId: number;
  eventoNombre: string;
  responsableNombre: string;
}

@Component({
  selector: 'app-responsable-evento-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './responsable-evento-create.component.html',
  styleUrls: ['./responsable-evento-create.component.css']
})
export class ResponsableEventoCreateComponent implements OnInit {
  @ViewChild('searchCargo') searchCargoInput!: ElementRef;
  responsableForm: FormGroup;
  eventos: Evento[] = [];
  cargos: Cargo[] = [];
  filteredCargos: Cargo[] = [];
  pendingList: PendingResponsable[] = [];
  saving = false;

  /** Responsables que el evento seleccionado ya tiene guardados. */
  asignados: ResponsableEvento[] = [];
  cargandoAsignados = false;

  constructor(
    private fb: FormBuilder,
    private responsableService: ResponsableEventoService,
    private dialogRef: MatDialogRef<ResponsableEventoCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { eventos: Evento[], cargos: Cargo[] }
  ) {
    this.responsableForm = this.fb.group({
      eventoId: ['', Validators.required],
      cargoId: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.eventos = this.data.eventos.filter(e => e.estado);
      this.cargos = this.data.cargos.filter(c => c.estado);
      this.applyFilter();
    }

    // Al elegir un evento se traen los responsables que ya tiene: se muestran y
    // se descuentan de la lista para no volver a asignarlos.
    this.responsableForm.get('eventoId')?.valueChanges.subscribe(eventoId => {
      this.responsableForm.patchValue({ cargoId: '' }, { emitEvent: false });
      this.cargarAsignados(eventoId);
    });
  }

  private cargarAsignados(eventoId: number) {
    this.asignados = [];
    if (!eventoId) {
      this.applyFilter();
      return;
    }

    this.cargandoAsignados = true;
    this.responsableService.getResponsablesPorEvento(eventoId).subscribe({
      next: (res) => {
        this.asignados = res.datos || [];
        this.cargandoAsignados = false;
        this.applyFilter();
      },
      error: () => {
        this.cargandoAsignados = false;
        this.applyFilter();
      }
    });
  }

  /** Nombre a mostrar de un responsable ya guardado. */
  nombreAsignado(responsable: ResponsableEvento): string {
    if (responsable.nombreCompleto) {
      return responsable.nombreCargo
        ? `${responsable.nombreCompleto} (${responsable.nombreCargo})`
        : responsable.nombreCompleto;
    }
    if (responsable.cargoDto) return this.getCargoNombreCompleto(responsable.cargoDto);
    const cargo = this.cargos.find(c => c.id === responsable.cargoId);
    return cargo ? this.getCargoNombreCompleto(cargo) : 'Responsable';
  }

  /**
   * Cargos elegibles: se quitan los que el evento ya tiene guardados y los que
   * están en la lista pendiente PARA ESE MISMO evento (para otro evento siguen
   * disponibles).
   */
  private get availableCargos(): Cargo[] {
    const eventoId = this.responsableForm.get('eventoId')?.value;
    const ocupados = new Set<number>([
      ...this.asignados.map(a => a.cargoId),
      ...this.pendingList.filter(p => p.eventoId === eventoId).map(p => p.cargoId)
    ]);
    return this.cargos.filter(c => !ocupados.has(c.id!));
  }

  applyFilter(searchTerm?: string) {
    this.filteredCargos = this.availableCargos.filter(cargo => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      const nombreCompleto = this.getCargoNombreCompleto(cargo).toLowerCase();
      const iglesia = (cargo.iglesiaDto?.nombre || '').toLowerCase();
      return nombreCompleto.includes(s) || iglesia.includes(s);
    });
  }

  filterCargos(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.applyFilter(filterValue);
  }

  onCargoSelectOpen(isOpen: boolean) {
    if (isOpen) {
      setTimeout(() => {
        if (this.searchCargoInput) {
          this.searchCargoInput.nativeElement.focus();
        }
      }, 0);
    }
  }

  getCargoNombreCompleto(cargo: Cargo): string {
    if (!cargo.miembroDto) return 'N/A';
    const p = cargo.miembroDto;
    const tipo = cargo.tipoCargoDto?.nombre || '';
    const iglesia = cargo.iglesiaDto?.nombre || '';
    const nombreBase = `${p.nombre} ${p.apellido}${tipo ? ` (${tipo})` : ''}`;
    return iglesia ? `${nombreBase} - ${iglesia}` : nombreBase;
  }

  getEventoNombre(id: number): string {
    return this.eventos.find(e => e.id === id)?.nombre || 'N/A';
  }

  addToList() {
    if (this.responsableForm.invalid) return;
    const { eventoId, cargoId } = this.responsableForm.value;
    const cargo = this.cargos.find(c => c.id === cargoId);
    this.pendingList.push({
      eventoId,
      cargoId,
      eventoNombre: this.getEventoNombre(eventoId),
      responsableNombre: cargo ? this.getCargoNombreCompleto(cargo) : 'N/A',
    });
    this.responsableForm.patchValue({ cargoId: '' });
    this.responsableForm.get('cargoId')?.markAsUntouched();
    this.applyFilter();
  }

  removeFromList(index: number) {
    this.pendingList.splice(index, 1);
    this.applyFilter();
  }

  onSave() {
    if (this.pendingList.length === 0 || this.saving) return;
    this.saving = true;
    const requests = this.pendingList.map(item =>
      this.responsableService.createResponsable({
        eventoId: item.eventoId,
        cargoId: item.cargoId,
      } as any)
    );
    forkJoin(requests).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  getError(controlName: string): string {
    const control = this.responsableForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    return '';
  }
}
