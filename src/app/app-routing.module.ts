import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PlanComponent} from "./plan/plan.component";

const routes: Routes = [
  { path: '', component: PlanComponent, title: 'plan' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
