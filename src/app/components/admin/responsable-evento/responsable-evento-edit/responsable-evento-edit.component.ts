import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ResponsableEventoService } from '../../../../core/services/responsable-evento.service';
import { ResponsableEvento } from '../../../../core/models/responsable-evento.model';
import { Evento } from '../../../../core/models/evento.model';
import { Cargo } from '../../../../core/models/cargo.model';

@Component({
  selector: 'app-responsable-evento-edit',
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
  ],
  templateUrl: './responsable-evento-edit.component.html',
  styleUrls: ['./responsable-evento-edit.component.css']
})
export class ResponsableEventoEditComponent implements OnInit {
  @ViewChild('searchCargo') searchCargoInput!: ElementRef;
  responsableForm: FormGroup;
  responsable: ResponsableEvento;
  eventos: Evento[] = [];
  cargos: Cargo[] = [];
  filteredCargos: Cargo[] = [];

  constructor(
    private fb: FormBuilder,
    private responsableService: ResponsableEventoService,
    private dialogRef: MatDialogRef<ResponsableEventoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { responsable: ResponsableEvento, eventos: Evento[], cargos: Cargo[] }
  ) {
    this.responsableForm = this.fb.group({
      eventoId: ['', Validators.required],
      cargoId: ['', Validators.required],
    });
    this.responsable = data.responsable;
  }

  ngOnInit() {
    if (this.data) {
      this.eventos = this.data.eventos;
      this.cargos = this.data.cargos;
      this.filteredCargos = [...this.cargos];
      this.responsableForm.patchValue({
        eventoId: this.responsable.eventoId,
        cargoId: this.responsable.cargoId,
      });
    }
  }

  filterCargos(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCargos = this.cargos.filter(cargo => {
      const nombreCompleto = this.getCargoNombreCompleto(cargo).toLowerCase();
      const iglesia = (cargo.iglesiaDto?.nombre || '').toLowerCase();
      return nombreCompleto.includes(filterValue) || iglesia.includes(filterValue);
    });
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
    if (!cargo.miembroDto || !cargo.miembroDto.personaDto) return 'N/A';
    const p = cargo.miembroDto.personaDto;
    const tipo = cargo.tipoCargoDto?.nombre || '';
    const iglesia = cargo.iglesiaDto?.nombre || '';
    const nombreBase = `${p.nombre} ${p.apellido}${tipo ? ` (${tipo})` : ''}`;
    return iglesia ? `${nombreBase} - ${iglesia}` : nombreBase;
  }

  onSubmit() {
    if (this.responsableForm.valid) {
      const responsableData: ResponsableEvento = { ...this.responsable, ...this.responsableForm.value };
      this.responsableService.updateResponsable(responsableData).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.responsableForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    return '';
  }
}
