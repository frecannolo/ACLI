import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelPrenotazioneDialog } from './del-prenotazione.dialog';

describe('DelPrenotazioneComponent', () => {
  let component: DelPrenotazioneDialog;
  let fixture: ComponentFixture<DelPrenotazioneDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DelPrenotazioneDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DelPrenotazioneDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
