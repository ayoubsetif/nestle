import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';
import * as XLSX from 'xlsx';
import { product } from '../utils/products';
import { MatSnackBar } from '@angular/material';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';

@Component({
	selector: 'trade-transactions',
	templateUrl: './trade-transactions.component.html',
	styleUrls: ['./trade-transactions.component.scss']
})
export class TradeTransactionsComponent implements OnInit {
	data = new FormControl('');
	//product = product;
	product: any = [];
	file: File;
	compareSales = [];
	totalProducts = [];

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

	download() {
		const clients = this.getData();

		const groupedByOrderNumber = _.groupBy(clients, 'orderNumber');
		const filterdClients = [];
		Object.keys(groupedByOrderNumber).map(m => {
			const groupedAmount = groupedByOrderNumber[m].map(k => Number(k['amount'].split(',').join('')));
			const totalAmount = _.reduce(groupedAmount, function(a, b) { return a + b; }, 0);
			_.flatten(groupedByOrderNumber[m].map(k => k['products'])).forEach(r => {if(r[4] === 0) {	r[4] = 0.001 } })
			filterdClients.push({
				client: groupedByOrderNumber[m][0]['client'],
				vendor: groupedByOrderNumber[m][0]['vendor'],
				products: _.flatten(groupedByOrderNumber[m].map(k => k['products'])),
				amount: totalAmount
			});
		});

		filterdClients.forEach(client => {
			client.products.unshift(['Code Article', 'Article', 'Quantité conditionnée ', 'Quantité', 'Prix unitaire', 'Sous-total'  ]);
			const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(client.products);

			/* generate workbook and add the worksheet */
			const wb: XLSX.WorkBook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

			/* save to file */
			XLSX.writeFile(wb, `${client.client}(${client.vendor}).xlsx`);
		});
	}

	downloadGlobal() {
		const clients = this.getData();
		const vendors =  JSON.parse(localStorage.getItem('config'));

		clients.forEach(client => {
			client.products.forEach(sale => {
				if (!vendors[client.client]) {
					console.error('client Erroné ==>', client);
					this.snackBar.open(`Customer not found : ${client.client}`, 'Ok', { duration : 7000 });
				}
				sale.unshift(
					vendors[client.client]['Depot'], 'Nestlé', vendors[client.client]['vendeur'],
					vendors[client.client]['codeClient'], vendors[client.client]['client'],
					vendors[client.client]['emplacement']
				);
			});
		});

		const globalSales = _.flatten(clients.map(m => m.products));
		globalSales.forEach(s => {
			if(s[10] === 0) { s[10] = 0.001}
			s[11] = s[9] * s[10];
		});
		globalSales.unshift([
			'Entrepot ', 'Marque ', 'Vendeur',
			'Code client', 'Client', 'Emplacement',
			'Code Article', 'Article', 'Quantité conditionnée ',
			'Quantité', 'Prix unitaire', 'Sous-total'
		]);

		const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(globalSales);

		/* generate workbook and add the worksheet */
		const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

		/* save to file */
		XLSX.writeFile(wb, `vente gros globale.xlsx`);
	}

	downloadPresales() {
		const products = _.flatten(this.totalProducts);
		const sale = [];

		Object.keys(_.groupBy(products, 'id')).map(m => {
			if (_.groupBy(products, 'id')[m].length > 1) {
				const t = _.groupBy(_.groupBy(products, 'id')[m], 'price');
				Object.keys(t).forEach(e => {
					const aon = t[e].map(p => p['quantity']);
					const sum = _.reduce(aon, function(a, b) { return a + b; }, 0);
					sale.push([
						t[e][0]['id'], t[e][0]['name'], '', sum, Number(e), sum * Number(e)]
					);
				});
			} else {
				const a = _.groupBy(products, 'id')[m][0];
				sale.push([a['id'], a['name'], '', a['quantity'], a['price'], a['quantity'] * a['price'] ]);
			}
		});
		const total = _.reduce(sale.map(m => m[5]), function(a, b) { return a + b; }, 0);
		sale.unshift(['Code Article', 'Article', 'Quantité conditionnée ', 'Quantité', 'Prix unitaire', 'Sous-total'  ]);

		const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sale);

		/* generate workbook and add the worksheet */
		const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

