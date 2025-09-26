import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

const BASE_URL = 'https://api.redseam.redberryinternship.ge/api';

 const token = localStorage.getItem('token');
 const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  login(obj: any) {
    return this.http.post(`${BASE_URL}/login`, obj);
  }
  register(obj: any) {
    return this.http.post(`${BASE_URL}/register`, obj);
  }
  getProducts(page? : number) {
    return this.http.get(`${BASE_URL}/products?page=${page}`);
  }
  filter(params: string) {
    return this.http.get(`${BASE_URL}/products${params}`);
  }
  getItem(id: number){
    return this.http.get(`${BASE_URL}/products/${id}`);
  }
  addToCart(obj:any, id:number){
    return this.http.post(`${BASE_URL}/cart/products/${id}`, obj, {headers});
  }
  getCart(){
    return this.http.get(`${BASE_URL}/cart`, {headers});
  }
  updateProductInCart(obj: any, id:number){
    return this.http.patch(`${BASE_URL}/cart/products/${id}`, obj, {headers});
  }
  deleteProductFromCart(id:number){
    return this.http.delete(`${BASE_URL}/cart/products/${id}`, {headers});
  }
}
