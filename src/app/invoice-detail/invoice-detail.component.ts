import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'invoice-detail',
	templateUrl: './invoice-detail.component.html',
	styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent implements OnInit {
	@Input() visitedClients: any[];
	@Input() notVisitedClients: any[];
	@Input() metaData: { fromDate: string, dateTo: string, salesman: string, clientNumber: number};
	displayedColumns: string[] = [ 'codeClient', 'NomClient' ];
	percentage: any = 0;

	constructor() { }

	ngOnInit() {
	}

	ngOnChanges() {
		this.percentage = ((this.visitedClients.length * 100) / this.metaData.clientNumber).toFixed(2);
		if (isNaN(this.percentage)) { this.percentage = 0; }
	}

}

