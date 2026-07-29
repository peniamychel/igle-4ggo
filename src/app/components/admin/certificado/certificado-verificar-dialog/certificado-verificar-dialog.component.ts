import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Html5Qrcode } from 'html5-qrcode';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-certificado-verificar-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  templateUrl: './certificado-verificar-dialog.component.html',
  styleUrls: ['./certificado-verificar-dialog.component.css']
})
export class CertificadoVerificarDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  verificarForm: FormGroup;
  selectedTab = 0;
  
  // HTML5 QR Scanner
  html5Qrcode?: Html5Qrcode;
  scannerId = 'qr-scanner-reader';
  isCameraActive = false;
  cameraErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CertificadoVerificarDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.verificarForm = this.fb.group({
      codigoManual: ['', [
        Validators.required, 
        Validators.minLength(4), 
        Validators.maxLength(4),
        Validators.pattern('^[a-zA-Z0-9]+$')
      ]]
    });
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    // Retrasar el inicio para asegurar que el div de renderizado de la cámara exista
    setTimeout(() => {
      this.startScanner();
    }, 300);
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedTab = event.index;
    if (this.selectedTab === 0) {
      this.startScanner();
    } else {
      this.stopScanner();
    }
  }

  startScanner() {
    if (this.isCameraActive) return;
    
    this.cameraErrorMessage = '';
    
    try {
      this.html5Qrcode = new Html5Qrcode(this.scannerId);
      this.html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          this.handleScannedCode(decodedText);
        },
        (errorMessage) => {
          // Callback silencioso para errores continuos de búsqueda de QR
        }
      ).then(() => {
        this.isCameraActive = true;
      }).catch(err => {
        console.error('Error al iniciar cámara:', err);
        this.cameraErrorMessage = 'No se pudo acceder a la cámara. Asegúrese de otorgar permisos o ingrese el código manualmente.';
        this.isCameraActive = false;
      });
    } catch (e) {
      console.error('Exception on scanner start:', e);
      this.cameraErrorMessage = 'Error al inicializar el escáner de QR.';
    }
  }

  stopScanner() {
    if (this.html5Qrcode && this.isCameraActive) {
      this.html5Qrcode.stop().then(() => {
        this.isCameraActive = false;
        this.html5Qrcode = undefined;
      }).catch(err => {
        console.error('Error al detener cámara:', err);
      });
    }
  }

  handleScannedCode(scannedText: string) {
    // Detener escaneo inmediatamente para evitar lanzamientos múltiples
    this.stopScanner();

    // Extraer el código único (el último tramo de la URL)
    // Ej: http://localhost:8092/verificar-certificado/N5LK -> N5LK
    let code = scannedText.trim();
    if (code.includes('/')) {
      // Se descartan los tramos vacíos para tolerar una barra final
      const parts = code.split('/').filter(p => p.trim().length > 0);
      code = parts[parts.length - 1] || '';
    }
    code = code.trim().toUpperCase();

    // El QR lleva el token de verificación (UUID). Se acepta también el código
    // corto impreso: 4 caracteres de base, más si al generarlo hubo choques, y
    // hasta 9 en los registros antiguos.
    const esToken = /^[A-Za-z0-9_-]{14,40}$/.test(code);
    if (esToken || /^[A-Z0-9]{4,12}$/.test(code)) {
      this.verifyCode(code);
    } else {
      this.showSnackBar('El código QR escaneado no tiene un formato válido.', 'error');
      // Re-iniciar escáner después de una breve pausa
      setTimeout(() => {
        this.startScanner();
      }, 2000);
    }
  }

  onSubmitManual() {
    if (this.verificarForm.valid) {
      const code = this.verificarForm.get('codigoManual')?.value.toUpperCase();
      this.verifyCode(code);
    }
  }

  verifyCode(code: string) {
    const verificationUrl = `${environment.apiUrl}/verificar-certificado/${code}`;
    window.open(verificationUrl, '_blank');
    this.dialogRef.close();
  }

  showSnackBar(message: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }
}
