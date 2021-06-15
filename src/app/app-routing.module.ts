import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { WarehouseComponent } from './warehouse/warehouse.component';
import { VendorsStockComponent } from './vendors-stock/vendors-stock.component';
import { VendorsSalesComponent } from './vendors-sales/vendors-sales.component';
import { VendorTransfertComponent } from './vendor-transfert/vendor-transfert.component';
import { TradeTransactionsComponent } from './trade-transactions/trade-transactions.component';
import { VendorsInventoryComponent } from './vendors-inventory/vendors-inventory.component';
import { StockReportComponent } from './stock-report/stock-report.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { NewVTComponent } from './new-vt/new-vt.component';


const routes: Routes = [
	{ component: MainComponent, path : '' },
	{ component: WarehouseComponent, path : 'setif' },
	{ component: VendorsStockComponent, path: 'vendors-stock' },
	{ component: VendorsSalesComponent, path: 'vendors-sales' },
	{ component: VendorTransfertComponent, path: 'vendors-transfert' },
	{ component: TradeTransactionsComponent, path: 'trade-transactions' },
	{ component: VendorsInventoryComponent, path: 'vendors-inventory' },
	{ component: StockReportComponent, path: 'setif/stock-report' },
	{ component: InvoiceComponent, path: 'invoices' },
	{ component: NewVTComponent, path: 'vt' },

];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
