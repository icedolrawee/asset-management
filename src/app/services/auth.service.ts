import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthUser { id: number; email: string; displayName: string; role: 'ADMIN' | 'USER'; }
interface AuthResponse { success: boolean; token: string; user: AuthUser; simulated?: boolean; message?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'http://localhost:4000/api/auth';
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() { this.startExpiryTimer(); }

  get token(): string | null { return sessionStorage.getItem('asset_auth_token'); }
  get user(): AuthUser | null {
    const value = sessionStorage.getItem('asset_auth_user');
    if (!value) return null;
    try { return JSON.parse(value) as AuthUser; } catch { return null; }
  }
  get isLoggedIn(): boolean {
    if (!this.token || !this.user) return false;
    const expiresAt = this.getTokenExpiry();
    if (!expiresAt || expiresAt <= Date.now()) {
      this.logout(true);
      return false;
    }
    return true;
  }
  get isAdmin(): boolean { return this.user?.role === 'ADMIN'; }

  adminLogin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.baseUrl + '/admin-login', { email, password }).pipe(tap((r) => this.save(r)));
  }
  simulateUserLogin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.baseUrl + '/simulate-user-login', { email, password }).pipe(tap((r) => this.save(r)));
  }

  logout(redirect = false): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.expiryTimer = null;
    sessionStorage.removeItem('asset_auth_token');
    sessionStorage.removeItem('asset_auth_user');
    if (redirect) void this.router.navigate(['/login']);
  }

  private save(response: AuthResponse): void {
    sessionStorage.setItem('asset_auth_token', response.token);
    sessionStorage.setItem('asset_auth_user', JSON.stringify(response.user));
    this.startExpiryTimer();
  }

  private getTokenExpiry(): number | null {
    const token = this.token;
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch { return null; }
  }

  private startExpiryTimer(): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.expiryTimer = null;
    const expiresAt = this.getTokenExpiry();
    if (!expiresAt) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      this.logout(true);
      return;
    }
    this.expiryTimer = setTimeout(() => this.logout(true), remaining);
  }
}
