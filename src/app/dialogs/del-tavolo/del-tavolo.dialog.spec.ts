import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelTavoloDialog } from './del-tavolo.dialog';

describe('DelTavoloComponent', () => {
  let component: DelTavoloDialog;
  let fixture: ComponentFixture<DelTavoloDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DelTavoloDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DelTavoloDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
