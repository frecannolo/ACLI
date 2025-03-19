import {Component, Inject} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DelTavoloDialog} from "../del-tavolo/del-tavolo.dialog";

@Component({
  selector: 'app-details-tavolo',
  templateUrl: './details-tavolo.dialog.html',
  styleUrls: [
    './details-tavolo.dialog.css',
    '../dialog.css'
  ],
  standalone: true,
  imports: [
    MatButton,
    MatIcon
  ]
})
export class DetailsTavoloDialog {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public myself: MatDialogRef<DetailsTavoloDialog>, public dialog: MatDialog) {
    myself.disableClose = true;
  }

  del(): void {
    this.myself.close();
    this.dialog.open(DelTavoloDialog, { data: this.data });
  }

  mod_dati(): void {
    this.myself.close();
    this.data.mod_dati()
  }
}
