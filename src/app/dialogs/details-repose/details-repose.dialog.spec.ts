import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsReposeDialog } from './details-repose.dialog';

describe('DetailsReposeComponent', () => {
  let component: DetailsReposeDialog;
  let fixture: ComponentFixture<DetailsReposeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailsReposeDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsReposeDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
