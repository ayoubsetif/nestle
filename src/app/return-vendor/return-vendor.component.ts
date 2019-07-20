import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'return-vendor',
	templateUrl: './return-vendor.component.html',
	styleUrls: ['./return-vendor.component.scss']
})
export class ReturnVendorComponent implements OnInit {
	@Input() data: any[];
	displayedColumns: string[] = ['id', 'productId', 'name', 'total', 'price', 'quantity'];
	constructor() { }

	ngOnInit() {
	}

}
