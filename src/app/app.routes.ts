import { Routes } from '@angular/router';
import { AuthPageComponent } from './auth-page/auth-page.component';

export const routes: Routes = [
    {path: '', redirectTo: 'login', pathMatch: 'full'},

    {path: 'login', component: AuthPageComponent},
];
