import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificadoRenderComponent } from './certificado-render.component';

describe('CertificadoRenderComponent', () => {
  let component: CertificadoRenderComponent;
  let fixture: ComponentFixture<CertificadoRenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificadoRenderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificadoRenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
