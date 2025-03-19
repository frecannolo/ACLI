import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsPrenotazioneDialog } from './details-prenotazione.dialog';

describe('OpenDetailsPrenotazioneComponent', () => {
  let component: DetailsPrenotazioneDialog;
  let fixture: ComponentFixture<DetailsPrenotazioneDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailsPrenotazioneDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsPrenotazioneDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
