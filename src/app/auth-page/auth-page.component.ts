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

  inputedImage: string | null = '../../assets/images/defaultProfilePic.jpg';

  loggingIn: boolean = false;
  registering: boolean = true;

  /////////////// password visibility

  passwordType1 = 'password';
  passwordType2 = 'password';

  makeVisible(x: number) {
    if (x === 1) {
      this.passwordType1 =
        this.passwordType1 === 'password' ? 'text' : 'password';
    } else if (x === 2) {
      this.passwordType2 =
        this.passwordType2 === 'password' ? 'text' : 'password';
    }
  }

  /////////////// tab change functions

  loginTabChange() {
    this.loggingIn = !this.loggingIn;
    this.registering = !this.registering;
  }

  /////////////// log in and register functions

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
    if (!this.userLogo) {
      alert('Please select an avatar image.');
      return;
    }

    const formData = new FormData();
    formData.append('username', this.Username);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('password_confirmation', this.confirmPassword);
    formData.append('avatar', this.userLogo);

    this.apiService.register(formData).subscribe(
      (res: any) => {
        console.log(res);
        alert('Registration successful! Please log in.');
        this.loginTabChange();
      },
      (err) => {
        console.error(err);
        alert('Registration failed. Please check your data and try again.');
      }
    );
  }

  /////////////// profile picture functions

  userLogo: any;
  selectedLogoFileName: string = '';
  logoPreviewUrl: string | ArrayBuffer | null =
    '../../assets/images/defaultProfilePic.jpg';

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    this.logoPreviewUrl = null;
    this.selectedLogoFileName = '';
    this.userLogo = null;

    if (file) {
      const reader = new FileReader();
      const image = new Image();

      reader.onload = (e: any) => {
        image.onload = () => {
          this.logoPreviewUrl = e.target.result;
          this.userLogo = file;
          this.selectedLogoFileName = file.name;

          console.log('selectedLogoFileName: ', this.selectedLogoFileName);
          console.log('file: ', this.userLogo);
        };

        image.src = e.target.result;
        console.log('Image src: ', image.src);
      };

      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.logoPreviewUrl = '../../assets/images/defaultProfilePic.jpg';
    this.selectedLogoFileName = '';
    this.userLogo = null;
  }
}
