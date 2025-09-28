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
  cartData: any = [];
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

  /////////////// checkout

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

  congratsOpenClose() {
    this.congrats = false;
    this.loadCart();
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
