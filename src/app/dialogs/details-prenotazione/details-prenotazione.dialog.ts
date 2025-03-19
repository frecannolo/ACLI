import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatIcon} from "@angular/material/icon";
import {MatButton} from "@angular/material/button";
import {DelPrenotazioneDialog} from "../del-prenotazione/del-prenotazione.dialog";

@Component({
  selector: 'app-open-details-prenotazione',
  templateUrl: './details-prenotazione.dialog.html',
  styleUrls: [
    './details-prenotazione.dialog.css',
    '../dialog.css'
  ],
  standalone: true,
  imports: [
    MatIcon,
    MatButton
  ]
})
export class DetailsPrenotazioneDialog {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public myself: MatDialogRef<DetailsPrenotazioneDialog>, public dialog: MatDialog) {
    myself.disableClose = true;
  }

  getBgColor = (): string => `background-color: ${this.data.color};`;

  mod_places(): void {
    this.myself.close();
    this.data.mod_places();
  }

  mod_dati(): void {
    this.myself.close();
    this.data.mod_dati()
  }

  del(): void {
    this.myself.close();
    this.dialog.open(DelPrenotazioneDialog, { data: this.data });
  }

  close(): void {
    try {
      this.myself.close();
    } catch(e) { }
  }
}
