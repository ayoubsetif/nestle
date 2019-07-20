import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { WarehouseComponent } from './warehouse/warehouse.component';
import { VendorsStockComponent } from './vendors-stock/vendors-stock.component';

const routes: Routes = [
	{ component: MainComponent, path : '' },
	{ component: WarehouseComponent, path : ':warehouse' },
	{ component: VendorsStockComponent, path: ':warehouse/vendors-stock' },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
