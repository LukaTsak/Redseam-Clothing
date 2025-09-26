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

  ProdutsData: any = {};
  cartData: any = {};

  images = [CommonModule, RouterModule, FormsModule, NgForm];

  prductId: number = 0;
  selectedColor: string = '';
  selectedColorId: number = 0;
  selectedQuantity: number = 1;
  selectedSize: string = '';

  quantDropdownActive: boolean = false;
  shoppingCartActive: boolean = true;

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

        // console.log('ava', this.ProdutsData.available_colors[0]);
      });
    });

    this.apiService.getCart().subscribe((cartData) => {
      this.cartData = cartData;
      console.log('cart:', this.cartData);
    });
  }

  setColor(color: string, index: number) {
    this.selectedColor = color;
    this.selectedColorId = index;
  }

  setSize(size: string) {
    this.selectedSize = size;
    // console.log(this.selectedSize)
  }

  quanityUpdate(quant: number) {
    this.selectedQuantity = quant;
    this.quantDropdownActive = false;
  }

  dropdown() {
    this.quantDropdownActive = !this.quantDropdownActive;
    console.log('worked ' + this.quantDropdownActive);
  }

  cartOpen() {
    this.shoppingCartActive = !this.shoppingCartActive;
    console.log('huh?: ' + this.shoppingCartActive);
  }

  normalizeColor(color: string): string {
    if (!color) return '';
    const parts = color.trim().split(' ');
    return parts.length === 1 ? parts[0] : parts[parts.length - 1];
  }

  addToCart() {
    let goingToCart = {
      quantity: this.selectedQuantity,
      color: this.selectedColor,
      size: this.selectedSize,
    };

    console.log(goingToCart);
    this.apiService
      .addToCart(goingToCart, this.prductId)
      .subscribe((params) => {
        console.log(params);
      });
  }
}
