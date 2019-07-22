import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { WarehouseComponent } from './warehouse/warehouse.component';
import { VendorsStockComponent } from './vendors-stock/vendors-stock.component';
import { VendorsSalesComponent } from './vendors-sales/vendors-sales.component';
import { VendorTransfertComponent } from './vendor-transfert/vendor-transfert.component';

const routes: Routes = [
	{ component: MainComponent, path : '' },
// 	{ component: WarehouseComponent, path : ':warehouse' },
	{ component: VendorsStockComponent, path: 'vendors-stock' },
	{ component: VendorsSalesComponent, path: 'vendors-sales' },
	{ component: VendorTransfertComponent, path: 'vendors-transfert' }
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
