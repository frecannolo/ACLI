import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DetailsTavoloDialog} from "../details-tavolo/details-tavolo.dialog";
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'app-del-tavolo',
  templateUrl: './del-tavolo.dialog.html',
  styleUrls: [
    './del-tavolo.dialog.css',
    '../dialog.css'
  ],
  standalone: true,
  imports: [
    MatButton,
    MatIcon
  ]
})
export class DelTavoloDialog {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public myself: MatDialogRef<DelTavoloDialog>, public dialog: MatDialog) {
    myself.disableClose = true;
  }

  close(): void {
    this.myself.close();
    this.dialog.open(DetailsTavoloDialog, { data: this.data });
  }

  del(): void {
    this.myself.close();
    this.data.del();
  }
}
