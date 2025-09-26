import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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

  /////////////// STATE VARIABLES

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

  /////////////// LIFECYCLE

  ngOnInit() {
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

  /////////////// GETTERS

  get avatarUrl(): string {
    return (
      this.user?.user?.avatar || '../../assets/images/defaultProfilePic.jpg'
    );
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

  ///////////////

  showMessage(msg: string) {
    if (this.userMessageArray.includes(msg)) return;

    this.userMessageArray.push(msg);

    setTimeout(() => {
      this.userMessageArray = this.userMessageArray.filter((m) => m !== msg);
    }, 3000);
  }
}
