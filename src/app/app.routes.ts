import { Routes } from '@angular/router';
import { AuthPageComponent } from './auth-page/auth-page.component';
import { ProductsComponent } from './products/products.component';

export const routes: Routes = [
    {path: '', redirectTo: 'products', pathMatch: 'full'},

    {path: 'login', component: AuthPageComponent},
    {path: 'products', component: ProductsComponent},
];
