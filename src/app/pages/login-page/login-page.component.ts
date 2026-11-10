import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-login-page', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './login-page.component.html', styleUrl: './login-page.component.css' })
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly mode = this.route.snapshot.routeConfig?.path === 'login/admin' ? 'admin' : this.route.snapshot.routeConfig?.path === 'login/user' ? 'user' : 'choose';
  email = this.mode === 'user' ? 'ice@gmail.com' : 'test-dev07@ru.ac.th';
  password = '';
  loading = false;
  errorMessage = '';
  loginAdmin(): void {
    this.errorMessage = '';
    if (!this.email.trim() || !this.password) { this.errorMessage = 'กรุณากรอกอีเมลและรหัสผ่าน'; return; }
    this.loading = true;
    this.auth.adminLogin(this.email, this.password).subscribe({
      next: () => { this.loading = false; void this.router.navigateByUrl('/'); },
      error: (error: HttpErrorResponse) => { this.loading = false; this.errorMessage = error.error?.message || 'เข้าสู่ระบบไม่สำเร็จ ตรวจสอบ Backend และ Authen365'; },
    });
  }
  loginUser(): void {
    this.errorMessage = '';
    if (!this.email.trim() || !this.password) { this.errorMessage = 'กรุณากรอกอีเมลและรหัสผ่านทดสอบ'; return; }
    this.loading = true;
    this.auth.simulateUserLogin(this.email, this.password).subscribe({
      next: () => { this.loading = false; void this.router.navigateByUrl('/'); },
      error: (error: HttpErrorResponse) => { this.loading = false; this.errorMessage = error.error?.message || 'เข้าสู่ระบบจำลองไม่สำเร็จ'; },
    });
  }
}
