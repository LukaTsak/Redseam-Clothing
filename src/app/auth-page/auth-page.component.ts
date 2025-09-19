import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-auth-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent {
  constructor(private apiService: ApiService) {}

  /////////////// user data

  email: string = '';
  password: string = '';

  userObj = { email: this.email, password: this.password }

  /////////////// password visibility

  passwordType = 'password';

  makeVisible() {
    if (this.passwordType === 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType === 'text';
      this.passwordType = 'password';
    }
  }

  /////////////// log in function

  login() {
    this.apiService.Login(this.userObj).subscribe(
      (res: any) => {
        console.log(res);
        localStorage.setItem('token', res.token);
        window.location.href = '/products';
      },
      (err) => {
        console.log(err);
        alert('Login failed. Please check your credentials and try again.');
      }
    );
  }
}
