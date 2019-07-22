import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NgMathPipesModule } from 'ngx-pipes';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { WarehouseComponent } from './warehouse/warehouse.component';
import { VendorsStockComponent } from './vendors-stock/vendors-stock.component';
import { VendorStockDisplayComponent } from './vendor-stock-display/vendor-stock-display.component';
import { VendorsSalesComponent } from './vendors-sales/vendors-sales.component';
import { DiffrenceSalesComponent } from './diffrence-sales/diffrence-sales.component';
import { ReturnVendorComponent } from './return-vendor/return-vendor.component';
import { VendorTransfertComponent } from './vendor-transfert/vendor-transfert.component';

@NgModule({
	declarations: [
		AppComponent,
		MainComponent,
		WarehouseComponent,
		VendorsStockComponent,
		VendorStockDisplayComponent,
		VendorsSalesComponent,
		DiffrenceSalesComponent,
		ReturnVendorComponent,
		VendorTransfertComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		MatButtonModule,
		MatSnackBarModule,
		MatFormFieldModule,
		MatSelectModule,
		MatTableModule,
		NgMathPipesModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
