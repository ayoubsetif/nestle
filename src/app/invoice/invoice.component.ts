import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';
import { MatChipInputEvent } from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';


import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';

@Component({
	selector: 'invoice',
	templateUrl: './invoice.component.html',
	styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
	file: File;
	/*products = [
		{ name: 'RTD', ids: [ '12360460' ] },
		{ name: 'FCMP', ids: [ '12286065', '12292453', '12199846', '9702002', '12378002' ]},
		{ name: '3EN1 ANCIEN', ids: [ '12272044' ] },
		{ name: '3EN1 Promo', ids: [ '12427772', '12427710' ] },
		{ name: 'JUNIOR 350', ids: [ '12305319' ] },
		{ name: 'LCS', ids: [ '12276393' ] },
		{ name: 'LCS CARAMEL', ids: [ '12240504' ] },
		{ name: 'GUIGOZ3', ids: [ '12381799' ] }
	];*/
	data = [];
	metadata = {};
	clients = [];
	visitedClients = [];
	notVisitedClients = [];
	DBClients = [];

	visible = true;
	selectable = true;
	removable = true;
	addOnBlur = true;
	readonly separatorKeysCodes: number[] = [ENTER, COMMA];
	products = [];
  
	constructor(
		private snackBar: MatSnackBar,
		private excelService: ExcelManipulationService,
		iconRegistry: MatIconRegistry,
		sanitizer: DomSanitizer
	) {
		iconRegistry.addSvgIcon(
			'cancel',
			sanitizer.bypassSecurityTrustResourceUrl('assets/cancel-24px.svg'));
	}

	ngOnInit() {
		this.DBClients =  JSON.parse(localStorage.getItem('clients'));
	}

	add(event: MatChipInputEvent): void {
		const input = event.input;
		const value = event.value;
	
		if ((value || '').trim()) {
		  this.products.push({id: value.trim()});
		}

		// Reset the input value
		if (input) {
		  input.value = '';
		}
	  }
	
	  remove(fruit): void {
		const index = this.products.indexOf(fruit);
	
		if (index >= 0) {
		  this.products.splice(index, 1);
		}
	  }

	uploadFile(event) {
		this.file = event.target.files[0];
		if (this.file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			this.snackBar.open('Wrong File Type', 'Ok', { duration : 7000 });
		} else {
			const fileReader = new FileReader();
			fileReader.onload = (e) => {
				const worksheet = this.excelService.readFile(fileReader);
				const arr = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				this.metadata = {
					fromDate: arr[5]['_2'],
					dateTo: arr[6]['_2'],
					salesman: arr[12]['_9']
				};
				this.clients = this.DBClients.filter(f => f['vendor'] === arr[12]['_9']).map(m => {
					return { customerId: m.customerId, customerName: m.customerName };
				});
				this.metadata['clientNumber'] = this.clients.length;
				this.data = _.drop(arr, 12);
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

	uploadCustomerListing(event) {
		this.file = event.target.files[0];
		if (this.file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			this.snackBar.open('Wrong File Type', 'Ok', { duration : 7000 });
		} else {
			const fileReader = new FileReader();
			fileReader.onload = (e) => {
				const worksheet = this.excelService.readFile(fileReader);
				const arr = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				const dbClient = [];
				_.drop(arr, 7).forEach(c => {
					dbClient.push({
						vendor: c['_4'],
						customerId: c[''],
						customerName: c['_1']
					});
				});
				this.DBClients = dbClient;
				localStorage.setItem('clients', JSON.stringify(dbClient));
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

	selectProduct() {
		const customerList = [];
		this.products.forEach(id => {
			this.data.filter(f => f['_6'] === id.id).forEach(c => {
				customerList.push({customerId: c[''], customerName: c['_1'] });
			});
		});
		this.visitedClients = _.uniqBy(customerList, 'customerId');
		this.notVisitedClients = _.differenceBy(this.clients, this.visitedClients, 'customerId');
	}

	downloadInvoiced() {
		const c = this.visitedClients;
		const invoiced = [];
		c.forEach(cl => {
			invoiced.push([ _.indexOf(c, cl) + 1, cl.customerName]);
		});
		const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(invoiced);

		/* generate workbook and add the worksheet */
		const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

		/* save to file */
		XLSX.writeFile(wb, `invoiced.xlsx`);
	}

	downloadNotInvoiced() {
		const c = this.notVisitedClients;
		const notInvoiced = [];
		c.forEach(cl => {
			notInvoiced.push([ _.indexOf(c, cl) + 1, cl.customerName]);
		});
		const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(notInvoiced);

		/* generate workbook and add the worksheet */
		const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

		/* save to file */
		XLSX.writeFile(wb, `notInvoiced.xlsx`);

	}

}
