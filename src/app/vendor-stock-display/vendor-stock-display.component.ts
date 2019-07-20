import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'vendor-stock-display',
	templateUrl: './vendor-stock-display.component.html',
	styleUrls: ['./vendor-stock-display.component.scss']
})
export class VendorStockDisplayComponent implements OnInit {
	@Input() products: Product[];
	initialAppearance = false;
	data: Product[] = [];
	displayedColumns: string[] = ['productId', 'name', 'erpQuantity', 'dmsQuantity', 'difQuantity'];

	constructor() { }

	ngOnInit() {
		this.initialAppearance = false;
	}

	ngOnChanges() {
		if (this.products) {
			this.initialAppearance = true;
			this.data = this.products;
		}
	}

}

export interface Product {
	name: string;
	id: string;
	quantity: number;
	erpQuantity: number;
	dmsQuantity: number;
}

