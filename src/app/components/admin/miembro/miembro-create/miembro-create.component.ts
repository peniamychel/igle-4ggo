import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSelectModule} from '@angular/material/select';
import {MatNativeDateModule} from '@angular/material/core';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {Miembro} from '../../../../core/models/miembro.model';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MiembroService} from '../../../../core/services/miembro.service';
import {IglesiaService} from '../../../../core/services/iglesia.service';
import {MiembroIglesiaService} from '../../../../core/services/miembro-iglesia.service';
import {AuthService} from '../../../../core/services/security/auth.service';
import {Iglesia} from '../../../../core/models/iglesia.model';
import {ImageUrlPipe} from '../../../../shared/pipes/image-url.pipe';
import { ImageCropDialogComponent } from '../../../../shared/components/image-crop-dialog/image-crop-dialog.component';

@Component({
  selector: 'app-miembro-create',
  templateUrl: './miembro-create.component.html',
  styleUrls: ['./miembro-create.component.css'],
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
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    ImageUrlPipe
  ]
})
export class MiembroCreateComponent implements OnInit {
  miembroForm!: FormGroup;
  editMode = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isAdmin = false;
  iglesias: Iglesia[] = [];
  loadingChurches = false;

  constructor(
    private fb: FormBuilder,
    private miembroService: MiembroService,
    private iglesiaService: IglesiaService,
    private miembroIglesiaService: MiembroIglesiaService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<MiembroCreateComponent>,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: Miembro
  ) {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.createForm();
  }

  createForm() {
    const currentIglesiaId = this.authService.getCurrentIglesiaId();
    this.miembroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      ci: ['', Validators.required],
      fechaNac: ['', Validators.required],
      celular: ['', Validators.required],
      sexo: ['', Validators.required],
      // Obligatorios: nombre, apellido, CI, fecha de nacimiento, sexo y celular.
      // El resto es opcional y puede completarse después editando el miembro.
      direccion: [''],
      fechaConvercion: [''],
      lugarConvercion: [''],
      interventores: [''],
      detalles: [''],
      iglesiaId: [this.isAdmin ? '' : (currentIglesiaId || ''), Validators.required]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.editMode = true;
      this.patchFormValues();
    }
    if (this.isAdmin) {
      this.loadActiveChurches();
    }
  }

  loadActiveChurches() {
    this.loadingChurches = true;
    this.iglesiaService.getIglesias().subscribe({
      next: (response) => {
        this.iglesias = (response.datos || []).filter(i => i.estado);
        this.loadingChurches = false;
      },
      error: (err) => {
        console.error('[MiembroCreate] Error loading churches:', err);
        this.loadingChurches = false;
      }
    });
  }

  patchFormValues() {
    if (this.data) {
      if (this.data.uriFoto) {
        this.imagePreview = this.data.uriFoto;
      }
      this.miembroForm.patchValue({
        ...this.data
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      const dialogRef = this.dialog.open(ImageCropDialogComponent, {
        data: { imageFile: file },
        width: '400px',
        maxWidth: '95vw',
        disableClose: true
      });
      
      dialogRef.afterClosed().subscribe((croppedFile: File) => {
        if (croppedFile) {
          this.selectedFile = croppedFile;
          const reader = new FileReader();
          reader.onload = () => {
            this.imagePreview = reader.result as string;
          };
          reader.readAsDataURL(this.selectedFile);
        } else {
          input.value = '';
        }
      });
    }
  }

  removePhoto() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  public async onSubmit() {
    if (this.miembroForm.valid) {
      const formValue = this.miembroForm.value;

      const miembroData: Partial<Miembro> = {
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        ci: formValue.ci,
        fechaNac: formValue.fechaNac,
        celular: formValue.celular,
        sexo: formValue.sexo,
        direccion: formValue.direccion,
        fechaConvercion: formValue.fechaConvercion,
        lugarConvercion: formValue.lugarConvercion,
        interventores: formValue.interventores,
        detalles: formValue.detalles,
        uriFoto: ''
      };

      try {
        // 1. Create the Miembro
        const response = await this.miembroService.createMiembro(miembroData).toPromise();
        const miembroId = response.datos.id;

        // 2. Upload photo if selected
        if (this.selectedFile && miembroId) {
          await this.miembroService.uploadPhoto(miembroId, this.selectedFile).toPromise();
        }

        // 3. Assign the Miembro to the selected Iglesia
        const iglesiaId = formValue.iglesiaId;
        if (miembroId && iglesiaId) {
          await this.miembroIglesiaService.createMiembroIglesia({
            miembroId: miembroId,
            iglesiaId: Number(iglesiaId)
          }).toPromise();
        }

        // Se devuelve el miembro creado (con su id) para que quien abrió el diálogo
        // pueda usarlo directamente, p. ej. seleccionarlo al registrar una participación.
        // Sigue siendo "truthy", por lo que los usos existentes (if (result)) no cambian.
        this.dialogRef.close({ ...miembroData, ...(response?.datos || {}), id: miembroId });
      } catch (error: any) {
        console.error('Error al crear el miembro:', error);
        const errorMsg = error?.error?.message || 'Error al crear el miembro. Si el problema persiste, por favor contacte con soporte técnico.';
        this.snackBar.open(errorMsg, 'Cerrar', { duration: 5000 });
      }
    }
  }
}
