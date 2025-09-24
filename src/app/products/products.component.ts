import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule, NgForOf } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-products',
  imports: [NgForOf, CommonModule, RouterModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // ==========================
  // 🔹 User & product data
  // ==========================
  user = JSON.parse(localStorage.getItem('user') || '{}');
  products: any[] = [];

  // ==========================
  // 🔹 Pagination state
  // ==========================
  currentPage: number = 1;
  pagesArray: any = []
  dinamicPageNumber: number = 2; // looks like UI-related pagination number
  pageSize: number = 10;
  totalItems: number = 100;
  lastPage: number = 1;


  // ==========================
  // 🔹 Filter state
  // ==========================
  filtering: boolean = false;   // show/hide filter UI
  sorting: boolean = false; // current sorting option
  sortiOpt: string = '';        // current sorting option
  filterActive: boolean = false; // true if user applied filter
  filterOptions: string = '';   // query string used in API calls
  from: number | null = null;   // filter lower bound
  to: number | null = null;     // filter upper bound

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.currentPage = params['page'] ? +params['page'] : 1;

      // update UI helper number
      this.dinamicPageNumber =
        this.currentPage === 1
          ? 2
          : this.currentPage < 8
          ? this.currentPage + 1
          : this.dinamicPageNumber;

      console.log('Current page:', this.currentPage);

      // initial load (either filtered or normal)
      this.loadProducts(this.currentPage);
    });

    // mark filters as active if bounds already set
    if (this.from != null || this.to != null) {
      this.filterActive = true;
    }
  }

  /////////////// reusable API loader

  loadProducts(page: number = 1) {
    this.currentPage = page;

    // build params
    let params = new HttpParams().set('page', this.currentPage);

    if (this.from != null) {
      params = params.set('filter[price_from]', this.from);
    }
    if (this.to != null) {
      params = params.set('filter[price_to]', this.to);
    }
    if (this.sortiOpt) {
      params = params.set('sort', this.sortiOpt);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    this.filterOptions = queryString;

    console.log('Final query:', queryString);

    // API call
    this.apiService.filter(queryString).subscribe((res) => {
      console.log('API response:', res);
      this.products = (res as any).data;
      this.pageSize = (res as any).meta.per_page;
      this.totalItems = (res as any).meta.total;
      this.lastPage = (res as any).meta.last_page;
    });

    this.router.navigate([], {
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge',
    });
  }

  /////////////// Pagination actions

  nextPage() {
    if (this.currentPage < this.lastPage) {
      this.loadProducts(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadProducts(this.currentPage - 1);
    }
  }

  /////////////// Filtering actions

  toggleFilter(x : number) {
    if (x === 1) {
    this.filtering = !this.filtering;
    this.sorting = false;
    console.log('Filtering UI:', this.filtering);
    } else if (x === 2) {
      this.sorting = !this.sorting;
      this.filtering = false;
      console.log('Sorting UI:', this.sorting);
    }
  }

  filter() {
    this.filterActive = true;
    this.loadProducts(1);
  }

  sort(param: string) {
    this.sortiOpt = param;
    this.loadProducts(1);
  }

  /////////////// Helpers

  get resultsRange(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    return `${start}-${end}`;
  }
}
