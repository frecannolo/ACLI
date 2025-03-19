import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsTavoloDialog } from './details-tavolo.dialog';

describe('DetailsTavoloComponent', () => {
  let component: DetailsTavoloDialog;
  let fixture: ComponentFixture<DetailsTavoloDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailsTavoloDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsTavoloDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
