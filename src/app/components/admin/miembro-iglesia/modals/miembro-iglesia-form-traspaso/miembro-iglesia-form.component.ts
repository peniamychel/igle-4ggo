import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MiembroIglesiaService } from '../../../../../core/services/miembro-iglesia.service';
import { IglesiaService } from '../../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../../core/models/iglesia.model';
import { Miembro } from '../../../../../core/models/miembro.model';

@Component({
  selector: 'app-miembro-iglesia-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatDialogModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './miembro-iglesia-form.component.html',
  styleUrls: ['./miembro-iglesia-form.component.css']
})
export class MiembroIglesiaFormTraspasoComponent {
  form: FormGroup;
  iglesias: Iglesia[] = [];
  selectedFile: File | null = null;
  selectedFileName: string = '';

  constructor(
    private fb: FormBuilder,
    private miembroIglesiaService: MiembroIglesiaService,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<MiembroIglesiaFormTraspasoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      miembro: Miembro;
      iglesia: Iglesia;
      isEdit?: boolean;
      miembroIglesia?: any;
    }
  ) {
    const isEdit = this.data?.isEdit || false;
    const req = this.data?.miembroIglesia;

    this.form = this.fb.group({
      iglesiaId: [req?.iglesiaDestinoId || '', Validators.required],
      motivoTraspaso: [req?.motivoTraspaso || '', Validators.required],
      fechaTraspaso: [req?.fechaTraspaso ? new Date(req.fechaTraspaso) : new Date(), Validators.required],
      uriCartaTraspaso: [req?.uriCartaTraspaso || '', isEdit ? [] : [Validators.required]]
    });

    if (isEdit && req?.uriCartaTraspaso) {
      const parts = req.uriCartaTraspaso.split('/');
      this.selectedFileName = parts[parts.length - 1];
    }

    this.loadIglesias();
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(response => {
      this.iglesias = response.datos.filter(i => i.estado && i.id !== this.data.iglesia.id);
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.form.patchValue({
        uriCartaTraspaso: file.name
      });
      this.form.get('uriCartaTraspaso')?.markAsTouched();
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const isEdit = this.data?.isEdit || false;
      const req = this.data?.miembroIglesia;

      const payload: any = {
        miembroId: this.data.miembro.id,
        iglesiaId: this.data.iglesia.id,
        iglesiaDestinoId: this.form.value.iglesiaId,
        motivoTraspaso: this.form.value.motivoTraspaso,
        fechaTraspaso: this.form.value.fechaTraspaso,
        uriCartaTraspaso: req?.uriCartaTraspaso || ''
      };

      if (isEdit && req) {
        payload.id = req.id;
        payload.estado = req.estado;
        payload.estadoTraspaso = req.estadoTraspaso;
      }

      const requestObservable = isEdit
        ? this.miembroIglesiaService.updateMiembroIglesia(payload)
        : this.miembroIglesiaService.traspaso(payload);

      requestObservable.subscribe({
        next: (response) => {
          const requestId = response.datos?.id || req?.id;
          if (this.selectedFile && requestId) {
            this.miembroIglesiaService.uploadCartaTraspaso(requestId, this.selectedFile).subscribe({
              next: () => {
                this.dialogRef.close(true);
              },
              error: (err) => {
                console.error('Error al subir la carta de traspaso', err);
                this.dialogRef.close(true);
              }
            });
          } else {
            this.dialogRef.close(true);
          }
        },
        error: (err) => {
          console.error('Error al procesar el traspaso', err);
        }
      });
    }
  }
}
