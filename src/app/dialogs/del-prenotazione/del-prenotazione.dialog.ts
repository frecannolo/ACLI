import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DetailsPrenotazioneDialog} from "../details-prenotazione/details-prenotazione.dialog";
import {MatIcon} from "@angular/material/icon";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'app-del-prenotazione',
  templateUrl: './del-prenotazione.dialog.html',
  styleUrls: [
    './del-prenotazione.dialog.css',
    '../dialog.css'
  ],
  standalone: true,
  imports: [
    MatIcon,
    MatButton
  ]
})
export class DelPrenotazioneDialog {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public myself: MatDialogRef<DelPrenotazioneDialog>, public dialog: MatDialog) {
    myself.disableClose = true;
  }

  close(): void {
    this.myself.close();
    this.dialog.open(DetailsPrenotazioneDialog, { data: this.data });
  }

  del(): void {
    this.myself.close();
    this.data.del();
  }
}
