import { Component, OnInit } from '@angular/core';
import { ExcelManipulationService } from '../app-services/excel-manipulation.service';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  file: File;
  vendorsSummary = [];
	displayedColumns: string[] = ['id', 'Total', 'Copy'];

  constructor(private excelService: ExcelManipulationService) { }

  ngOnInit() {}

  uploadSummaryFile(event) {
		this.file = event.target.files[0];
		const fileReader = new FileReader();
		fileReader.onload = (e) => {
			const worksheet = this.excelService.readFile(fileReader);
			const arr = XLSX.utils.sheet_to_json(worksheet, {raw: true });
      const f = [];
      const a = [];
      _.drop(arr, 10).map(m => {
        if(m['Document Summary(VN)'] ){
          if(!m['Document Summary(VN)'].includes('Total')) {
            a.push({ id: m['__EMPTY'], saleAfterVAT: m['__EMPTY_15'], grossAmount: m['__EMPTY_9']})
            }
          }
      })
      Object.keys(_.groupBy(a, 'id')).map(k => {
        const aon = _.groupBy(a, 'id')[k].filter(f => f['grossAmount'] !== 0 ).map(p => p['saleAfterVAT']);
				const sum = _.reduce(aon, function(a, b) { return a + b; }, 0);
        f.push({id: k, Total: sum.toFixed(2)})
      });
      this.vendorsSummary = f;
      console.log('f', f)
      console.log('fffff', this.vendorsSummary)
    };
		fileReader.readAsArrayBuffer(this.file);
	}

  copy(elem) {
    navigator.clipboard.writeText(elem).then(function() {
      /* clipboard successfully set */
    }, function() {
      /* clipboard write failed */
    });
  }

}
