import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'diffrence-sales',
	templateUrl: './diffrence-sales.component.html',
	styleUrls: ['./diffrence-sales.component.scss']
})
export class DiffrenceSalesComponent implements OnInit {
	@Input() salesArray: any[];
	displayedColumns: string[] = ['id', 'totalDocumentSummary', 'totalSales', 'Diffrence'];

	constructor() { }

	ngOnInit() {
	}

}
