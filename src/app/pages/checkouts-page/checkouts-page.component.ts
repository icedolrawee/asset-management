import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssetApiService, CheckoutRecord, CheckoutUser } from '../../services/asset-api.service';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/layout/topbar/topbar.component';

@Component({
  selector: 'app-checkouts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './checkouts-page.component.html',
  styleUrl: './checkouts-page.component.css',
})
export class CheckoutsPageComponent implements OnInit {
  private readonly api = inject(AssetApiService);
  private readonly auth = inject(AuthService);
  checkouts: CheckoutRecord[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  editingCheckout: CheckoutRecord | null = null;
  saving = false;
  cancellingCheckoutId: number | null = null;
  editError = '';
  checkoutUsers: CheckoutUser[] = [];
  editForm = { borrowerUserId: 0, location: '', room: '' };

  get isAdmin(): boolean { return this.auth.isAdmin; }

  ngOnInit(): void {
    this.loadCheckouts();
    if (this.isAdmin) {
      this.api.getCheckoutUsers().subscribe({
        next: (response) => { this.checkoutUsers = response.data ?? []; },
        error: () => { this.checkoutUsers = []; },
      });
    }
  }

  loadCheckouts(): void {
    this.loading = true;
    this.api.getCheckouts().subscribe({
      next: (response) => { this.checkouts = response.data ?? []; this.loading = false; },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        const apiMessage = typeof error.error?.message === 'string' ? error.error.message : '';
        if (error.status === 401) this.errorMessage = apiMessage || 'Session ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่';
        else if (error.status === 403) this.errorMessage = apiMessage || 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงรายการเบิกครุภัณฑ์';
        else if (error.status === 0) this.errorMessage = 'เชื่อมต่อ Backend ไม่ได้ กรุณาตรวจสอบว่า Backend ทำงานอยู่ที่ http://localhost:4000';
        else this.errorMessage = apiMessage || `โหลดรายการเบิกครุภัณฑ์ไม่สำเร็จ (HTTP ${error.status})`;
      },
    });
  }

  changeAssetStatus(record: CheckoutRecord, status: CheckoutRecord['status']): void {
    if (!this.isAdmin || record.status === status) return;
    if (status === 'จำหน่าย' && !window.confirm('คุณต้องการเปลี่ยนสถานะครุภัณฑ์ชิ้นนี้เป็น "จำหน่าย" ใช่หรือไม่?')) {
      this.loadCheckouts();
      return;
    }
    const previousStatus = record.status;
    record.status = status;
    this.api.updateAssetStatus(record.assetId, status).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'อัปเดตสถานะครุภัณฑ์เรียบร้อยแล้ว';
        this.loadCheckouts();
      },
      error: (error: HttpErrorResponse) => {
        record.status = previousStatus;
        this.errorMessage = typeof error.error?.message === 'string' ? error.error.message : 'เปลี่ยนสถานะไม่สำเร็จ กรุณาลองอีกครั้ง';
        this.loadCheckouts();
      },
    });
  }

  cancelCheckout(record: CheckoutRecord): void {
    if (!this.isAdmin || this.cancellingCheckoutId !== null) return;
    const confirmed = window.confirm(`ยืนยันยกเลิกการเบิกครุภัณฑ์ “${record.itemName}” ใช่หรือไม่?\n\nรายการนี้จะถูกลบออกจากรายการเบิก และครุภัณฑ์จะกลับมาเบิกได้อีกครั้ง`);
    if (!confirmed) return;
    this.cancellingCheckoutId = record.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.cancelCheckout(record.id).subscribe({
      next: (response) => {
        this.cancellingCheckoutId = null;
        this.successMessage = response.message || 'ยกเลิกการเบิกครุภัณฑ์เรียบร้อยแล้ว';
        this.loadCheckouts();
      },
      error: (error: HttpErrorResponse) => {
        this.cancellingCheckoutId = null;
        this.errorMessage = typeof error.error?.message === 'string' ? error.error.message : 'ยกเลิกการเบิกไม่สำเร็จ กรุณาลองอีกครั้ง';
      },
    });
  }

  openEdit(record: CheckoutRecord): void {
    if (!this.isAdmin) return;
    this.editingCheckout = record;
    this.editForm = { borrowerUserId: record.borrowerUserId ?? 0, location: record.location, room: record.room };
    this.editError = '';
    this.successMessage = '';
  }

  closeEdit(): void {
    if (!this.saving) { this.editingCheckout = null; this.editError = ''; }
  }

  saveEdit(): void {
    if (!this.editingCheckout || !this.isAdmin || this.saving) return;
    const payload = {
      borrowerUserId: this.editForm.borrowerUserId,
      location: this.editForm.location.trim(),
      room: this.editForm.room.trim(),
    };
    if (!payload.borrowerUserId || !payload.location || !payload.room) { this.editError = 'กรุณาเลือกบัญชีผู้ใช้งานและกรอกสถานที่กับห้องให้ครบทุกช่อง'; return; }
    this.saving = true;
    this.editError = '';
    this.api.updateCheckout(this.editingCheckout.id, payload).subscribe({
      next: (response) => {
        this.saving = false;
        this.editingCheckout = null;
        this.successMessage = response.message || 'บันทึกการแก้ไขรายการเบิกเรียบร้อยแล้ว';
        this.loadCheckouts();
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.editError = typeof error.error?.message === 'string' ? error.error.message : 'บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง';
      },
    });
  }
}
