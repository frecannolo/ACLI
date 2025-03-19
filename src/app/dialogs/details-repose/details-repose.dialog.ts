import {Component, Inject} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-details-repose',
  templateUrl: './details-repose.dialog.html',
  styleUrls: [
    './details-repose.dialog.css',
    '../dialog.css'
  ],
  standalone: true,
  imports: [
    MatButton,
    MatIcon
  ]
})
export class DetailsReposeDialog {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public myself: MatDialogRef<DetailsReposeDialog>) {
    myself.disableClose = true;
  }

  conferma(): void {
    this.myself.close();
    this.data.next();
  }
}
