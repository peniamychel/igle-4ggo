import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

import { Activo } from '../../../../core/models/activo.model';
import { ActivoService } from '../../../../core/services/activo.service';
import { AuthService } from '../../../../core/services/security/auth.service';

@Component({
  selector: 'app-activo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    ImageUrlPipe
  ],
  templateUrl: './activo-form.component.html',
  styleUrls: ['./activo-form.component.css']
})
export class ActivoFormComponent implements OnInit {
  activoForm!: FormGroup;
  isEditMode: boolean = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadingFoto: boolean = false;

  constructor(
    private fb: FormBuilder,
    private activoService: ActivoService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ActivoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; activo?: Activo }
  ) {
    this.isEditMode = data.mode === 'edit';
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    const activo = this.data.activo;
    
    let fecha: Date | null = null;
    if (activo?.fechaAdquisicion) {
      fecha = new Date(activo.fechaAdquisicion);
    } else {
      fecha = new Date();
    }

    if (activo?.uriFoto) {
      this.previewUrl = activo.uriFoto;
    }

    // Auto-generación de código al crear si no existe
    const autoCode = activo?.codigo || 'ACT-' + Math.floor(100000 + Math.random() * 900000);

    this.activoForm = this.fb.group({
      id: [activo?.id || null],
      nombre: [activo?.nombre || '', [Validators.required, Validators.maxLength(254)]],
      codigo: [autoCode, [Validators.required, Validators.maxLength(100)]],
      descripcion: [activo?.descripcion || '', [Validators.maxLength(500)]],
      cantidad: [activo?.cantidad || 1, [Validators.required, Validators.min(1)]],
      estadoConservacion: [activo?.estadoConservacion || 'BUENO', [Validators.required]],
      valorEstimado: [activo?.valorEstimado || 0, [Validators.min(0)]],
      fechaAdquisicion: [fecha],
      iglesiaId: [activo?.iglesiaId || null]
    });
  }

  onSubmit() {
    if (this.activoForm.invalid) return;

    const formVal = this.activoForm.value;
    let finalDate: Date | undefined = undefined;
    if (formVal.fechaAdquisicion) {
      if (formVal.fechaAdquisicion instanceof Date) {
        finalDate = formVal.fechaAdquisicion;
      } else {
        finalDate = new Date(formVal.fechaAdquisicion + 'T00:00:00');
      }
    }

    const payload: Partial<Activo> = {
      ...formVal,
      fechaAdquisicion: finalDate
    };

    // El inventario siempre pertenece a la iglesia del usuario (pastor).
    payload.iglesiaId = this.authService.getCurrentIglesiaId() || this.data.activo?.iglesiaId || undefined;

    const saveObs = this.isEditMode
      ? this.activoService.updateActivo(payload)
      : this.activoService.createActivo(payload);

    this.uploadingFoto = true;
    saveObs.subscribe({
      next: (res: any) => {
        const id = res.datos?.id || payload.id;
        if (this.selectedFile && id) {
          this.activoService.uploadFoto(id, this.selectedFile).subscribe({
            next: () => {
              this.uploadingFoto = false;
              this.dialogRef.close(true);
            },
            error: () => {
              this.uploadingFoto = false;
              this.dialogRef.close(true);
            }
          });
        } else {
          this.uploadingFoto = false;
          this.dialogRef.close(true);
        }
      },
      error: () => {
        this.uploadingFoto = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  clearFile() {
    this.selectedFile = null;
    this.previewUrl = this.data.activo?.uriFoto || null;
  }

  deleteFoto() {
    if (!this.data.activo?.id) {
      this.previewUrl = null;
      this.selectedFile = null;
      return;
    }
    this.activoService.deleteFoto(this.data.activo.id).subscribe({
      next: () => {
        if (this.data.activo) {
          this.data.activo.uriFoto = undefined;
        }
        this.previewUrl = null;
        this.selectedFile = null;
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
