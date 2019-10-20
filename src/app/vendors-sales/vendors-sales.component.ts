import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';
import { ReplaySubject } from 'rxjs';
import { product } from '../utils/products';

@Component({
	selector: 'vendors-sales',
	templateUrl: './vendors-sales.component.html',
	styleUrls: ['./vendors-sales.component.scss']
})
export class VendorsSalesComponent implements OnInit {
	file: File;
	vendorsList = [];
	vendorsSummary = [];
	sales = [];
	rawData = [];
	compareArray = new ReplaySubject<any[]>(1);
	product = product;
	vendorsReturn = [];
	vendors = {};

	constructor(
		private snackBar: MatSnackBar,
		private excelService: ExcelManipulationService
	) { }

	ngOnInit() {
		this.vendors =  JSON.parse(localStorage.getItem('config'));
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
				const deleteMetaText = _.drop(arr, 12);
				this.rawData = deleteMetaText;
				this.vendorsList = _.compact(_.uniq(deleteMetaText.map(m => m['_9'])));
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

	uploadSummaryFile(event) {
		this.file = event.target.files[0];
		if (this.file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			this.snackBar.open('Wrong File Type', 'Ok', { duration : 7000 });
		} else {
			const fileReader = new FileReader();
			fileReader.onload = (e) => {
				const worksheet = this.excelService.readFile(fileReader);
				const arr = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				this.vendorsSummary = _.drop(arr, 11).filter(f => f['Document Summary'].includes('Total By Salesm')).map(v => {
					return { id: (v['Document Summary'].slice(18)).replace(' - ', '-'), total: Number((v['__EMPTY_6']).split(',').join(''))};
				});
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

	verify() {
		const listingSummary = [];
		const vendorSales = this.sales;
		vendorSales.forEach(s => {
			let acc = 0;
			s.sales.forEach(e => {
				const t = e[3] * e[4];
				e.push(t);
				acc = acc + t;
			});
			listingSummary.push({ id: s['id'], total: acc });
		});

		const documentSummary  = _.intersectionBy(this.vendorsSummary, listingSummary, 'id' );
		listingSummary.push({
			id: 'TOTAL',
			total: _.reduce(listingSummary.map(m => m['total']), function(a, b) { return a + b; }, 0)
		});
		documentSummary.push({
			id: 'TOTAL',
			total: _.reduce(documentSummary.map(m => m['total']), function(a, b) { return a + b; }, 0)
		});
		const arr = [];
		documentSummary.forEach(ds => {
			const f = listingSummary.find(k => k.id === ds['id']);
			arr.push({
				id: ds['id'], totalDocumentSummary: ds['total'], totalSales: f['total']
			});
			this.compareArray.next(arr);
		});
	}

	selectVendor(event) {
		const sale = [];
		const Vreturn = [];
		event.value.forEach(v => {
			const aSale = { id: v, sales: []};
			const ss = [];
			this.rawData.filter(f => f['_9'] === v).forEach(s => {
				ss.push({
					id: s['_6'],
					name: s['_7'],
					price: this.getUnitPrice(s['_6'], s['__EMPTY_3'], s['__EMPTY_6']),
					quantity: this.getQuantity(s['_6'], s['__EMPTY_9'], s['__EMPTY_10'] )
				});
			});
			Object.keys(_.groupBy(ss, 'id')).map(m => {
				if (_.groupBy(ss, 'id')[m].length > 1) {
					const t = _.groupBy(_.groupBy(ss, 'id')[m], 'price');
					Object.keys(t).forEach(e => {
						const aon = t[e].map(p => p['quantity']);
						const sum = _.reduce(aon, function(a, b) { return a + b; }, 0);
						if (sum < 0) {
							Vreturn.push({ id: v, productId: t[e][0]['id'], name: t[e][0]['name'], total: sum, price: Number(e) });
						} else {
							aSale['sales'].push([
								t[e][0]['id'], t[e][0]['name'], '', sum, Number(e)]
							);
						}
					});
				} else {
					const a = _.groupBy(ss, 'id')[m][0];
					if (a['quantity'] > 0 ) {
						aSale['sales'].push([a['id'], a['name'], '', a['quantity'], a['price']]);
					} else {
						Vreturn.push({ id: v, proudctId: a['id'], name: a['name'], total: a['quantity'], price: Number(a['price']) });
					}
				}
			});
			sale.push(aSale);
		});
		this.sales = sale;
		this.vendorsReturn = Vreturn;
	}

	getUnitPrice(id: string, dmsPrice, dis) {
		const discount = Number(dis.split('%')[0]);
		const retailPrice = Number(dmsPrice.replace(',', '')) * this.product[id].tva;
		const unitPrice = (retailPrice + (retailPrice * 1 / 100)) / this.product[id].col;
		let UnitPriceAfterDiscount = unitPrice - ((unitPrice * discount) / 100);
		if (UnitPriceAfterDiscount === 0.00) {
			UnitPriceAfterDiscount = 0.01;
		}
		return Number(UnitPriceAfterDiscount.toFixed(2));
	}

	getQuantity(id, quantity, uom) {
		if (uom === 'EA' || uom === 'DS') {
			return Number(quantity);
		} else {
			return this.product[id].col * quantity;
		}
	}

	download() {
		const vendorSales = JSON.parse(JSON.stringify(this.sales));
		vendorSales.forEach(v => {
			v.sales.unshift(['Code Article', 'Article', 'Quantité conditionnée ', 'Quantité', 'Prix unitaire', 'Sous-total'  ]);

			const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(v.sales);

			/* generate workbook and add the worksheet */
			const wb: XLSX.WorkBook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

			/* save to file */
			XLSX.writeFile(wb, `${v.id}.xlsx`);
		});
	}

	downloadGroupedSales() {
		const vendorSales = JSON.parse(JSON.stringify(this.sales));
		vendorSales.forEach(v => {
			v.sales.forEach(sale => {
				sale.unshift(
					this.vendors[v.id]['Depot'], 'Nestlé', this.vendors[v.id]['vendeur'],
					this.vendors[v.id]['codeClient'], this.vendors[v.id]['client'],
					this.vendors[v.id]['emplacement']
				);
			});
		});
		const globalSales = _.flatten(vendorSales.map(m => m.sales));
		globalSales.forEach(s => {
			s[11] = s[9] * s[10];
		});

		globalSales.unshift([
			'Entrepot ', 'Marque ', 'Vendeur',
			'Code client', 'Client', 'Emplacement',
			'Code Article', 'Article', 'Quantité conditionnée ',
			'Quantité', 'Prix unitaire', 'Sous-total'
		]);
		// not optimal but why XD
		const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(globalSales.filter(f => f[9] !== 0));

		/* generate workbook and add the worksheet */
		const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'GlobalSales');

		/* save to file */
		XLSX.writeFile(wb, `Vente Globale.xlsx`);
	}

}
