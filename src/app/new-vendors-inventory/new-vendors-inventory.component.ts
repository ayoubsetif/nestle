import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import * as _ from 'lodash';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import * as XLSX from 'xlsx';
import { forkJoin } from 'rxjs';
import * as jsPDF from 'jspdf';
import * as html2canvas from 'html2canvas';

@Component({
  selector: 'new-vendors-inventory',
  templateUrl: './new-vendors-inventory.component.html',
  styleUrls: ['./new-vendors-inventory.component.scss']
})
export class NewVendorsInventoryComponent implements OnInit {
    file: File;
	vendorsList = [];
	dmsVStock = [];
	vendorsNames = [];
	selectedVans = [];

	constructor(
		private snackBar: MatSnackBar,
		private excelService: ExcelManipulationService
		) { }

	ngOnInit() {
	}

	uploadDFile(event) {
		this.file = event.target.files[0];
		if (this.file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			this.snackBar.open('Wrong File Type', 'Ok', { duration : 7000 });
		} else {
			const fileReader = new FileReader();
			fileReader.onload = (e) => {
				const worksheet = this.excelService.readFile(fileReader);
				const vendorList = XLSX.utils.sheet_to_json(worksheet, {raw: true });
				const deleteMetaText = _.drop(vendorList, 16);
        console.log('deleteMetaText', deleteMetaText)
				this.vendorsList = deleteMetaText.filter(f => f['Inventory Valuation '])
					.filter(k => k['Inventory Valuation '].includes('War')).map(m => m['__EMPTY']);
				this.splitIntoArrays(deleteMetaText);
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
            element.push({ vanId: 'V0' + el['__EMPTY'].slice(5, 7) , vanName: el['__EMPTY']  });
            table.forEach(t => {
              if (t['Inventory Valuation '] && !t['Inventory Valuation '].includes('Wareh') && !t['Inventory Valuation '].includes('Total:') && !t['Inventory Valuation '].includes('Distributor')) {
                element.push({
                  id: t['__EMPTY'],
                  name: t['__EMPTY_1'],
                  quantity: Object.values(t)[8]
                });
              }
            });
					}
				});
				this.splitIntoArrays(separator);
				if (element.length) { this.dmsVStock.push(element); }
			}
		});
	}

	selectVendor(event) {
		const vendors = [];
		this.dmsVStock.forEach(dv => {
			const filterd = dv.filter(f => f['id'] !== 'PrdCat2 :');
			filterd.forEach(dvv => {
				const vendor = event.value.find(f => f === dvv['vanName']);
				if (vendor) { vendors.push(filterd); }
			});
		});
		this.selectedVans = vendors;
	}

	print() {
		const doc = new jsPDF('p', 'mm', 'a4');
		const arr = [];
		for (let i = 0; i < this.selectedVans.length; i++) {
			const e = html2canvas(document.getElementById(this.selectedVans[i][0]['vanId']), { scale: 2}).then(function(canvas) {
				const img = canvas.toDataURL('image/png');
				if (i > 0) { doc.addPage();	}
				// doc.internal.scaleFactor = 1.55; //210 , 297
				doc.addImage(img, 'JPEG', 5, 5, 230, 285, '', 'FAST');
			});
			arr.push(e);
		}
		forkJoin(arr).subscribe(() => {
			doc.save('Inventaire Vendeur.pdf');
		});
	}

}
