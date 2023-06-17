import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';
import { ReplaySubject } from 'rxjs';
import { product } from '../utils/products';

@Component({
  selector: 'app-new-vs',
  templateUrl: './new-vs.component.html',
  styleUrls: ['./new-vs.component.scss']
})
export class NewVsComponent implements OnInit {
  file: File;
	vendorsList = [];
	vendorsSummary = [];
	sales = [];
	rawData = [];
	compareArray = new ReplaySubject<any[]>(1);
	product: any = [];
	vendorsReturn = [];
	vendors = {};

	constructor(
		private snackBar: MatSnackBar,
		private excelService: ExcelManipulationService
	) { }

	ngOnInit() {
		this.vendors =  JSON.parse(localStorage.getItem('config'));
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
				const arr = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				console.log('arr', arr)
				const deleteMetaText = _.drop(arr, 10);
				this.rawData = deleteMetaText;
				this.vendorsList = _.compact(_.uniq(deleteMetaText.map(m => m['__EMPTY_9']))); //__EMPTY_8
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
				this.vendorsSummary = _.drop(arr, 9).map(v => {
          if(v['Document Summary(VN)'] ){
            if(v['Document Summary(VN)'].includes('Total')) {
              return { id: (v['Document Summary(VN)'].slice(18)).replace(' - ', '-').trim(), total: (v['__EMPTY_15'])};
            }
          }
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

		const documentSummary  = _.intersectionBy(this.vendorsSummary.filter(f => f), listingSummary, 'id' );
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
			const aSale = { id: v, sales: [], globalSales: []};
			const ss = [];
			this.rawData.filter(f => f['__EMPTY_9'] === v).forEach(s => { //__EMPTY_8
				ss.push({
					id: s['__EMPTY_6'], //__EMPTY_5
					name: s['__EMPTY_7'], // __EMPTY_6
					price: this.getUnitPrice(s['__EMPTY_6'], s['__EMPTY_17'], s['__EMPTY_21']), //__EMPTY_5 __EMPTY_16 __EMPTY_20
					quantity: this.getQuantity(s['__EMPTY_6'], s['__EMPTY_27'], s['__EMPTY_28'] )//__EMPTY_5 __EMPTY_25 __EMPTY_26

				});
			});
			aSale['globalSales'] =ss;
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
		const retailPrice = dmsPrice * this.product[id].tva;

		const unitPrice = (retailPrice + (retailPrice * 1 / 100)) / this.product[id].col;
		let UnitPriceAfterDiscount = unitPrice - ((unitPrice * discount) / 100);
		if (UnitPriceAfterDiscount === 0.00) {
			UnitPriceAfterDiscount = 0.01;
		}
		return Number(UnitPriceAfterDiscount.toFixed(2));
	}

	getQuantity(id, quantity, uom) {
		// add exception for this Article
		if (id === '12432519') {
			if (uom === 'EA' || uom === 'DS') {
				return Number(quantity * 6);
			} else {
				return this.product[id].col * quantity;
			}
		} else {
			if (uom === 'EA' || uom === 'DS') {
				return Number(quantity);
			} else {
				return this.product[id].col * quantity;
			}
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

	downloadTotal() {
		const vendorSales = JSON.parse(JSON.stringify(this.sales));
		vendorSales.forEach(v => {
			const r = [];
			r.push(['Code Article', 'Article', 'Quantité en unité', 'Quantité en caisse ']);
			const t =_.groupBy(v.globalSales, 'id');

			Object.keys(_.groupBy(v.globalSales, 'id')).forEach(e => {
				const aon = t[e].map(p => p['quantity']);
				const sum = _.reduce(aon, function(a, b) { return a + b; }, 0);
				r.push([e, t[e][0]['name'], sum, sum /this.product[e].col ])
			});
			const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(r);
			const wb: XLSX.WorkBook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
		
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
