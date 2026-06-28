import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ImageCropData {
  imageFile: File;
}

@Component({
  selector: 'app-image-crop-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './image-crop-dialog.component.html',
  styleUrls: ['./image-crop-dialog.component.css']
})
export class ImageCropDialogComponent implements OnInit {
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('cropContainer') cropContainer!: ElementRef<HTMLDivElement>;

  imageUrl: string = '';
  zoom: number = 1;
  minZoom: number = 1;
  maxZoom: number = 4;

  baseWidth: number = 0;
  baseHeight: number = 0;

  translateX: number = 0;
  translateY: number = 0;
  private isDragging = false;
  private startX = 0;
  private startY = 0;

  constructor(
    private dialogRef: MatDialogRef<ImageCropDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageCropData
  ) {}

  ngOnInit() {
    if (this.data && this.data.imageFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(this.data.imageFile);
    }
  }

  onImageLoad() {
    this.resetImagePosition();
  }

  resetImagePosition() {
    const img = this.imageElement.nativeElement;
    const container = this.cropContainer.nativeElement;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    // Fit image inside container boundaries
    if (imgRatio > containerRatio) {
      this.baseHeight = containerHeight;
      this.baseWidth = containerHeight * imgRatio;
    } else {
      this.baseWidth = containerWidth;
      this.baseHeight = containerWidth / imgRatio;
    }

    // Set styles explicitly
    img.style.width = `${this.baseWidth}px`;
    img.style.height = `${this.baseHeight}px`;
    img.style.left = '50%';
    img.style.top = '50%';
    img.style.marginLeft = `${-this.baseWidth / 2}px`;
    img.style.marginTop = `${-this.baseHeight / 2}px`;

    // Make sure the image covers the crop circle (which is 70% of container)
    const cropSize = Math.min(containerWidth, containerHeight) * 0.7;
    const minZoomX = cropSize / this.baseWidth;
    const minZoomY = cropSize / this.baseHeight;
    this.minZoom = Math.max(minZoomX, minZoomY);
    
    this.zoom = this.minZoom;
    this.translateX = 0;
    this.translateY = 0;
    
    this.applyTransform();
  }

  onPointerDown(event: PointerEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX - this.translateX;
    this.startY = event.clientY - this.translateY;
    this.cropContainer.nativeElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDragging) return;
    this.translateX = event.clientX - this.startX;
    this.translateY = event.clientY - this.startY;
    this.constrainBounds();
    this.applyTransform();
  }

  onPointerUp(event: PointerEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.cropContainer.nativeElement.releasePointerCapture(event.pointerId);
  }

  onWheelZoom(event: WheelEvent) {
    event.preventDefault();
    const zoomStep = 0.05;
    if (event.deltaY < 0) {
      this.zoom = Math.min(this.maxZoom, this.zoom + zoomStep);
    } else {
      this.zoom = Math.max(this.minZoom, this.zoom - zoomStep);
    }
    this.constrainBounds();
    this.applyTransform();
  }

  zoomIn() {
    this.zoom = Math.min(this.maxZoom, this.zoom + 0.2);
    this.constrainBounds();
    this.applyTransform();
  }

  zoomOut() {
    this.zoom = Math.max(this.minZoom, this.zoom - 0.2);
    this.constrainBounds();
    this.applyTransform();
  }

  constrainBounds() {
    const container = this.cropContainer.nativeElement;

    const scaledWidth = this.baseWidth * this.zoom;
    const scaledHeight = this.baseHeight * this.zoom;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const cropSize = Math.min(containerWidth, containerHeight) * 0.7;

    // Center of the crop box is container center
    const cropLeft = (containerWidth - cropSize) / 2;
    const cropRight = cropLeft + cropSize;
    const cropTop = (containerHeight - cropSize) / 2;
    const cropBottom = cropTop + cropSize;

    // Image boundaries based on center point + translateX/Y
    const imgCenterX = containerWidth / 2 + this.translateX;
    const imgCenterY = containerHeight / 2 + this.translateY;

    // Limit translation so crop circle is always within scaled image boundary
    const minCenterX = cropRight - scaledWidth / 2;
    const maxCenterX = cropLeft + scaledWidth / 2;
    const minCenterY = cropBottom - scaledHeight / 2;
    const maxCenterY = cropTop + scaledHeight / 2;

    let targetCenterX = imgCenterX;
    let targetCenterY = imgCenterY;

    if (scaledWidth >= cropSize) {
      targetCenterX = Math.max(minCenterX, Math.min(maxCenterX, imgCenterX));
    }
    if (scaledHeight >= cropSize) {
      targetCenterY = Math.max(minCenterY, Math.min(maxCenterY, imgCenterY));
    }

    this.translateX = targetCenterX - containerWidth / 2;
    this.translateY = targetCenterY - containerHeight / 2;
  }

  applyTransform() {
    const img = this.imageElement.nativeElement;
    img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
  }

  crop() {
    const img = this.imageElement.nativeElement;
    const container = this.cropContainer.nativeElement;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const cropSize = Math.min(containerWidth, containerHeight) * 0.7;
    
    // Top-left corner of the crop circle inside the container
    const cropLeft = (containerWidth - cropSize) / 2;
    const cropTop = (containerHeight - cropSize) / 2;

    // Current size of scaled image on screen
    const scaledWidth = this.baseWidth * this.zoom;
    const scaledHeight = this.baseHeight * this.zoom;

    // Top-left of the image on the screen relative to container
    const imgX = containerWidth / 2 + this.translateX - scaledWidth / 2;
    const imgY = containerHeight / 2 + this.translateY - scaledHeight / 2;

    // Offset of the crop circle relative to the image top-left
    const offsetX = cropLeft - imgX;
    const offsetY = cropTop - imgY;

    // Scale from screen dimensions to original image dimensions
    const scaleToNatural = img.naturalWidth / scaledWidth;

    // Coords on the source original image
    const sourceX = offsetX * scaleToNatural;
    const sourceY = offsetY * scaleToNatural;
    const sourceWidth = cropSize * scaleToNatural;
    const sourceHeight = cropSize * scaleToNatural;

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      400,
      400
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], this.data.imageFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        this.dialogRef.close(croppedFile);
      } else {
        this.dialogRef.close();
      }
    }, 'image/jpeg', 0.9);
  }

  cancel() {
    this.dialogRef.close();
  }
}
