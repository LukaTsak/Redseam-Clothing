import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as CartUtils from '../cart-functions';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  /////////////// STATE VARIABLES

  safeImageUrl!: SafeUrl;

  ProdutsData: any = {};
  cartData: any = {};
  images = [CommonModule, RouterModule, FormsModule, NgForm];

  prductId: number = 0;
  selectedColor: string = '';
  selectedColorId: number = 0;
  selectedQuantity: number = 1;
  selectedSize: string = '';
  subtotalPrice: number = 0;

  quantDropdownActive: boolean = false;
  shoppingCartActive: boolean = false;

  user = JSON.parse(localStorage.getItem('user') || '{}');
  userMessage: string | null = null;
  userMessageArray: string[] = [];
  token: any = '';

  /////////////// LIFECYCLE

  ngOnInit() {
    this.token = localStorage.getItem('token');

    this.route.queryParams.subscribe((params) => {
      this.prductId = params['id'] ? +params['id'] : 1;

      this.apiService.getItem(this.prductId).subscribe((data: any) => {
        this.ProdutsData = data;
        this.images = data.images;
        this.selectedColor = data.available_colors[0];
        this.selectedSize = data.available_sizes[0];
        console.log('data: ', this.ProdutsData);
        console.log('product_id: ', this.prductId);
      });
    });

    if (localStorage.getItem('token')) {
      this.apiService.getCart().subscribe((cartData) => {
        this.cartData = cartData;

        this.cartData.forEach((item: any) => {
          item.imgIndex = item.available_colors.indexOf(item.color);
        });

        console.log('cart:', this.cartData);

        for (let i = 0; i < this.cartData.length; i++) {
          this.subtotalPrice =
            this.subtotalPrice + this.cartData[i].total_price;
        }
      });
    }
  }

  getSanitizedImageUrl(url: any): any {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  /////////////// GETTERS

  get avatarUrl(): string {
    return (
      this.user?.user?.avatar || '../../assets/images/defaultProfilePic.jpg'
    );
  }

  setImage(url: string) {
    return (this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(url));
  }

  /////////////// PRODUCT SELECTION

  setColor(color: string, index: number) {
    this.selectedColor = color;
    this.selectedColorId = index;
  }

  setSize(size: string) {
    this.selectedSize = size;
  }

  quanityUpdate(quant: number) {
    this.selectedQuantity = quant;
    this.quantDropdownActive = false;
  }

  dropdown() {
    this.quantDropdownActive = !this.quantDropdownActive;
    console.log('worked ' + this.quantDropdownActive);
  }

  normalizeColor(color: string): string {
    if (!color) return '';
    const parts = color.trim().split(' ');
    return parts.length === 1 ? parts[0] : parts[parts.length - 1];
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
  quantityChangeTimers: Record<number, any> = {};

  changeQuantity(operation: number, productId: number, index: number) {
    const cartItem = this.cartData[index];
    cartItem.quantity = Math.max(
      1,
      cartItem.quantity + (operation === 1 ? 1 : -1)
    );
    this.pendingQuantityChanges[productId] = cartItem.quantity;
    this.recalculateSubtotal();

    if (this.quantityChangeTimers[productId]) {
      clearTimeout(this.quantityChangeTimers[productId]);
    }

    this.quantityChangeTimers[productId] = setTimeout(() => {
      const updatePayload = {
        quantity: this.pendingQuantityChanges[productId],
        color: cartItem.color,
        size: cartItem.size,
      };

      this.updateProductInCart(updatePayload, productId).subscribe({
        next: () => {
          this.loadCart();
          delete this.pendingQuantityChanges[productId];
        },
        error: () => {
          this.loadCart();
          delete this.pendingQuantityChanges[productId];
        },
      });
    }, 500);
  }

  recalculateSubtotal() {
    this.subtotalPrice = this.cartData.reduce(
      (sum: any, item: any) =>
        sum + (item.quantity * item.total_price) / item.quantity,
      0
    );
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
