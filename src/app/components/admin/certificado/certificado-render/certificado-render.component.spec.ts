import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CertificadoRenderComponent } from './certificado-render.component';

describe('CertificadoRenderComponent', () => {
  let component: CertificadoRenderComponent;
  let fixture: ComponentFixture<CertificadoRenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificadoRenderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { participacion: {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificadoRenderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
