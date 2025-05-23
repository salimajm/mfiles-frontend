import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataViewerComponent } from './metadata-viewer.component';

describe('MetadataViewerComponent', () => {
  let component: MetadataViewerComponent;
  let fixture: ComponentFixture<MetadataViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetadataViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
