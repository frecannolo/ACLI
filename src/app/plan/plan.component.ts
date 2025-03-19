import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {DetailsPrenotazioneDialog} from "../dialogs/details-prenotazione/details-prenotazione.dialog";
import {DetailsTavoloDialog} from "../dialogs/details-tavolo/details-tavolo.dialog";
import {DetailsReposeDialog} from "../dialogs/details-repose/details-repose.dialog";

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrl: './plan.component.css'
})
export class PlanComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement> | undefined;

  readonly DIM_PUNTI: number = 2;
  readonly GAP_PUNTI: number = 35;
  readonly COLOR_NEW_PREN: string = 'rgba(63,163,50,0.65)';
  readonly COLOR_STROKE_NEW_PREN: string = '#2d7025';

  DIM_BACKGROUND_WIDTH: number = 0;
  DIM_BACKGROUND_HEIGHT: number = 0;
  CTX: CanvasRenderingContext2D | undefined;

  ref: any = {
    x: 0,
    y: 0,
    first_x: 0,
    first_y: 0
  };
  prevX: number = 0;
  prevY: number = 0;

  lefts: number[] = [];
  tops: number[] = [];

  tables: any = [];
  prenotazioni: any = [];

  zoom: number = 1;
  timeout: any;
  cursorClass: 'pointer' | 'grabbing' | 'auto' | 'crosshair' = 'auto';
  action: 'add-table' | 'add-pren' | 'move-table' | 'mod-posti' | 'mod-pren' | 'mod-pren-posti' | 'search' | 'sel-table' | 'mod-table' | '' = '';
  onPlanMoving: boolean = false;
  onTableMoving: boolean = false;
  onPrenCreation: boolean = false;
  onModTable: boolean = false;

  showSpinner: boolean = false;

  inputsTable: any = {
    row: '',
    or: -1
  };
  tempClickedTable: boolean = false;
  coordsTable: any = { };

  inputsPrenotazione: any = {
    nome: '',
    numero: '',
    disposizione: -1,
    color: '#000000'
  };
  tempPostiPrenotazioni: any[] = [];
  tempPrenotazione: any;
  tempTable: any;

  search: string = '';

  flushTouchClick: boolean = false;
  isOnEndTavolo: boolean = false;

  constructor(public http: HttpClient, public snackbar: MatSnackBar, public dialog: MatDialog) {
    document.addEventListener('contextmenu', event => event.preventDefault());
    this.doRequests();
    this.draw();
  }

  ngOnInit() {
    // @ts-ignore
    let div: HTMLElement = document.getElementById('canvas-container');

    this.DIM_BACKGROUND_WIDTH = div.clientWidth;
    this.DIM_BACKGROUND_HEIGHT = div.clientHeight;
    this.draw();
  }

  ngAfterViewInit() {
    // @ts-ignore
    this.CTX = this.canvas?.nativeElement.getContext('2d');
    this.draw();
  }

  doRequests(): void {
    this.showSpinner = true;
    this.http.get('/api.php?command=get_tables').subscribe((resTables: any) => {
      this.tables = resTables;
      this.draw();
      this.http.get('/api.php?command=get_prenotazioni').subscribe((resPrenotazioni: any) => {
        this.prenotazioni = resPrenotazioni;
        this.setPrenotazioni();
        this.showSpinner = false;

        this.draw();
        //this.selectNewPlaceStr(9);
      });
    });
  }

  setPrenotazioni(): void {
    for(let ta of this.tables)
      ta.prenotazioni = [];

    for(let pre of this.prenotazioni)
      for(let ta of this.tables)
        for (let po of pre.posti)
          if(po.id_tavolo == ta.id)
            ta.prenotazioni.push({
              id: po.id,
              color: pre.color,
              id_prenotazione: pre.id,
              str: `${po.id_tavolo}_${po.index_row}_${po.index_col}`,
              x: ta.x + po.index_col * this.GAP_PUNTI,
              y: ta.y + po.index_row * this.GAP_PUNTI
            });
  }

  getCorrectDistanceX = (): number => this.ref.x - this.ref.first_x;
  getCorrectDistanceY = (): number => this.ref.y - this.ref.first_y;

  __handleClick(X: number, Y: number): void {
    this.prevX = X;
    this.prevY = Y;

    this.cursorClass = 'grabbing';
  }

  handleReleaseCLick(): void {
    if(this.action == 'add-table' || this.action == 'add-pren' || this.action == 'mod-pren' || this.action == 'mod-table')
      return;

    if(this.onTableMoving) {
      this.coordsTable.x += this.getNear(this.coordsTable.x + this.getCorrectDistanceX(), this.lefts[1]);
      this.coordsTable.y += this.getNear(this.coordsTable.y + this.getCorrectDistanceY(), this.tops[1]);

      let t: any = {
        x: this.coordsTable.x,
        y: this.coordsTable.y,
        orientamento: this.inputsTable.or,
        row: this.inputsTable.row,
        places: this.inputsTable.row * 2
      };

      if(!this.coordsTable.id && !this.onModTable) {
        if (this.isColliding(t))
          this.openSnackbar('Impossibile creare qui un nuovo tavolo!');
        else {
          this.openSnackbar('Tavolo creato con successo!');
          this.http.post('/api.php?command=add_table', t).subscribe(res => {
            t.id = res;
            t.prenotazioni = [];
            this.tables.push(t);
          });
        }
      } else {
        if(this.isColliding(t)) {
          this.openSnackbar('Impossibile spostare qui il tavolo!');

          if(this.onModTable)
            this.doRequests();
          else
            this.tables.push({
              id: this.coordsTable.id,
              x: this.coordsTable.old_x,
              y: this.coordsTable.old_y,
              orientamento: this.inputsTable.or,
              row: this.coordsTable.row,
              prenotazioni: this.tempPostiPrenotazioni
            });
        } else {
          for(let tpp of this.tempPostiPrenotazioni) {
            tpp.x += this.coordsTable.x - this.coordsTable.old_x;
            tpp.y += this.coordsTable.y - this.coordsTable.old_y;
          }

          let t = {
            id: this.coordsTable.id,
            x: this.coordsTable.x,
            y: this.coordsTable.y,
            orientamento: this.inputsTable.or,
            row: this.coordsTable.row,
            prenotazioni: this.tempPostiPrenotazioni
          };
          this.tables.push(t);

          if(this.onModTable)
            this.reqModifyTable(this.coordsTable.x, this.coordsTable.y);
          else {
            this.openSnackbar('Tavolo spostato con successo!');
            this.http.post('/api.php?command=mod_coordinates_table', t).subscribe();
          }
        }
      }

      this.action = '';
    }

    this.onTableMoving = false;
    this.onPlanMoving = false;
    this.cursorClass = 'auto';

    this.draw();
  }

  handleClickOpenDialog(ev: MouseEvent | PointerEvent): void {
    if(this.action == 'add-table' || this.action == 'add-pren' || this.action == 'mod-pren' || this.action == 'mod-table')
      return;

    let ta = this.getTableClicked(ev.clientX, ev.clientY);
    if(!ta)
      return;
    else if(ta && this.action == 'sel-table')
      this.openRecapTavolo(ta);
    else {
      let po = this.getPostoClicked(ev.clientX, ev.clientY, ta);
      if (po)
        this.openRecapPrenotazione(po);
    }
  }

  handleClick(X: number, Y: number, evType: 'mouse' | 'touch', val: boolean): void {
    if(this.isOnEndTavolo) {
      //this.isOnEndTavolo = false;
      this.__startTempCLickedTable(X, Y, evType);
      this.draw();
      return;
    }

    if(this.action == 'add-table' || this.action == 'add-pren' || this.action == 'mod-pren' || this.action == 'mod-table')
      return;

    let ta = this.getTableClicked(X, Y);
    if(!ta && this.onTableMoving)
      return;

    if(ta && this.action == 'move-table')
      this.prepareMoveTable(ta);

    if(this.action == 'move-table' || this.action == 'sel-table') {
      this.__handleClick(X, Y);
      return;
    }

    if(ta && (this.onPrenCreation || this.action == 'mod-posti' || this.action == 'mod-pren-posti')) {
      for (let i = 0; i < (ta.orientamento == 1 ? ta.row : 2); i++)
        for (let j = 0; j < (ta.orientamento == 0 ? ta.row : 2); j++) {
          let xs = ta.x + this.getCorrectDistanceX() + j * this.GAP_PUNTI;
          let ys = ta.y + this.getCorrectDistanceY() + i * this.GAP_PUNTI;

          if (X >= xs && X <= xs + this.GAP_PUNTI && Y >= ys && Y <= ys + this.GAP_PUNTI) {
            let t = [];
            let toRemove: boolean = false
            for (let pr of this.tempPostiPrenotazioni) {
              let [id_tavolo, index_row, index_col] = pr.str.split('_');
              if (parseInt(id_tavolo) == ta.id && parseInt(index_col) == j && parseInt(index_row) == i)
                toRemove = true;
              else
                t.push(pr);
            }
            this.tempPostiPrenotazioni = t;

            let isOccupato: boolean = false;
            for (let pr of ta.prenotazioni)
              if (pr.str == `${ta.id}_${i}_${j}`) {
                isOccupato = true;
                break;
              }

            if (!isOccupato && !toRemove && this.tempPostiPrenotazioni.length < parseInt(this.inputsPrenotazione.numero))
              this.tempPostiPrenotazioni.push({
                str: `${ta.id}_${i}_${j}`,
                x: xs - this.getCorrectDistanceX(),
                y: ys - this.getCorrectDistanceY(),
              });
          }
        }
    } else if(ta) {
      let posto = this.getPostoClicked(X, Y, ta);
      if(posto) {
        //this.openRecapPrenotazione(posto);
      }else
        this.prepareMoveTable(ta);
    }
    else
      this.onPlanMoving = true;

    this.__handleClick(X, Y);
  }

  handleMove(X: number, Y: number, evType: 'mouse' | 'touch'): void {
    if(evType == 'mouse' && (this.action == 'add-table' || this.action == 'add-pren' || this.action == 'mod-pren' || this.action == 'mod-table'))
      return;

    this.cursorClass = 'auto';

    if(this.onPlanMoving) {
      let dx = (X - this.prevX) / this.zoom;
      let dy = (Y - this.prevY) / this.zoom
      this.ref.x += dx;
      this.ref.y += dy;
    } else if(this.onTableMoving) {
      this.coordsTable.x += (X - this.prevX) / this.zoom;
      this.coordsTable.y += (Y - this.prevY) / this.zoom;
    } else if(this.getTableClicked(X, Y))
      this.cursorClass = this.onTableMoving? 'crosshair': 'pointer';

    this.prevX = X;
    this.prevY = Y;
    this.draw();
  }

  handleClickMouse(ev: MouseEvent): void {
    this.handleClick(ev.clientX, ev.clientY, 'mouse', true);
  }

  handleMouseMove(ev: MouseEvent): void {
    this.handleMove(ev.clientX, ev.clientY, 'mouse');
  }

  handleClickTouch(ev: TouchEvent, val: boolean = true): void {
    if(this.flushTouchClick) {
      this.flushTouchClick = false;
      this.handleClickTouch(ev, false);
    }

    try {
      let X: number = ev.touches[0].clientX;
      let Y: number = ev.touches[0].clientY;

      /*if((this.action == 'add-table' && this.canAddTable()) || (this.action == 'mod-table' && this.canModifyTable())) {
        // @ts-ignore
        let coords = document.getElementById('table').getBoundingClientRect();
        if(X >= coords.x && X <= coords.x + coords.width && Y >= coords.y && Y <= coords.y + coords.height) {
          this.isOnEndTavolo = true;
        }
      }*/
      this.handleClick(X, Y, 'touch', val);
      this.flushTouchClick = true;
    } catch(e) { }
  }

  handleTouchMove(ev: TouchEvent): void {
    try {
      let X: number = ev.touches[0].clientX;
      let Y: number = ev.touches[0].clientY;
      this.handleMove(X, Y, 'touch');
    } catch(e) { }
  }

  // ------- //

  draw(): void {
    this.CTX?.clearRect(0, 0, this.DIM_BACKGROUND_WIDTH, this.DIM_BACKGROUND_HEIGHT);
    this.drawPunti();
    this.drawTables();
    this.drawPrenotazioni();

    this.drawTempPrenotazione();
    this.drawTableMoving();
  }

  drawPunti(): void {
    let lefts: number[] = [];
    let tops: number[] = [];

    let gap = this.GAP_PUNTI * this.zoom;
    let dimPunti = this.DIM_PUNTI * this.zoom;

    for(let left = Math.max(this.ref.x * this.zoom, 0); left >= 0; left -= gap)
      lefts.push(left);
    for(let left = Math.min(this.ref.x * this.zoom, this.DIM_BACKGROUND_WIDTH); left <= this.DIM_BACKGROUND_WIDTH - this.DIM_PUNTI; left += gap)
      lefts.push(left);

    for(let top = Math.max(this.ref.y * this.zoom, 0); top >= 0; top -= gap)
      tops.push(top);
    for(let top = Math.min(this.ref.y * this.zoom, this.DIM_BACKGROUND_HEIGHT); top <= this.DIM_BACKGROUND_HEIGHT - this.DIM_PUNTI; top += gap)
      tops.push(top);

    this.lefts = lefts;
    this.tops = tops;

    this.CTX?.beginPath();
    this.setFillStyle('#9f9f9f');
    for(let le of lefts)
      for(let to of tops)
        this.CTX?.fillRect(le, to, dimPunti, dimPunti);
    this.CTX?.closePath();
  }

  drawTableMoving(): void {
    if(!this.onTableMoving)
      return;

    this.CTX?.beginPath();
    this.setStrokeStyle('#B8860BFF');
    this.setFillStyle('#DAA520FF')

    this.CTX?.rect(
      this.coordsTable.x + this.getCorrectDistanceX(),
      this.coordsTable.y + this.getCorrectDistanceY(),
      this.GAP_PUNTI * (this.inputsTable.or == 0? parseInt(this.inputsTable.row): 2),
      this.GAP_PUNTI * (this.inputsTable.or == 1? parseInt(this.inputsTable.row): 2)
    );
    this.CTX?.fill();
    this.CTX?.stroke();

    this.CTX?.closePath();
  }

  drawTables(): void {
    for(let ta of this.tables) {
      this.CTX?.beginPath();
      this.setStrokeStyle('#6e6e6e');
      this.setFillStyle('rgb(234,234,234)');

      this.CTX?.rect(
        ta.x + this.getCorrectDistanceX(),
        ta.y + this.getCorrectDistanceY(),
        this.GAP_PUNTI * (ta.orientamento == 0 ? parseInt(ta.row) : 2),
        this.GAP_PUNTI * (ta.orientamento == 1 ? parseInt(ta.row) : 2)
      );
      this.CTX?.fill();
      this.CTX?.stroke();

      this.CTX?.closePath();
    }
  }

  drawPrenotazioni(): void {
    for(let ta of this.tables)
      this.__drawPrenotazione(ta.prenotazioni, false);
  }

  drawTempPrenotazione(): void {
    if(!this.onPrenCreation && this.action != 'mod-posti' && this.action != 'mod-pren-posti')
      return;
    this.__drawPrenotazione(this.tempPostiPrenotazioni, true);
  }

  __drawPrenotazione(prenotazioni: any[], areNew: boolean): void {
    let pren;
    if(this.action == 'search')
      try {
        let ids = [];
        for(let pr of this.prenotazioni)
          if(pr.nome.toUpperCase().includes(this.search.trim().toUpperCase()))
            ids.push(pr.id);
        pren = prenotazioni.filter((pr: any) => ids.includes(pr.id_prenotazione));
      } catch (err) {
        pren = prenotazioni;
      }
    else
      pren = prenotazioni;


    let strs = [];
    for(let co of pren)
      strs.push(co.str);

    for(let co of pren) {
      this.CTX?.beginPath();
      this.setFillStyle(areNew? this.COLOR_NEW_PREN: `${co.color}cc`);

      let x = co.x + this.getCorrectDistanceX();
      let y = co.y + this.getCorrectDistanceY();

      this.CTX?.rect(x, y, this.GAP_PUNTI, this.GAP_PUNTI);
      this.CTX?.fill();
      this.CTX?.closePath();

      let [index_tavolo, i, j] = co.str.split('_');
      let index_row = parseInt(i);
      let index_col = parseInt(j);

      this.CTX?.beginPath();
      this.setStrokeStyle(areNew? this.COLOR_STROKE_NEW_PREN: co.color);
      this.setLineWidth(2);

      if(!strs.includes(`${index_tavolo}_${index_row - 1}_${index_col}`)) {
        this.CTX?.moveTo(x, y);
        this.CTX?.lineTo(x + this.GAP_PUNTI, y)
        this.CTX?.stroke();
      }
      if(!strs.includes(`${index_tavolo}_${index_row + 1}_${index_col}`)) {
        this.CTX?.moveTo(x, y + this.GAP_PUNTI);
        this.CTX?.lineTo(x + this.GAP_PUNTI, y + this.GAP_PUNTI)
        this.CTX?.stroke();
      }
      if(!strs.includes(`${index_tavolo}_${index_row}_${index_col - 1}`)) {
        this.CTX?.moveTo(x, y);
        this.CTX?.lineTo(x, y + this.GAP_PUNTI)
        this.CTX?.stroke();
      }
      if(!strs.includes(`${index_tavolo}_${index_row}_${index_col + 1}`)) {
        this.CTX?.moveTo(x + this.GAP_PUNTI, y);
        this.CTX?.lineTo(x + this.GAP_PUNTI, y + this.GAP_PUNTI)
        this.CTX?.stroke();
      }

      this.setLineWidth(1);
      this.CTX?.closePath();
    }
  }

  setFillStyle(color: string): void {
    if(this.CTX)
      this.CTX.fillStyle = color;
  }

  setStrokeStyle(color: string): void {
    if(this.CTX)
      this.CTX.strokeStyle = color;
  }

  setLineWidth(lw: number): void {
    if(this.CTX)
      this.CTX.lineWidth = lw;
  }

  // ------ //

  __getHeight = (): string => `${2 * this.GAP_PUNTI}px`
  __getWidth = (): string => `${parseInt(this.inputsTable.row) * this.GAP_PUNTI}px`;

  getStyleTable(): any {
    return {
      width: this.inputsTable.or == 0? this.__getWidth(): this.__getHeight(),
      height: this.inputsTable.or == 1? this.__getWidth(): this.__getHeight()
    };
  }

  setAddTable(): void {
    this.action = 'add-table';
    this.inputsTable = {
      row: '',
      or: -1
    };
  }

  close(): void {
    this.action = '';
  }

  __startTempCLickedTable(X: number, Y: number, evType: 'mouse' | 'touch'): void {
    this.tempClickedTable = true;
    // @ts-ignore
    let divTable: DOMRect = document.getElementById('table').getBoundingClientRect();
    this.coordsTable = {
      x: divTable.x - this.getCorrectDistanceX(),
      y: divTable.y - this.getCorrectDistanceY(),
    };

    const doAction = () => {
      if(this.tempClickedTable) {
        this.tempClickedTable = false;

        if(this.onModTable) {
          let t = [];
          for(let ta of this.tables)
            if(ta != this.tempTable)
              t.push(ta);
          this.tables = t;
        }

        this.onTableMoving = true;

        this.action = '';
        this.draw();
        this.__handleClick(X, Y);
      }
    };

    if(evType == 'mouse')
      this.timeout = setTimeout(() => {
        doAction();
        this.action = '';
      }, 400);
    else {
      doAction();
      //let canvas = document.getElementById('canvas');
      //document.ini
    }
  }

  startTempCLickedTable(X: number, Y: number, evType: 'mouse' | 'touch'): void {
    this.__startTempCLickedTable(X, Y, evType);
  }

  startTempTouchedTable(ev: TouchEvent): void {
    try {
      let X = ev.touches[0].clientX;
      let Y = ev.touches[0].clientY;

      this.__startTempCLickedTable(X, Y, 'touch');
    } catch(e) { }
  }

  stopTempCLickedTable(): void {
    if(!this.tempClickedTable)
      return;

    this.tempClickedTable = false;
    try {
      clearInterval(this.timeout);
    } catch(e) { }
  }

  getMaxRowsToRem = (): number => this.tempTable.row - this.inputsTable.rows_not_to_del.length;

  getRowColumn = (): string => this.inputsTable.or == 1? 'colonna': 'riga';
  getRowsColumns = (): string => this.inputsTable.or == 1? 'colonne': 'righe';

  canModifyTable = (): boolean => this.action == 'mod-table' && this.tempTable.row && this.tempTable.row > 1 && this.tempTable.row - this.inputsTable.row <= this.getMaxRowsToRem();

  modifyTable(): void {
    this.reqModifyTable(this.tempTable.x, this.tempTable.y);
  }

  canAddTable = (): boolean => this.action == 'add-table' && this.inputsTable.row !== '' && this.inputsTable.row >= 1 && this.inputsTable.or != -1;

  getDeltaRow = (): number => this.tempTable.row - parseInt(this.inputsTable.row);

  reqModifyTable(x: number, y: number): void {
    this.http.post('/api.php?command=mod_tavolo', {
      id: this.tempTable.id,
      is_or_changed: this.tempTable.orientamento != this.inputsTable.or,
      orientamento: this.inputsTable.or,
      x: x,
      y: y,
      delta_row: this.getDeltaRow(),
      rows_not_to_del: this.inputsTable.rows_not_to_del,
      old_row: this.tempTable.row
    }).subscribe(() => {
      this.doRequests();
      this.openSnackbar('Modifiche apportate');
      this.action = '';
      this.onModTable = false;
    });
  }

  // ------ //

  setAddPren(): void {
    this.action = 'add-pren';
    this.inputsPrenotazione = {
      nome: '',
      numero: '',
      disposizione: -1,
      color: '#000000'
    };
  }

  canAddPren = (): boolean => this.inputsPrenotazione.disposizione != -1 && this.inputsPrenotazione.numero !== '' && parseInt(this.inputsPrenotazione.numero) >= 1 && this.inputsPrenotazione.nome.trim() && this.inputsPrenotazione.color.trim();

  canModPren = (): boolean => this.inputsPrenotazione.numero !== '' && parseInt(this.inputsPrenotazione.numero) >= 1 && this.inputsPrenotazione.nome.trim() && this.inputsPrenotazione.color.trim() && (this.deltaPosti() < 0 || (this.deltaPosti() >= 0 && this.inputsPrenotazione.disposizione != -1));

  startPrenotazione(): void {
    if(this.inputsPrenotazione.disposizione == 0) {
      this.onPrenCreation = true;
      this.tempPostiPrenotazioni = [];
    } else {
      let posti = this.selectNewPlaceStr(this.inputsPrenotazione.numero).slice(0, this.inputsPrenotazione.numero);

      if(posti.length < this.inputsPrenotazione.numero)
        this.openSnackbar('Errore! Non ci sono abbastanza posti per la prenotazione!');
      else {
        let t: any[] = [];
        for(let po of posti)
          t.push({ str: po });
        this.completePrenotazione(t);
      }
    }

    this.action = '';
  }

  canCompletePrenotazione = (): boolean => this.tempPostiPrenotazioni.length == parseInt(this.inputsPrenotazione.numero);

  completePrenotazione(arr: any[]): void {
    this.http.post('/api.php?command=add_prenotazione', {
      nome: this.inputsPrenotazione.nome.trim(),
      color: this.inputsPrenotazione.color.trim(),
      prenotazioni: arr
    }).subscribe(() => {
      this.openSnackbar('Prenotazione creata con successo!');
      this.onPrenCreation = false;
      this.doRequests();
    });
  }

  deltaPosti = (): number => this.tempPrenotazione.posti.length - parseInt(this.inputsPrenotazione.numero);

  modPrenotazione(): void {
    let t = [];
    for(let po of this.tempPrenotazione.posti)
      t.push({ str: `${po.id_tavolo}_${po.index_row}_${po.index_col}` });

    if(this.deltaPosti() == 0 && this.inputsPrenotazione.disposizione == 2)
      this.__modPrenotazione(t);
    else if(this.deltaPosti() < 0 || (this.deltaPosti() > 0 && this.inputsPrenotazione.disposizione == 0) || (this.deltaPosti() == 0&& this.inputsPrenotazione.disposizione == 3))
      this.__modPlaces(parseInt(this.inputsPrenotazione.numero), 'mod-pren-posti');
    else {
      for(let ta of this.tables)
        for (let i = 0; i < ta.prenotazioni.length; i++)
          if (ta.prenotazioni[i].id_prenotazione == this.tempPrenotazione.id) {
            if(i == ta.prenotazioni.length - 1)
              ta.prenotazioni.pop();
            else
              ta.prenotazioni = ta.prenotazioni.slice(0, i).concat(ta.prenotazioni.slice(i + 1));
            i --;
          }

      let arr = [];
      for(let np of this.selectNewPlaceStr(parseInt(this.inputsPrenotazione.numero)))
        arr.push({ str: np });
      this.__modPrenotazione(arr);
    }
  }

  __modPrenotazione(arr: any): void {
    this.http.post('/api.php?command=mod_prenotazione', {
      id: this.tempPrenotazione.id,
      nome: this.inputsPrenotazione.nome.trim(),
      color: this.inputsPrenotazione.color.trim(),
      posti: arr
    }).subscribe(() => {
      this.doRequests();
      this.openSnackbar('Prenotazione modificata con successo');
    });
    this.action = '';
  }

  // ------ //

  getNear(val: number, start: number): number {
    let d = start - val;
    let verso = start > val? -1: 1;
    for(let i = start;; i += verso * this.GAP_PUNTI) {
      if (Math.abs(d) >= Math.abs(i - val))
        d = i - val;
      else
        return d + this.DIM_PUNTI / 2;
    }
  }

  isColliding(t: any): boolean {
    let w1 = this.GAP_PUNTI * (t.orientamento == 0? t.row: 2);
    let h1 = this.GAP_PUNTI * (t.orientamento == 1? t.row: 2);

    for(let ta of this.tables) {
      let w2 = this.GAP_PUNTI * (ta.orientamento == 0? ta.row: 2);
      let h2 = this.GAP_PUNTI * (ta.orientamento == 1? ta.row: 2);

      if(!(t.x + w1 <= ta.x || ta.x + w2 <= t.x || t.y + h1 <= ta.y || ta.y + h2 <= t.y))
        return true;
    }

    return false;
  }

  openSnackbar(message: string): void {
    this.snackbar.open(message, 'OK', { duration: 5000 });
  }

  getTableClicked(mouseX: number, mouseY: number): any {
    for(let ta of this.tables) {
      let x = ta.x + this.getCorrectDistanceX();
      let y = ta.y + this.getCorrectDistanceY();
      let w = this.GAP_PUNTI * (ta.orientamento == 0? ta.row: 2);
      let h = this.GAP_PUNTI * (ta.orientamento == 1? ta.row: 2);

      if(mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h)
        return ta;
    }
    return null;
  }

  getPostoClicked(mouseX: number, mouseY: number, ta: any): any {
    for(let pr of ta.prenotazioni) {
      let [id_tavolo, i, j] = pr.str.split('_');
      let xs = ta.x + this.getCorrectDistanceX() + parseInt(j) * this.GAP_PUNTI;
      let ys = ta.y + this.getCorrectDistanceY() + parseInt(i) * this.GAP_PUNTI;

      if(mouseX >= xs && mouseX <= xs + this.GAP_PUNTI && mouseY >= ys && mouseY <= ys + this.GAP_PUNTI)
        return pr;
    }

    return null;
  }

  prepareMoveTable(ta: any): void {
    let tables = [];
    for(let _ta of this.tables)
      if(_ta != ta)
        tables.push(_ta);
    this.tables = tables;

    this.coordsTable = ta;
    this.coordsTable.old_x = ta.x;
    this.coordsTable.old_y = ta.y;
    this.inputsTable.or = this.coordsTable.orientamento;
    this.inputsTable.row = this.coordsTable.row;
    this.tempPostiPrenotazioni = ta.prenotazioni;
    this.onTableMoving = true;
  }

  openRecapPrenotazione(posto: any): void {
    let nome = '', num = 0;
    for(let pr of this.prenotazioni)
      if(pr.id == posto.id_prenotazione) {
        nome = pr.nome;
        num = pr.posti.length;
        this.tempPrenotazione = pr;
        break;
      }

    if(nome == '')
      return;

    this.dialog.open(DetailsPrenotazioneDialog, {
      data: {
        color: posto.color,
        nome: nome,
        num: num,
        mod_places: (): void => this.__modPlaces(this.tempPrenotazione.posti.length, 'mod-posti'),
        mod_dati: (): void => {
          this.inputsPrenotazione = {
            nome: this.tempPrenotazione.nome,
            numero: `${this.tempPrenotazione.posti.length}`,
            disposizione: -1,
            color: this.tempPrenotazione.color
          };
          this.action = 'mod-pren';
        },
        del: (): void => {
          this.http.post('/api.php?command=del_prenotazione', { id: this.tempPrenotazione.id }).subscribe(() => {
            this.openSnackbar('Prenotazione eliminata con successo!');
            this.doRequests();
          });
          this.action = '';
        }
      }
    });
  }

  openRecapTavolo(ta: any): void {
    let _ta = JSON.parse(JSON.stringify(ta));
    _ta.del = (): void => {
      this.http.post('/api.php?command=del_tavolo', { id: ta.id }).subscribe(() => {
        this.openSnackbar('Tavolo eliminato con successo!');
        this.doRequests();
      });
      this.action = '';
    };

    _ta.mod_dati = (): void => {
      let t: number[] = [];

      for(let po of ta.prenotazioni) {
        let [id_ta, i, j] = po.str.split('_');
        let toAdd = ta.orientamento == 0? parseInt(j): parseInt(i);
        if(!t.includes(toAdd))
          t.push(toAdd);
      }
      t = t.sort((a, b) => a - b);

      this.inputsTable = {
        or: _ta.orientamento,
        row: _ta.row,
        rows_not_to_del: t
      };
      this.tempTable = ta;
      this.action = 'mod-table';
      this.onModTable = true;

    };
    this.dialog.open(DetailsTavoloDialog, { data: _ta });
  }

  __modPlaces(nPosti: number, action: 'mod-posti' | 'mod-pren-posti'): void {
    let _listPr = [];
    for(let pr of this.prenotazioni)
      if(pr != this.tempPrenotazione)
        _listPr.push(pr);

    this.prenotazioni = _listPr;
    this.setPrenotazioni();

    this.tempPostiPrenotazioni = [];
    for(let po of this.tempPrenotazione.posti) {
      let ta = this.getTavoloFromId(po.id_tavolo);

      this.tempPostiPrenotazioni.push({
        str: `${po.id_tavolo}_${po.index_row}_${po.index_col}`,
        color: this.tempPrenotazione.color,
        x: ta.x + this.GAP_PUNTI * po.index_col,
        y: ta.y + this.GAP_PUNTI * po.index_row
      });
    }
    this.inputsPrenotazione.numero = nPosti;
    this.action = action;

    this.draw();
  }

  doneAction(): void {
    if(this.action == 'mod-posti') {
      this.http.post('/api.php?command=mod_posti', {
        id_pren: this.tempPrenotazione.id,
        nuove: this.tempPostiPrenotazioni
      }).subscribe(() => {
        this.openSnackbar('Posti modificati con successo!');
        this.doRequests();
      });
    } else if(this.action == 'mod-pren-posti') {
      this.__modPrenotazione(this.tempPostiPrenotazioni);
    }

    this.action = '';
  }

  closeAction(): void {
    if(this.action != 'search' && this.action != 'sel-table') {
      this.prenotazioni.push(this.tempPrenotazione);
      this.tempPostiPrenotazioni = [];
      this.setPrenotazioni();
      this.openSnackbar('Operazione annullata');
      this.draw();
    }
    this.action = '';
    this.draw();
  }

  getTavoloFromId(id: number): any {
    for(let ta of this.tables)
      if(ta.id == id)
        return ta;
    return null;
  }

  searchPrenotazione(): void {
    this.draw();

    for(let pr of this.prenotazioni)
      if(pr.nome.toUpperCase() == this.search.trim().toUpperCase()) {
        let t = JSON.parse(JSON.stringify(pr.posti[0]));
        t.id_prenotazione = pr.id;
        t.color = pr.color;
        this.openRecapPrenotazione(t);
        return;
      }
  }

  prepareSearch(): void {
    this.search = '';
    this.action = 'search';
  }

  prepareRepose(): void {
    this.dialog.open(DetailsReposeDialog, {
      data: {
        next: () => { this.reposeAll(); }
      }
    });
  }

  // ----- //

  reposeAll(): void {
    let tavoli = this.getTablesForSW(true);
    let prenotazioni = JSON.parse(JSON.stringify(this.prenotazioni));

    for(let pr of prenotazioni) {
      pr.positioned = false;
      pr.n_posti = pr.posti.length;
    }
    prenotazioni.sort((a: any, b: any) => b.n_posti - a.n_posti);
    let posti_tavolo: any[] = [];

    while(prenotazioni.length > 0) {
      let evPoss = this.getEveryPossibilities(prenotazioni);

      let arr_poss: any[] = [];
      for (let ta of tavoli)
        arr_poss.push(this.getBestPossibility(ta.n_posti - ta.posti_occupati, evPoss, prenotazioni, ta));

      arr_poss = arr_poss.filter((po: any) => po.remains != -1);

      arr_poss.sort((a: any, b: any) => {
        if (a.remains < b.remains)
          return -1;
        else if (a.remains > b.remains)
          return 1;
        else
          return b.indexes.length - a.indexes.length;
      });

      for (let arr of arr_poss) {
        let correct = this.getCorrectIndexPosition(arr.indexes, prenotazioni);

        let noPositioned = true;
        for(let i of correct)
          if(prenotazioni[i].positioned) {
            noPositioned = false;
            break;
          }

        if(!noPositioned)
          continue;

        let ids = []
        let posti_id = [];
        for(let i of correct) {
          prenotazioni[i].positioned = true;
          ids.push(prenotazioni[i].id);
          for(let _ = 0; _ < prenotazioni[i].n_posti; _ ++)
            posti_id.push(prenotazioni[i].id);
        }
        arr.table.posti_occupati += posti_id.length;

        posti_tavolo.push({
          table: arr.table,
          indexes: correct,
          ids: ids,
          posti_id: posti_id,
          remains: arr.remains
        });
      }

      tavoli = tavoli.filter((ta: any) => ta.n_posti - ta.posti_occupati > 0);
      prenotazioni = prenotazioni.filter((pr: any) => !pr.positioned);
    }

    this.openSnackbar('Posti risistemati con successo!');
    this.http.post('/api.php?command=repose_all', posti_tavolo).subscribe(() => this.doRequests());
  }

  selectNewPlaceStr(posti_occ: number): string[] {
    let postiLiberi: string[][] = [];
    for(let ta of this.tables)
      postiLiberi = postiLiberi.concat(this.getPostiLiberi(ta));
    postiLiberi = postiLiberi.sort((a: string[], b: string[]) => a.length - b.length);

    for(let po of postiLiberi)
      if(po.length >= posti_occ)
        return po.slice(0, posti_occ);

    let ret: string[] = [];
    for(let po of postiLiberi.reverse()) {
      for (let p of po)
        ret.push(p);
      while(ret.length > posti_occ)
        ret.pop();

      if(ret.length == posti_occ)
        break;
    }

    return ret;
  }

  getCorrectIndexPosition(arr: number[], prenotazioni: any[]): number[] {
    let ret: number[] = [];

    for(let i of arr)
      if(prenotazioni[i].n_posti % 2 == 0)
        ret.push(i);
    for(let i of arr)
      if(prenotazioni[i].n_posti % 2 == 1)
        ret.push(i);

    return ret;
  }

  getPostiLiberi(ta: any): string[][] {
    let strs: string[] = [];
    let posti: string[][] = [];
    let temp: string[] = [];
    let canAddPostiNextTime: boolean = false;

    if(ta.prenotazioni.length == ta.row * 2)
      return [];

    for(let pr of ta.prenotazioni)
      strs.push(pr.str);

    for (let j = 0; j < ta.row; j++)
      for (let i = 0; i < 2; i++) {
        let str = ta.orientamento == 0? `${ta.id}_${i}_${j}`: `${ta.id}_${j}_${i}`;

        if(strs.includes(str)) {
          if(!canAddPostiNextTime)
            canAddPostiNextTime = true;
          else {
            canAddPostiNextTime = false;
            if (temp.length > 0) {
              posti.push(temp);
              temp = [];
            }
          }
        } else {
          canAddPostiNextTime = false;
          let vi = ta.orientamento == 0? this.getVicini(ta.orientamento, ta.id, i, j, ta.row): this.getVicini(ta.orientamento, ta.id, j, i, ta.row);

          let hasTop = this.isInclude(strs, vi.top);
          let hasBottom = this.isInclude(strs, vi.bottom);
          let hasDx = this.isInclude(strs, vi.dx);
          let hasSx = this.isInclude(strs, vi.sx);
          let hasTopDx = this.isInclude(strs, vi.top_dx);
          let hasTopSx = this.isInclude(strs, vi.top_sx);

          if (hasTop && hasBottom && hasDx && hasSx)
            posti.push([str]);
          else if((ta.orientamento == 0 && hasTop && hasBottom && temp.includes(vi.sx) && hasTopSx) ||
                  (ta.orientamento == 1 && hasDx && hasSx && temp.includes(vi.top) && (i == 1? hasTopDx: hasSx))) {
            if(temp.length > 1) {
              posti.push(temp);
              let last = temp[temp.length - 1];
              temp = [last];
            }
            temp.push(str);
            posti.push(temp);
            temp = [str];
          } else
            temp.push(str);
        }
      }


    if(temp.length > 0)
      posti.push(temp);

    return posti;
  }

  isInclude(strs: string[], el: string | null): boolean {
    if(el == null)
      return true;
    else
      return strs.includes(el);
  }

  getVicini(or: number, id_tavolo: number, i: number, j: number, row: number): any {
    if(or == 0)
      return {
        top: i == 0? null: `${id_tavolo}_0_${j}`,
        bottom: i == 1? null: `${id_tavolo}_1_${j}`,
        sx: j == 0? null: `${id_tavolo}_${i}_${j - 1}`,
        dx: j == row - 1? null: `${id_tavolo}_${i}_${j + 1}`,
        top_sx: (i == 0 || j == 0)? null: `${id_tavolo}_0_${j - 1}`,
        top_dx: (i == 0 || j == row - 1)? null: `${id_tavolo}_0_${j + 1}`,
      };

    return {
      top: i == 0? null: `${id_tavolo}_${i - 1}_${j}`,
      bottom: i == row - 1? null: `${id_tavolo}_${i + 1}_${j}`,
      sx: j == 0? null: `${id_tavolo}_${i}_0`,
      dx: j == 1? null: `${id_tavolo}_${i}_1`,
      top_sx: (i == 0 || j == 0)? null: `${id_tavolo}_${i - 1}_0`,
      top_dx: (i == 0 || j == 1)? null: `${id_tavolo}_${i - 1}_1`,
    };
  }

  getTablesForSW(reset: boolean): any {
    let tavoli = JSON.parse(JSON.stringify(this.tables));
    for(let ta of tavoli) {
      ta.posti_occupati = reset? 0: ta.prenotazioni.length;
      if(reset)
        ta.prenotazioni = [];
      ta.n_posti = ta.row * 2;
    }

    this.sortTables(tavoli);
    return tavoli;
  }

  getEveryPossibilities(prenotazioni: any): number[][] {
    let everyPossibilities: number[][] = [];

    for(let i = 0; i <= 2 ** prenotazioni.length - 1; i ++) {
      let temp: number[] = [];
      for(let j = 0; j < prenotazioni.length; j ++) {
        if ((i & 2 ** j) && !prenotazioni[j].position)
          temp.push(j);
      }
      if(temp.length > 0)
        everyPossibilities.push(temp);
    }

    return everyPossibilities;
  }

  getBestPossibility(num: number, possibilities: number[][], prenotazioni: any, table: any): any {
    let i_ret: number = -1;
    let toBeat = num;
    let ret = [];

    for(let i = 0; i < possibilities.length; i++) {
      let tot = 0;
      for(let j = 0; j < possibilities[i].length; j ++)
        tot += prenotazioni[possibilities[i][j]].n_posti;

      if(tot <= num && num - tot < toBeat) {
        toBeat = num - tot;
        i_ret = i;
      }
    }

    if(i_ret == -1)
      for(let _ = 0; _ < possibilities.length + 1; _ ++)
        ret.push(-1);

    return {
      indexes: possibilities[i_ret],
      remains: i_ret == -1? -1: toBeat,
      table: table
    };
  }

  sortTables(tables: any): void {
    tables.sort((a: any, b: any) => (a.n_posti - a.posti_occupati) - (b.n_posti - b.posti_occupati));
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    // da sistemare
    this.draw();
    this.ngOnInit();
    this.ngAfterViewInit();
  }
}
