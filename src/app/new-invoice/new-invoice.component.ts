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
  selector: 'new-invoice',
  templateUrl: './new-invoice.component.html',
  styleUrls: ['./new-invoice.component.scss']
})
export class NewInvoiceComponent implements OnInit {

  file: File;
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
	
		if ((value || '').trim()) { this.products.push({id: value.trim()}); }
		// Reset the input value
		if (input) { input.value = ''; }
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
					fromDate: arr[0]['__EMPTY_1'].split('to ')[0],
					dateTo: arr[0]['__EMPTY_1'].split('to ')[1],
					salesman: arr[5]['__EMPTY_1']
				};
				this.clients = this.DBClients.filter(f => f['vendor'].replace(/ /g,'') === arr[5]['__EMPTY_1'].replace(/ /g,'')).map(m => {
					return { customerId: m.customerId, customerName: m.customerName };
				});
				this.metadata['clientNumber'] = this.clients.length;
				this.data = _.drop(arr, 10);
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
				_.drop(arr, 6).filter(f => f['Customer Listing']).forEach(c => {
          dbClient.push({
            vendor: c['__EMPTY_3'],
						customerId: c['__EMPTY'],
						customerName: c['__EMPTY_1']
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
			this.data.filter(f => f['__EMPTY_5'] === id.id).forEach(c => {
				customerList.push({customerId: c['__EMPTY'], customerName: c['__EMPTY_1'] });
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
