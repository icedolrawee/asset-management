import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login-page/login-page.component').then((m) => m.LoginPageComponent) },
  { path: 'login/admin', loadComponent: () => import('./pages/login-page/login-page.component').then((m) => m.LoginPageComponent) },
  { path: 'login/user', loadComponent: () => import('./pages/login-page/login-page.component').then((m) => m.LoginPageComponent) },
  { path: 'checkouts', canActivate: [authGuard], loadComponent: () => import('./pages/checkouts-page/checkouts-page.component').then((m) => m.CheckoutsPageComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile-page/profile-page.component').then((m) => m.ProfilePageComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./pages/assets-page/assets-page.component').then((m) => m.AssetsPageComponent) },
  { path: '**', redirectTo: '' },
];
