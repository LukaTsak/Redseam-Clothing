import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const BASE_URL = 'https://api.redseam.redberryinternship.ge/api';

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
}
