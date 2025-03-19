import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPrenotazioni'
})
export class FilterPrenotazioniPipe implements PipeTransform {

  transform(pren: any[], filter: string): any[] {
    if(filter.trim() == '')
      return [];
    return pren.filter((pr: any) => pr.nome.toUpperCase().includes(filter.trim().toUpperCase()));
  }

}
