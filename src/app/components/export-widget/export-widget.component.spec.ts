import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportWidgetComponent } from './export-widget.component';

describe('ExportWidgetComponent', () => {
  let component: ExportWidgetComponent;
  let fixture: ComponentFixture<ExportWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
