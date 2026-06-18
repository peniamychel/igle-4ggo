import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MiembroIglesiaService } from '../../../../../core/services/miembro-iglesia.service';
import { IglesiaService } from '../../../../../core/services/iglesia.service';
import { Miembro } from '../../../../../core/models/miembro.model';
import { Iglesia } from '../../../../../core/models/iglesia.model';
import { MiembroIglesia } from '../../../../../core/models/miembro-iglesia.model';

@Component({
  selector: 'app-miembro-iglesia-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule
  ],
  templateUrl: './miembro-iglesia-detail.component.html',
  styleUrls: ['./miembro-iglesia-detail.component.css']
})
export class MiembroIglesiaDetailComponent implements OnInit {
  historialIglesias: Array<{
    miembroIglesia: MiembroIglesia;
    iglesia: Iglesia;
    iglesiaDestino?: Iglesia;
  }> = [];

  constructor(
    private miembroIglesiaService: MiembroIglesiaService,
    private iglesiaService: IglesiaService,
    public dialogRef: MatDialogRef<MiembroIglesiaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { miembro: Miembro; iglesia: Iglesia }
  ) {}

  ngOnInit() {
    this.loadHistorial();
  }

  loadHistorial() {
    if (!this.data.miembro.id) return;
    this.miembroIglesiaService.getHistorialMiembro(this.data.miembro.id).subscribe(response => {
      const miembroIglesias = response.datos;

      this.iglesiaService.getIglesias().subscribe(iglesiasResponse => {
        this.historialIglesias = miembroIglesias.map(mi => ({
          miembroIglesia: mi,
          iglesia: iglesiasResponse.datos.find(i => i.id === mi.iglesiaId)!,
          iglesiaDestino: mi.iglesiaDestinoId ? iglesiasResponse.datos.find(i => i.id === mi.iglesiaDestinoId) : undefined
        }));
      });
    });
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
