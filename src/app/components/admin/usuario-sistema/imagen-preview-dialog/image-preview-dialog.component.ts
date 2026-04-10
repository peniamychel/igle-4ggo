import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-image-preview-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
    <div class="image-preview-container">
      <button mat-icon-button class="close-button" (click)="onClose()">
        <mat-icon>close</mat-icon>
      </button>
      <img [src]="data.imageUrl" [alt]="data.alt">
    </div>
  `,
    styles: [`
    .image-preview-container {
      position: relative;
      padding: 20px;
      text-align: center;
    }

    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1;
    }

    img {
      max-width: 90vw;
      max-height: 80vh;
      object-fit: contain;
    }
  `]
})
export class ImagePreviewDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ImagePreviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string; alt: string }
    ) {}

    onClose(): void {
        this.dialogRef.close();
    }
}