		/* save to file */
		XLSX.writeFile(wb, `sale pre vente.xlsx`);
	}

	downloadTotal() {
		const products = _.flatten(this.totalProducts);
		const sale = [];
		Object.keys(_.groupBy(products, 'id')).map(m => {
			const aon = _.groupBy(products, 'id')[m].map(p => p['quantity']);
			const sum = _.reduce(aon, function(a, b) { return a + b; }, 0);
			sale.push([
				_.groupBy(products, 'id')[m][0]['id'],
				_.groupBy(products, 'id')[m][0]['name'],
				sum,
				(sum / this.product[_.groupBy(products, 'id')[m][0]['id']].col).toFixed(2)
			]
			);
		});
		sale.unshift(['Code Article', 'Article', 'En unité ', 'En caisse']);
		const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sale);

		/* generate workbook and add the worksheet */
		const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

		/* save to file */
		XLSX.writeFile(wb, `total products.xlsx`);
	}

	verify() {
		const clients =	JSON.parse(JSON.stringify(this.getData()));
		const groupedByOrderNumber = _.groupBy(clients, 'orderNumber');
		const filterdClients = [];
		Object.keys(groupedByOrderNumber).map(m => {
			const groupedAmount = groupedByOrderNumber[m].map(k => Number(k['amount'].split(',').join('')));
			const totalAmount = _.reduce(groupedAmount, function(a, b) { return a + b; }, 0);

			filterdClients.push({
				client: groupedByOrderNumber[m][0]['client'],
				vendor: groupedByOrderNumber[m][0]['vendor'],
				products: _.flatten(groupedByOrderNumber[m].map(k => k['products'])),
				amount: totalAmount
			});
		});

		filterdClients.forEach(client => {
			const calculated = _.reduce(client.products.map(m => m[3] * m[4]), function(a, b) { return a + b; }, 0);
			this.compareSales.push({
				id: client.client,
				totalDocumentSummary: client.amount,
				totalSales: calculated,
				Diffrence: calculated - client.amount
			});
		});
		const totalDS = _.reduce(this.compareSales.map(m => m['totalDocumentSummary']), function(a, b) { return a + b; }, 0);
		const totalERP = _.reduce(this.compareSales.map(m => m['totalSales']), function(a, b) { return a + b; }, 0);
		this.compareSales.push({
			id: 'TOTAL',
			totalDocumentSummary: totalDS,
			totalSales: totalERP,
			Diffrence: totalERP - totalDS
		});
	}

	getData() {
		const rawData = this.data.value;
		const clients = [];
		const firstClear = rawData.split('Salesman Name');
		firstClear.shift();
		const prods = [];
		// test later problem with undefined
		firstClear.forEach(client => {
			const products = [];
			const totalProducts = [];
			const chunks = client.split('\n').map(m => _.trim(m));
			const firstIndex = chunks.indexOf(chunks.find(f => f.includes('Refernce Description Quantity')));
			const lastIndex = chunks.indexOf(chunks.find(f => f.includes('Total Promotion')));
			const productList = _.slice(chunks, firstIndex + 1, lastIndex);
			const amount = chunks.indexOf(chunks.find(f => f.includes('Total Amt :')));

			let orderNumber = null;

			if(chunks.find(f => f.includes('ORDER NUMBER'))) {
				orderNumber = chunks.find(f => f.includes('ORDER NUMBER')).split('ORDER NUMBER :')[1];

			}
			if(chunks.find(f => f.includes('INVOICE NUMBER'))) {
				orderNumber = chunks.find(f => f.includes('INVOICE NUMBER')).split('INVOICE NUMBER :')[1];
			}
			productList.forEach(ch => {
				// Test after for when there is dump and undefined
				if (ch !== 'undefined' && !ch.includes('DUMP')) {
					products.push([
						this.separateString(ch).id,
						this.separateString(ch).name,
						'',
						this.separateString(ch).unitQuantity,
						this.separateString(ch).unitPrice
					]);
					totalProducts.push({
						id: this.separateString(ch).id,
						name: this.separateString(ch).name,
						quantity: this.separateString(ch).unitQuantity,
						price: this.separateString(ch).unitPrice
					});
				}
			});

			clients.push({
				client: this.trimClientName(chunks[21]) ,
				vendor:	chunks[0],
				products: products,
				orderNumber: orderNumber,
				amount: this.getAmout(chunks[amount - 2])
			});
			prods.push(totalProducts);
		});
		this.totalProducts = prods;
		return clients;
	}

	getAmout(value) {
		if (value) { return value; } else { return '0'; }
	}

	trimClientName(name) {
		return _.trim(name.split(':')[1]);
	}

	separateString(value) {
		let sep = [];
		let discount = [];
		let unitQuantity = 0;
		if (value.includes(' CS')) {
			sep = _.trim(value.split(' CS')[0]).split(' ');
		}	else if (value.includes(' EA')) {
			sep = _.trim(value.split(' EA')[0]).split(' ');
		} else if (value.includes(' DS')) {
			sep = _.trim(value.split(' DS')[0]).split(' ');
		}

		const quantity = sep.pop();
		const id = sep.shift();
		const name = sep.join(' ');

		let UnitPriceAfterDiscount = 0;
		if (value.includes(' CS')) {
			unitQuantity = this.product[id].col * quantity;
			discount = value.split(' CS')[1].split(' ').map(m => m.split(',').join('')).map(k => +k);
			const a = discount[3] * this.product[id].tva;
			UnitPriceAfterDiscount = (a + (a * 1 / 100)) / unitQuantity;
		}	else if (value.includes(' EA')) {
			unitQuantity = quantity;
			discount = value.split(' EA')[1].split(' ').map(m => m.split(',').join('')).map(k => +k);
			const a = discount[3] * this.product[id].tva;
			UnitPriceAfterDiscount = (a + (a * 1 / 100)) / quantity;
		} else if (value.includes(' DS')) {
			unitQuantity = quantity;
			discount = value.split(' DS')[1].split(' ').map(m => m.split(',').join('')).map(k => +k);
			const a = discount[3] * this.product[id].tva;
			UnitPriceAfterDiscount = (a + (a * 1 / 100)) / quantity;
		}

		return {
			id: id,
			quantity: quantity,
			name: name,
			unitQuantity: Number(unitQuantity),
			unitPrice: Number(UnitPriceAfterDiscount.toFixed(2))
		};
	}

	importCustomerList(event) {
		this.file = event.target.files[0];
		if (this.file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			this.snackBar.open('Wrong File Type', 'Ok', { duration : 7000 });
		} else {
			const fileReader = new FileReader();
			fileReader.onload = (e) => {
				const worksheet = this.excelService.readFile(fileReader);
				const arr = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				const config = _.keyBy(arr, 'clientDms');
				localStorage.setItem('config', JSON.stringify(config));
				this.snackBar.open('Configuration saved', 'Ok', { duration : 7000 });
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

}
