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
  token:any = ''

  ngOnInit() {
    this.token = localStorage.getItem('token')
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
        const goingToCart = {
          quantity: this.selectedQuantity,
          color: this.selectedColor,
          size: this.selectedSize,
        };

        const imgIndex = this.ProdutsData.available_colors.indexOf(
          this.selectedColor
        );

        let productWithExtras = {
          ...this.ProdutsData,
          quantity: this.selectedQuantity,
          color: this.selectedColor,
          size: this.selectedSize,
          imgIndex: imgIndex,
          cover_image: this.ProdutsData.images[imgIndex],
        };

        this.shoppingCartActive = true;

        console.log(goingToCart);
        this.cartData.push(productWithExtras);
        this.apiService.addToCart(goingToCart, this.prductId).subscribe(() => {
          this.loadCart();
        });
      }
    } else {
      this.showMessage('Please register first');
    }
  }

  updateProductInCart(obj: any, id: number) {
    return this.apiService.updateProductInCart(obj, id);
  }

  pendingQuantityChanges: Record<number, number> = {};

  changeQuantity(operation: number, productId: number, index: number) {
    let currentQuantity = this.cartData[index].quantity;
    let newQuantity = currentQuantity;

    if (operation === 0 && currentQuantity > 1) {
      newQuantity--;
      this.subtotalPrice -= this.cartData[index].total_price;
    } else if (operation === 1) {
      newQuantity++;
      this.subtotalPrice += this.cartData[index].total_price;
    }

    this.cartData[index].quantity = newQuantity;
    this.pendingQuantityChanges[productId] = newQuantity;

    const updateGoingToCart = {
      quantity: newQuantity,
      color: this.cartData[index].color,
      size: this.cartData[index].size,
    };

    this.updateProductInCart(updateGoingToCart, productId).subscribe({
      next: () => {
        delete this.pendingQuantityChanges[productId];
      },
      error: () => {
        // Revert if failed
        this.cartData[index].quantity = currentQuantity;
        this.pendingQuantityChanges[productId] = currentQuantity;
        this.subtotalPrice =
          this.subtotalPrice -
          (newQuantity - currentQuantity) * this.cartData[index].total_price;
      },
    });
  }

  deleteProductFromCart(
    index: number,
    id: number,
    color: string,
    size: string
  ) {
    const toBeDeleted = { color, size };

    const itemIndex = this.cartData.findIndex(
      (item: any) =>
        item.id === id && item.color === color && item.size === size
    );

    if (itemIndex === -1) return;

    const removedItem = this.cartData.splice(itemIndex, 1)[0];
    this.subtotalPrice -= removedItem.total_price;

    this.apiService.deleteProductFromCart(id, toBeDeleted).subscribe({
      next: (res) => {
        console.log('Delete confirmed:', res);
      },
      error: (err) => {
        console.error('Delete failed:', err);

        this.cartData.splice(itemIndex, 0, removedItem);
        this.subtotalPrice += removedItem.total_price;
      },
    });

    console.log('to delete:', toBeDeleted);
  }

  findIndex(id: any) {
    const index = this.cartData.findIndex(
      (item: { product_id: any }) => item.product_id === id
    );
    console.log('index ' + index);
    return index;
  }

  loadCart() {
    console.log('refreshed');
    this.apiService.getCart().subscribe((res: any) => {
      this.cartData = res.data || res;

      this.cartData.forEach((item: any) => {
        item.imgIndex = item.available_colors.indexOf(item.color);
      });

      this.subtotalPrice = this.cartData.reduce(
        (total: any, item: any) => total + item.total_price,
        0
      );

      console.log('cart:', this.cartData);
      console.log('subtotal:', this.subtotalPrice);
    });
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
