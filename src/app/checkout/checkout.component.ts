import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  user = JSON.parse(localStorage.getItem('user') || '{}');

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

  Address: string = '';
  Name: string = '';
  Surname: string = '';
  Email: string = this.user.user.email;
  ZipCode: string = '';

  ngOnInit() {
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

  checoutData: any = {};
  congrats: boolean = false;

  checkout() {
    let checkoutData = {
      name: this.Name,
      surname: this.Surname,
      email: this.Email,
      address: this.Address,
      zip_code: this.ZipCode.toString(),
    };
    console.log(checkoutData);
    this.apiService.checkout(checkoutData).subscribe((res) => {
      this.checoutData = res;
      this.showMessage(this.checoutData.message);

      if (
        this.checoutData.message ===
        'Checkout successful. Thank you for your purchase!'
      ) {
        this.congrats = true;
      }
      // this.router.navigate(['/products']);
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

  /////////////// Helpers
  get avatarUrl(): string {
    return (
      this.user?.user?.avatar || '../../assets/images/defaultProfilePic.jpg'
    );
  }
}
