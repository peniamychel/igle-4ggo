import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificadoDesignerComponent } from './certificado-designer.component';

describe('CertificadoDesignerComponent', () => {
  let component: CertificadoDesignerComponent;
  let fixture: ComponentFixture<CertificadoDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificadoDesignerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificadoDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
