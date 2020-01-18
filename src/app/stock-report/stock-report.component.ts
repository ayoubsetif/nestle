import { Component, OnInit } from '@angular/core';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import { MatSnackBar } from '@angular/material';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';
import { product } from '../utils/products';

@Component({
	selector: 'stock-report',
	templateUrl: './stock-report.component.html',
	styleUrls: ['./stock-report.component.scss']
})
export class StockReportComponent implements OnInit {
	file: File;
	dmsVStock = [];
	product: any = [];

	constructor(
		private snackBar: MatSnackBar,
		private excelService: ExcelManipulationService
		) { }

	ngOnInit() {
		const prods =  JSON.parse(localStorage.getItem('prodconfig'));
		if(!prods || prods.length === 0) {
			this.product = product;
		}else {
			this.product = prods;
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
				const vendorList = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				const deleteMetaText = _.drop(vendorList, 15);
				this.splitIntoArrays(deleteMetaText);
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

	splitIntoArrays(table) {
		const van = { vanId: null, products: []};
		table.forEach(e => {
			if (e['On Hand Qty'] === '') {
				const separator = table.splice(table.indexOf(e) + 1);
				table.forEach(el => {
					const test = el['On Hand Qty'];
					// this test for van
					if (test && test.includes('VAN')) {
						if (test.includes('Good Type')) {
							van['vanId'] = el['On Hand Qty'].slice(5, 7);
							table.forEach(t => {
								if (t[''] && t[''] !== 'Product') {
									van['products'].push({
										id: t[''],
										quantityCs: this.getQuantity(t['_10']).cs,
										quantityEa: this.getQuantity(t['_10']).ea
									});
								}
							});
						}
					}	else if (test && test.includes('MN_WH')) {
						van['vanId'] = '99';
						table.forEach(t => {
							if (t[''] && t[''] !== 'Product' && t[''] !== 'PrdCat2 :') {
								van['products'].push({
									id: t[''],
									quantityCs: this.getQuantity(t['_10']).cs,
									quantityEa: this.getQuantity(t['_10']).ea
								});
							}
						});
						}
				});
				this.splitIntoArrays(separator);
				if (van['vanId'] && van['vanId'] !== 'N ') { this.dmsVStock.push(van); }
			}
		});
	}

	getQuantity(quantity: string) {
		const cs = parseInt(quantity.split('/')[0], 10);
		let ea = parseInt(quantity.split('/')[1], 10);
		if (isNaN(ea)) { ea = 0; }
		return {cs: cs, ea: ea };
	}

	download() {
		const vendors = _.orderBy(this.dmsVStock, 'vanId', 'asc');
		const stock = [];
		const products = Object.keys(this.product).map(m => m);

		products.forEach(id => {
			vendors.forEach(v => {
				const t = v.products.find(f => f.id === id);
				if (!t) {
					v['products'].push({ id: id, quantityCs: 0, quantityEa: 0  });
				}
			});
		});

		const e = _.groupBy(_.flatten(vendors.map(m => m.products)), 'id');
		Object.keys(e).map(m => {
			if (m !== 'PrdCat2 :') {
				stock.push(m);
				e[m].forEach(ee => {
					stock.push(ee['quantityCs'], ee['quantityEa'] );
				});
			}
		});
		this.generateExcelFile(_.chunk(stock, ((vendors.length * 2) + 1)));
	}

	generateExcelFile(arr) {
		const v = this.dmsVStock.map(m => m['vanId']).sort();
		const rep = [''];
		const first = ['products'];
		for (let i = 0; i < v.length; i++) {
			rep.push('cs', 'ea');
			first.push(v[i], '');
		}
		arr.unshift(first, rep);
		const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(arr);
		ws['!cols'] = [{ wch: 15 }];
		/* generate workbook and add the worksheet */
		const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

		/* save to file */
		XLSX.writeFile(wb, `stock.xlsx`);
	}

}
