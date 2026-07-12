import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CertificadoDesignerComponent } from './certificado-designer.component';

describe('CertificadoDesignerComponent', () => {
  let component: CertificadoDesignerComponent;
  let fixture: ComponentFixture<CertificadoDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificadoDesignerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificadoDesignerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
