import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';
import { product } from '../utils/products';

@Component({
	selector: 'vendor-transfert',
	templateUrl: './vendor-transfert.component.html',
	styleUrls: ['./vendor-transfert.component.scss']
})
export class VendorTransfertComponent implements OnInit {
	file: File;
	vendorsList = [];
	rawData = [];
	product = product;
	transfert = [];
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
				const deleteMetaText = _.drop(arr, 7);
				this.rawData = deleteMetaText;
				this.vendorsList = _.compact(_.uniq(deleteMetaText.map(m => m['_4'])));
			};
			fileReader.readAsArrayBuffer(this.file);
		}
	}

	selectVendor(event) {
		const transfert = [];

		event.value.forEach(v => {
			const t = { id: this.getId(v), transfer: []};
			this.rawData.filter(f => f['_4'] === v).forEach(s => {
				t['transfer'].push([
					s['_6'],
					s['_7'],
					'',
					this.getQuantity(s['_6'], s['_10'])
				]);
			});
			transfert.push(t);
		});
		this.transfert = transfert;
		console.log('transfert', this.transfert);
	}

	getQuantity(id, value) {
		const cs = Number(value.split('/')[0]);
		const ea = Number(value.split('/')[1]);
		return (this.product[id].col * cs ) + ea;
	}

	download() {
		const vendorT = JSON.parse(JSON.stringify(this.transfert));
		vendorT.forEach(v => {
			v.transfer.unshift(['Code Article', 'Article', 'Quantité conditionnée ', 'Quantité' ]);

			const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(v.transfer);

			/* generate workbook and add the worksheet */
			const wb: XLSX.WorkBook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

			/* save to file */
			XLSX.writeFile(wb, `${v.id}.xlsx`);
		});
	}

	downloadGroupedSales() {
		const vendorTransfert = JSON.parse(JSON.stringify(this.transfert));
		vendorTransfert.forEach(v => {
			v.transfer.forEach(tr => {
				tr.unshift(
					this.vendors[v.id]['Depot'], 'Nestlé', 'Stock', this.vendors[v.id]['emplacement']
				);
			});
		});
		const globalTransfert = _.flatten(vendorTransfert.map(m => m.transfer));

		globalTransfert.unshift([
			'Entrepot ', 'Marque ', 'Emplacement Source', 'Emplacement déstination',
			'Code Article', 'Article', 'Quantité conditionnée ',
			'Quantité'
		]);
		const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(globalTransfert);

		/* generate workbook and add the worksheet */
		const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'globalTransfert');

		/* save to file */
		XLSX.writeFile(wb, `Transfert Globale.xlsx`);
	}

	getId(vendorName) {
		const slicedName = 'V0' + vendorName.slice(5, 7);
		let vendor = null;
		Object.keys(this.vendors).map(m => {
			if (m.includes(slicedName)) {
				vendor = m;
			}
		});
		return vendor;
	}

}
