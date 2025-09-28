import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-auth-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent {
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  token: any = '';

  ngOnInit() {
    let token = localStorage.getItem('token');
    // console.log('token exists' + token)
    if (token) {
      this.router.navigate(['/products']);
      // console.log('token exists')
    }
  }

  /////////////// user data

  loginEmail: string = '';
  loginPassword: string = '';

  Username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  inputedImage: string | null = '../../assets/images/defaultProfilePic.jpg';

  loggingIn: boolean = true;
  registering: boolean = false;

  /////////////// password visibility

  passwordType1 = 'password';
  passwordType2 = 'password';

  incorrectPass: boolean = false;
  incorrectUsername: boolean = false;
  incorrectEmail: boolean = false;
  passDontMatch: boolean = false;
  passNotEnoughCaracters: boolean = false;

  makeVisible(x: number) {
    if (x === 1) {
      this.passwordType1 =
        this.passwordType1 === 'password' ? 'text' : 'password';
    } else if (x === 2) {
      this.passwordType2 =
        this.passwordType2 === 'password' ? 'text' : 'password';
    }
  }

  resetIncorect(what: string) {
    if (what === 'password') {
      this.incorrectPass = false;
    } else if (what === 'passwordMatch') {
      this.passDontMatch = false;
    } else if (what === 'email') {
      this.incorrectEmail = false;
    } else if (what === 'username') {
      this.incorrectUsername = false;
    }
  }

  /////////////// tab change functions

  loginTabChange() {
    this.loggingIn = !this.loggingIn;
    this.registering = !this.registering;
  }

  /////////////// log in and register functions

  login() {
    let loginObj = { email: this.loginEmail, password: this.loginPassword };

    console.log(loginObj);

    this.apiService.login(loginObj).subscribe(
      (res: any) => {
        console.log(res);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res));
        window.location.href = '/products?page=1';
        this.loggingIn = true;
        this.registering = false;
      },
      (err) => {
        console.log(err);
        this.showMessage(
          'Login failed. Please check your credentials and try again.'
        );
        this.incorrectPass = true;
      }
    );
  }

  register() {
    if (this.Username.length < 3) {
      this.showMessage('Username must be at least 3 characters long.');
      return;
    }

    const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailPattern.test(this.email)) {
      this.showMessage('Invalid email format.');
      return;
    }

    if (this.password.length < 3) {
      this.showMessage('Password must be at least 3 characters long.');
      this.passNotEnoughCaracters = true;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showMessage('Passwords do not match.');
      this.passDontMatch = true;
      return;
    }

    this.passDontMatch = false;

    const formData = new FormData();
    formData.append('username', this.Username);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('password_confirmation', this.confirmPassword);
    if (this.userLogo) {
      formData.append('avatar', this.userLogo);
    }

    console.log('Form Data:', formData);

    this.apiService.register(formData).subscribe(
      (res: any) => {
        console.log(res);
        this.showMessage('Registration successful! Please log in.');
        this.loginTabChange();
      },
      (err) => {
        console.error(err);
        // this.showMessage(err)
        for (let key in err.error.errors) {
          if (
            err.error.errors[key].includes('The email has already been taken.')
          ) {
            this.incorrectEmail = true;
          } else if (
            err.error.errors[key].includes(
              'The username has already been taken.'
            )
          ) {
            this.incorrectUsername = true;
          }
        }
      }
    );
  }

  /////////////// profile picture functions

  userLogo: any;
  selectedLogoFileName: string = '';
  logoPreviewUrl: string | ArrayBuffer | null = '';

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    this.logoPreviewUrl = null;
    this.selectedLogoFileName = '';
    this.userLogo = null;

    if (file) {
      if (file.size > 1024 * 1024) {
        // size in bytes (1 MB = 1024 * 1024 bytes)
        this.showMessage('Image cannot be larger than 1 MB');
        return;
      }

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
    this.logoPreviewUrl = '';
    this.selectedLogoFileName = '';
    this.userLogo = null;
  }

  /////////////// message handling

  userMessage: string | null = null;
  userMessageArray: string[] = [];

  showMessage(msg: string) {
    if (this.userMessageArray.includes(msg)) return;

    this.userMessageArray.push(msg);

    setTimeout(() => {
      this.userMessageArray = this.userMessageArray.filter((m) => m !== msg);
    }, 3000);
  }
}
