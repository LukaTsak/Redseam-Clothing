import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule, NgForOf } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-products',
  imports: [NgForOf, CommonModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  user = JSON.parse(localStorage.getItem('user') || '{}');
  products: any = [];
  currentPage: number = 1;
  dinamicPageNumber: number = 2;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.currentPage = params['page'] ? +params['page'] : 1;

      this.dinamicPageNumber =
        this.currentPage === 1
          ? 2
          : this.currentPage < 8
          ? this.currentPage + 1
          : this.dinamicPageNumber;

      console.log('Current page:', this.currentPage);

      this.apiService.getProducts(this.currentPage).subscribe((res) => {
        console.log('API response:', res);
        this.products = (res as any).data;
      });
    });
  }

  nextPage() {
    this.router.navigate([], {
      queryParams: { page: this.currentPage + 1 },
      queryParamsHandling: 'merge',
    });
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.router.navigate([], {
        queryParams: { page: this.currentPage - 1 },
        queryParamsHandling: 'merge',
      });
    }
  }

  pageSize = 10;
  totalItems = 100;

  get resultsRange(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    return `${start}-${end}`;
  }
}
