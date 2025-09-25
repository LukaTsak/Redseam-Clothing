import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-details',
  imports: [FormsModule, CommonModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent {
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  prductId: number = 0;
  ProdutsData: any = {};
  images = [];

  selectedColor: string = '';
  selectedColorId: number = 0;
  selectedQuantity: number = 1;

  quantDropdownActive: boolean = false;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.prductId = params['id'] ? +params['id'] : 1;

      this.apiService.getItem(this.prductId).subscribe((data: any) => {
        this.ProdutsData = data;
        this.images = data.images;
        this.selectedColor = data.available_colors[0];
        console.log('adasda', this.ProdutsData);
        // console.log('ava', this.ProdutsData.available_colors[0]);
      });
    });
  }

  setColor(color: string, index: number) {
    this.selectedColor = color;
    this.selectedColorId = index;
  }

  quanityUpdate(quant: number) {
    this.selectedQuantity = quant;
    this.quantDropdownActive = false;
  }

  dropdown(){
      this.quantDropdownActive = !this.quantDropdownActive;
      console.log('worked ' + this.quantDropdownActive)

  }
}
