import { Component } from '@angular/core';

@Component({
  selector: 'app-products',
  imports: [],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {

  user = JSON.parse(localStorage.getItem("user") || "{}");

  ngOnInit() {
    console.log(this.user);
  }

}
