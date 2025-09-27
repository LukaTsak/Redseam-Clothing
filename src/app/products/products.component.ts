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

  /////////////// User & product data

  user = JSON.parse(localStorage.getItem('user') || '{}');
  products: any[] = [];

  /////////////// Pagination state
  currentPage: number = 1;
  pagesArray: any = [];
  dinamicPageNumber: number = 2;
  pageSize: number = 10;
  totalItems: number = 100;
  lastPage: number = 1;

  /////////////// Filter state

  filtering: boolean = false;
  sorting: boolean = false;
  sortiOpt: string = '';
  filterActive: boolean = false;
  filterOptions: string = '';
  from: number | null = null;
  to: number | null = null;

  shoppingCartActive: boolean = false;
  cartData: any = {};
  subtotalPrice: number = 0;
  userMessageArray: string[] = [];
  ProdutsData: any = {};
  selectedColor: string = '';
  selectedColorId: number = 0;
  selectedQuantity: number = 1;
  selectedSize: string = '';
  prductId: number = 0;

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

    if (this.from != null || this.to != null) {
      this.filterActive = true;
    }

    if (localStorage.getItem('token')) {
      this.apiService.getCart().subscribe((cartData) => {
        this.cartData = cartData;

        this.cartData.forEach((item: any) => {
          item.imgIndex = item.available_colors.indexOf(item.color);
        });

        console.log('cart:', this.cartData);
        console.log(this.cartData[0].price);

        for (let i = 0; i < this.cartData.length; i++) {
          this.subtotalPrice =
            this.subtotalPrice + this.cartData[i].total_price;
        }
        console.log(this.subtotalPrice);
      });
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

  toggleFilter(x: number) {
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

  resetFilters() {
    this.filterActive = false;
    this.from = null;
    this.to = null;
    this.loadProducts(1);
  }

  sort(param: string) {
    if (this.sortiOpt === param) {
      this.sortiOpt = '';
      this.loadProducts(1);
    } else {
      this.sortiOpt = param;
      this.loadProducts(1);
    }
  }

  /////////////// Helpers

  get resultsRange(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    return `${start}-${end}`;
  }
  get avatarUrl(): string {
    return (
      this.user?.user?.avatar || '../../assets/images/defaultProfilePic.jpg'
    );
  }
  /////////////// CART ACTIONS

  cartOpen() {
    this.shoppingCartActive = !this.shoppingCartActive;
    console.log('huh?: ' + this.shoppingCartActive);
  }

  addToCart(id: number) {
    if (localStorage.getItem('token')) {
      if (
        !this.ProdutsData.quantity ||
        !this.ProdutsData.available_colors ||
        !this.ProdutsData.available_sizes
      ) {
        this.showMessage('Can not add this item to cart');
      } else {
        let goingToCart = {
          quantity: this.selectedQuantity,
          color: this.selectedColor,
          size: this.selectedSize,
        };

        this.shoppingCartActive = true;

        console.log(goingToCart);
        this.apiService
          .addToCart(goingToCart, this.prductId)
          .subscribe((params: any) => {
            console.log(params);
            this.loadCart();
            if (params && params.total_price) {
              this.subtotalPrice += params.total_price;
            }
          });
      }
    } else {
      this.showMessage('Please register first');
    }
  }

  updateProductInCart(obj: any, id: number) {
    return this.apiService.updateProductInCart(obj, id);
  }

  changeQuantity(operation: number, productId: number, index: number) {
    let currentQuantity = this.cartData[index].quantity;
    let newQuantity = currentQuantity;

    if (operation === 0 && currentQuantity > 1) {
      newQuantity = currentQuantity - 1;
      this.subtotalPrice =
        this.subtotalPrice - this.cartData[index].total_price;
    } else if (operation === 1) {
      newQuantity = currentQuantity + 1;
      this.subtotalPrice =
        this.subtotalPrice + this.cartData[index].total_price;
    }

    const updateGoingToCart = {
      quantity: newQuantity,
      color: this.cartData[index].color,
      size: this.cartData[index].size,
    };

    this.updateProductInCart(updateGoingToCart, productId).subscribe(
      (response) => {
        this.cartData[index].quantity = newQuantity;
      }
    );
  }

  deleteProductFromCart(
    index: number,
    id: number,
    color: string,
    size: string
  ) {
    let toBeDeleted = {
      color: color,
      size: size,
    };
    this.apiService.deleteProductFromCart(id, toBeDeleted).subscribe((res) => {
      console.log('after delete ' + res);
      this.loadCart(index);
      if (this.cartData.length === 1) {
        this.subtotalPrice = 0;
        console.log(this.subtotalPrice);
      }
    });
    console.log(toBeDeleted);
  }

  findIndex(id: any) {
    const index = this.cartData.findIndex(
      (item: { product_id: any }) => item.product_id === id
    );
    console.log('index ' + index);
    return index;
  }

  loadCart(i?: number) {
    console.log('refreshed');
    this.apiService.getCart().subscribe((res: any) => {
      this.cartData = res.data || res;
    });
    if (i) {
      this.subtotalPrice = this.subtotalPrice - this.cartData[i].total_price;
    }
  }

  /////////////// show message

  showMessage(msg: string) {
    if (this.userMessageArray.includes(msg)) return;

    this.userMessageArray.push(msg);

    setTimeout(() => {
      this.userMessageArray = this.userMessageArray.filter((m) => m !== msg);
    }, 3000);
  }

  goToProducts(where: string) {
    this.router.navigate([`/${where}`]);
  }
}
