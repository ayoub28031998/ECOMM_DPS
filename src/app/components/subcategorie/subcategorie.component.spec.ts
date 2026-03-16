import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubcategorieComponent } from './subcategorie.component';

describe('SubcategorieComponent', () => {
  let component: SubcategorieComponent;
  let fixture: ComponentFixture<SubcategorieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubcategorieComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SubcategorieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
