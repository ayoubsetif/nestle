import { Component, OnInit } from '@angular/core';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import { MatSnackBar } from '@angular/material';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';
import { product } from '../utils/products';

@Component({
  selector: 'new-stock',
  templateUrl: './new-stock.component.html',
  styleUrls: ['./new-stock.component.scss']
})
export class NewStockComponent implements OnInit {

  warehousName = '';

	constructor(
		private snackBar: MatSnackBar,
		private excelService: ExcelManipulationService
	) { }

	file: File;
	product: any = [];
	dmsVStock = [];
	vanIds = [];
	erpVStock = [];
	idx = 0;
	vendorsList = [];
	selectedVan = [];

	ngOnInit() {
		const prods =  JSON.parse(localStorage.getItem('prodconfig'));
		if(!prods || prods.length === 0) {
			this.product = product;
		}else {
			this.product = prods;
		}
	}

	uploadDmsFile(event) {
		this.file = event.target.files[0];
		if (this.file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			this.snackBar.open('Wrong File Type', 'Ok', { duration : 7000 });
		} else {
			const fileReader = new FileReader();
			fileReader.onload = (e) => {
				const worksheet = this.excelService.readFile(fileReader);
				const vendorList = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				this.warehousName = vendorList[3]['__EMPTY'];
				const deleteMetaText = _.drop(vendorList, 17);
				this.splitIntoArrays(deleteMetaText);
				this.vanIds = this.dmsVStock.map(m => m[0]).map(f => f['vanId']);
				console.log('dms', this.dmsVStock);
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

	splitIntoArrays(table) {
		const element = [];
		table.forEach(e => {
      		if (e["Inventory Valuation "] === 'Distributor') {
	        	const separator = table.splice(table.indexOf(e) + 1);
				table.forEach(el => {
					const test = el['Inventory Valuation '];
					if (test && test.includes('Wareho')) {
						if(el['__EMPTY'].includes('VAN')) {
							if (this.warehousName.includes('TEBESSA')) {
								element.push({ vanId: 'V0' + el['__EMPTY'].slice(3, 5) , vanName: el['__EMPTY']  });
							}	else {
								element.push({ vanId: 'V0' + el['__EMPTY'].slice(5, 7) , vanName: el['__EMPTY']  });
							}
							table.forEach(t => {
								if (t['Inventory Valuation '] && !t['Inventory Valuation '].includes('Wareh') && !t['Inventory Valuation '].includes('Total:') && !t['Inventory Valuation '].includes('Distributor')) {
									element.push({
										id: t['__EMPTY'],
										name: t['__EMPTY_1'],
										quantity: this.getEntity(t['__EMPTY'], Object.values(t)[8])
									});
								}
							});

						}else {
							if(el['__EMPTY'].includes('MN_WH')) {
								element.push({ vanId: 'Stock' , vanName: 'DEPOT'  });
							}
							if(el['__EMPTY'].includes('Bad G')) {
								element.push({ vanId: 'Pirimé' , vanName: 'Pirimé'  });
							}
							if(el['__EMPTY'].includes('Avari')) {
								element.push({ vanId: 'Avarie' , vanName: 'Avarie'  });
							}
							if(el['__EMPTY'].includes('Manquant')) {
								element.push({ vanId: 'Monquant' , vanName: 'Monquant'  });
							}
							if(el['__EMPTY'].includes('SD_Centre')) {
								element.push({ vanId: 'NA/SD_Centre' , vanName: 'DEPOT'  });
							}
							if(el['__EMPTY'].includes('SD_Est')) {
								element.push({ vanId: 'NA/SD_Est' , vanName: 'DEPOT'  });
							}
							if(el['__EMPTY'].includes('SD_Ouest')) {
								element.push({ vanId: 'NA/SD_Ouest' , vanName: 'DEPOT'  });
							}
							if(el['__EMPTY'].includes('SD_Superette')) {
								element.push({ vanId: 'NA/SD_Superette' , vanName: 'DEPOT'  });
							}
							table.forEach(t => {
								if (t['Inventory Valuation '] && !t['Inventory Valuation '].includes('Wareh') && !t['Inventory Valuation '].includes('Total:') && !t['Inventory Valuation '].includes('Distributor')) {
									element.push({
										id: t['__EMPTY'],
										name: t['__EMPTY_1'],
										quantity: this.getEntity(t['__EMPTY'], Object.values(t)[8])
									});
								}
							});
						}
					} else if (test && (test.includes('MN_WH') || test.includes('SD_'))) {
						console.log('hhhhhhhhhhhhhhhere')
					}
				});
				this.splitIntoArrays(separator);
				if (element.length) { this.dmsVStock.push(element); }
			}
		});
	}

	uploadErpFile(event) {
		this.file = event.target.files[0];
		if (this.file.type !== 'application/vnd.ms-excel') {
			this.snackBar.open('Wrong File Type', 'Ok', { duration : 7000 });
		} else {
			const fileReader = new FileReader();
			fileReader.onload = (e) => {
				const worksheet = this.excelService.readFile(fileReader);
				const vList = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				this.splitErp(vList);
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

	splitErp(erp: any[]) {
		const indexes = [];
		erp.forEach(e => {
			this.vanIds.forEach(id => {
				if (e['__EMPTY'].includes(id)) {
					indexes.push(e);
				}
			});
		});
		this.getStocks(indexes, erp);
		this.vendorsList = this.erpVStock.map(m => m[0]);
	}

	getStocks(indexes, arr) {
		if (indexes.length > 0 ) {
			const a = arr.splice(arr.indexOf(indexes[0]));
			if (this.idx > 0) {
				const van = [];
				// verify after here
				const firstElement = arr.shift();
				van.push({
					vanId: this.getVan(firstElement).id,
					vanName: this.getVan(firstElement).name
				});
				arr.forEach(e => {
					van.push({
						id: this.getProduct(e['__EMPTY']).id,
						name: this.getProduct(e['__EMPTY']).name,
						quantity: e['Total']
					});
				});
				this.erpVStock.push(van);
			}
			if (indexes.length === 1) {
				const element = [];
				const stock = a.shift();
				element.push({
					vanId: this.getVan(stock).id,
					vanName: this.getVan(stock).name
				});
				a.forEach(el => {
					element.push({
						id: this.getProduct(el['__EMPTY']).id,
						name: this.getProduct(el['__EMPTY']).name,
						quantity: el['Total']
					});
				});
				this.erpVStock.push(element);
			}
			indexes.splice(0, 1);
			this.idx++;
			this.getStocks(indexes, a);
		}
	}

	getProduct(prod) {
		// this if is for setif stock make exception
		if ((prod.includes('pack cereal')) || (prod.includes('Plan Marhaba')) || (prod.includes('PLAN MARHABA'))) {
			return { id: null, name: null };
		} else {
			const id = prod.split('[')[1].split(']')[0];
			const name = _.trim(prod.split('[')[1].split(']')[1]);
			return { id: id, name: name };
		}
	}

	getVan(value) {
		let id = '';
		const name = _.trim(value['__EMPTY']);
		if (value['__EMPTY'].includes('V0')) {
			id = ('V0' + value['__EMPTY'].split('V0')[1]).slice(0, 4);
		} else if (value['__EMPTY'].includes('Stock')) {
			id = 'Stock';
		} else {
			id = _.trim(value['__EMPTY']);
		}
		return { id: id, name: name };
	}

	getEntity(prod: string , quantity: any) {
		quantity = quantity.split(',').join('');
		const cs = parseInt(quantity.split('/')[0], 10);
		const ea = parseInt(quantity.split('/')[1], 10);
		if(!this.product[prod]) {
			this.snackBar.open('missing product ID'+ prod, 'Ok', { duration : 7000 });
		}
		if (prod === '12432519') {
			return (cs * this.product[prod].col) + (ea * 6);
		} else {
			return cs * this.product[prod].col + ea;
		}

	}

	selectVendor(event) {
		const dms = this.dmsVStock.filter(f => f[0].vanId === event.value)[0];
		const erp = this.erpVStock.filter(f => f[0].vanId === event.value)[0];
		this.selectedVan = this.compareArrays(dms, erp);
	}

	compareArrays(dms: any[], erp: any[]) {
		const uniqueDms = dms.filter(f => {
			return !erp.some(o => f['id'] === o['id'] && f['quantity'] === o['quantity'] );
		});
		const uniqueErp = erp.filter(f => {
			return !dms.some(o => f['id'] === o['id'] && f['quantity'] === o['quantity']);
		});
		const diff = JSON.parse(JSON.stringify(_.uniqBy(uniqueDms.concat(uniqueErp), 'id')));

		diff.forEach(d => {
			const m = dms.find(f => f['id'] === d['id']);
			const r = erp.find(q => q['id'] === d['id']);
			if (!m) {
				d['quantity'] = r['quantity'] - 0;
				d['dmsQuantity'] = 0;
				d['erpQuantity'] = r['quantity'];
			} else if (!r) {
				d['quantity'] = 0 - m['quantity'];
				d['erpQuantity'] = 0;
				d['dmsQuantity'] = m['quantity'];
			}	else {
				d['erpQuantity'] = r['quantity'];
				d['dmsQuantity'] = m['quantity'];
				d['quantity'] = r['quantity'] - m['quantity'];
			}
		});
		return diff;
	}

}
