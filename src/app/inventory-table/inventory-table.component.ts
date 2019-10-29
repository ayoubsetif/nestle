import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';

@Component({
	selector: 'inventory-table',
	templateUrl: './inventory-table.component.html',
	styleUrls: ['./inventory-table.component.scss']
})
export class InventoryTableComponent implements OnInit {
	@Input() products: Product[];
	data: Product[] = [];
	displayedColumns: string[] = ['productId', 'name', 'Quantity', 'Observation'];
	vanName: null;
	date: Date;

	constructor() { }

	ngOnInit() { }

	ngOnChanges() {
		if (this.products) {
			const vanExist = this.products.find(f => f['vanId']);
			if (vanExist) {
				this.vanName = vanExist['vanName'];
				this.data = JSON.parse(JSON.stringify(this.products));
				this.data.shift();
			}
		}
	}

	getDate() {
		const d = new Date();
		return moment(d).format('DD-MM-YYYY HH:mm:ss');
	}

}

export interface Product {
	name: string;
	id: string;
	quantity: number;
}

