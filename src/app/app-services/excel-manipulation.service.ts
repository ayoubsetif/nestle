import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
	providedIn: 'root'
})
export class ExcelManipulationService {
	arrayBuffer: any;

	constructor() { }

	readFile(fileReader) {
		this.arrayBuffer = fileReader.result;
		const data = new Uint8Array(this.arrayBuffer);
		const arr = new Array();
		for (let i = 0; i !== data.length; ++i) { arr[i] = String.fromCharCode(data[i]); }
		const bstr = arr.join('');
		const workbook = XLSX.read(bstr, {type: 'binary'});
		const first_sheet_name = workbook.SheetNames[0];
		return workbook.Sheets[first_sheet_name];
	}

}
