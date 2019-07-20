import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';

@Component({
	selector: 'main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
	file: File;
	constructor(
		private snackBar: MatSnackBar,
		private excelService: ExcelManipulationService
	) { }

	ngOnInit() {}

	uploadConfigFile(event) {
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
