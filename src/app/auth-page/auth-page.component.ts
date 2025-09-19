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

  Username: string = '';
  confirmPassword: string = '';

  loggingIn: boolean = false;
  registering: boolean = true;

  /////////////// password visibility

  passwordType1 = 'password';
  passwordType2 = 'password';

  makeVisible(x: number) {
    if (x === 1) {
      if (this.passwordType1 === 'password') {
        this.passwordType1 = 'text';
      } else {
        this.passwordType1 = 'password';
      }
    } else if (x === 2) {
      if (this.passwordType2 === 'password') {
        this.passwordType2 = 'text';
      } else {
        this.passwordType2 = 'password';
      }
    }
  }

  /////////////// tab change functions

  loginTabChange() {
    if (this.loggingIn === false) {
      this.loggingIn = true;
      this.registering = false;
    } else if (this.loggingIn === true) {
      this.loggingIn = false;
      this.registering = true;
    }
  }

  /////////////// log in function

  login() {
  let loginObj = { email: this.email, password: this.password };

    console.log(loginObj);

    this.apiService.login(loginObj).subscribe(
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
  register() {
     let registerObj = {
    username: this.Username,
    email: this.email,
    password: this.password,
    password_confirmation: this.confirmPassword,
  };
    console.log(registerObj);
    // console.log(loginObj);
    this.apiService.register(registerObj).subscribe((res: any) => {
      console.log(res);
      alert('Registration successful! Please log in.');
      this.loginTabChange();
    });
  }
}
