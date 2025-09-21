import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule, NgForOf } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
// import { CommonModule, NgForOf } from "../../../node_modules/@angular/common/common_module.d-NEF7UaHr";

@Component({
  selector: 'app-products',
  imports: [NgForOf, CommonModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  user = JSON.parse(localStorage.getItem('user') || '{}');
  products: any = [];
  currentPage: number = 1;

  dinamicPageNumber: number = 1;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.currentPage = params['page'] ? +params['page'] : 1;
      this.dinamicPageNumber =
        this.dinamicPageNumber < 8
          ? this.dinamicPageNumber + 1
          : this.dinamicPageNumber;

          if(this.currentPage == 1){
            this.dinamicPageNumber = 2;
          }

      console.log('Current page:', this.currentPage);

      this.apiService.getProducts(this.currentPage).subscribe((res) => {
        console.log('API response:', res);
        this.products = (res as any).data;
      });
    });
  }
}
