import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AssetApiService, AssetRecord, CheckoutUser } from '../../services/asset-api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AssetFormModalComponent } from '../../components/asset-form-modal/asset-form-modal.component';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/layout/topbar/topbar.component';
import { Department, DepartmentService } from '../../services/department.service';
@Component({ selector: 'app-assets-page', standalone: true, imports: [CommonModule, FormsModule, AssetFormModalComponent, SidebarComponent, TopbarComponent], templateUrl: './assets-page.component.html', styleUrl: './assets-page.component.css' })
export class AssetsPageComponent implements OnInit {
  private readonly api = inject(AssetApiService);
  private readonly departmentApi = inject(DepartmentService);
  departments: Department[] = [];
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  logout(): void { this.auth.logout(); void this.router.navigateByUrl('/login'); }
  assets: AssetRecord[] = [];
  search = ''; selectedStatus = ''; loading = true; errorMessage = ''; total = 0;
  currentPage = 1;
  readonly pageSize = 5;
  totalPages = 1;
  showCreateForm = false; saving = false; successMessage = ''; formError = ''; selectedImage: File | null = null; editingAssetId: number | null = null;
  deletingAssetId: number | null = null;
  checkoutAssetId: number | null = null;
  checkoutSaving = false;
  checkoutError = '';
  checkoutUsers: CheckoutUser[] = [];
  checkoutUsersError = '';
  checkoutForm = { borrowerUserId: 0, assetNumber: '', location: '', room: '' };
  checkoutHistoryAsset: AssetRecord | null = null;
  checkoutHistory: Array<{ id: number; borrowerName: string; assetNumber: string; location: string; room: string; checkedOutAt: string; returnedAt: string | null; checkedOutBy: string }> = [];
  historyLoading = false;
  form = { itemName: '', serialNumber: '', assetNumber: '', departmentName: '', budgetYear: '', brand: '', model: '', location: '', room: '', notes: '' };
  ngOnInit(): void {
    this.loadAssets();
    this.departmentApi.getDepartments().subscribe({ next: r => this.departments = r.data || [], error: () => this.departments = [] });
    if (this.auth.isAdmin) {
      this.api.getCheckoutUsers().subscribe({
        next: (r) => {
          this.checkoutUsers = r.data ?? [];
          this.checkoutUsersError = this.checkoutUsers.length ? '' : 'ไม่พบบัญชี User ที่เปิดใช้งานในระบบ';
        },
        error: (e: HttpErrorResponse) => {
          this.checkoutUsers = [];
          this.checkoutUsersError = e.error?.message || 'โหลดรายชื่อบัญชีผู้ใช้งานไม่สำเร็จ';
        },
      });
    }
  }
  loadAssets(): void {
    this.loading = true; this.errorMessage = '';
    this.api.getAssets(this.search, this.selectedStatus, this.currentPage, this.pageSize).subscribe({
      next: (r) => {
        this.assets = r.data ?? [];
        this.total = r.pagination?.total ?? this.assets.length;
        this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
          this.loadAssets();
          return;
        }
        this.loading = false;
      },
      error: () => { this.assets = []; this.total = 0; this.totalPages = 1; this.loading = false; this.errorMessage = 'โหลดรายการครุภัณฑ์ไม่สำเร็จ กรุณาตรวจสอบว่า Backend ทำงานอยู่'; },
    });
  }
  searchAssets(): void { this.currentPage = 1; this.loadAssets(); }
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage || this.loading) return;
    this.currentPage = page;
    this.loadAssets();
  }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_value, index) => index + 1); }
  resetFilters(): void { this.search = ''; this.selectedStatus = ''; this.currentPage = 1; this.loadAssets(); }
  openCreateForm(): void { if (!this.auth.isAdmin) return; this.formError = ''; this.successMessage = ''; this.editingAssetId = null; this.selectedImage = null; this.form = { itemName: '', serialNumber: '', assetNumber: '', departmentName: '', budgetYear: '', brand: '', model: '', location: '', room: '', notes: '' }; this.showCreateForm = true; }
  openEditForm(asset: AssetRecord): void {
    if (!this.auth.isAdmin) return;
    this.formError = ''; this.successMessage = ''; this.editingAssetId = asset.id; this.selectedImage = null;
    this.form = { itemName: asset.itemName || '', serialNumber: asset.serialNumber || '', assetNumber: asset.assetNumber || '', departmentName: asset.departmentName || '', budgetYear: asset.budgetYear ? String(asset.budgetYear) : '', brand: asset.brand || '', model: asset.model || '', location: asset.location || '', room: asset.room || '', notes: asset.notes || '' };
    this.showCreateForm = true;
  }
  closeCreateForm(): void { if (!this.saving) { this.showCreateForm = false; this.formError = ''; } }
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement; const file = input.files?.[0] ?? null;
    if (file && (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      this.formError = 'กรุณาเลือกไฟล์ภาพ JPG, PNG, WEBP หรือ GIF ขนาดไม่เกิน 5 MB'; input.value = ''; this.selectedImage = null; return;
    }
    this.formError = ''; this.selectedImage = file;
  }
  saveAsset(): void {
    if (!this.auth.isAdmin) return;
    this.formError = ''; this.successMessage = '';
    if (!this.form.itemName.trim() || !this.form.assetNumber.trim()) { this.formError = 'กรุณากรอกรายการครุภัณฑ์และเลขครุภัณฑ์'; return; }
    this.saving = true;
    const budgetYearValue = String(this.form.budgetYear ?? '').trim();
    const payload = { ...this.form, budgetYear: budgetYearValue ? Number(budgetYearValue) : null, image: this.selectedImage };
    const request = this.editingAssetId === null
      ? this.api.createAsset(payload)
      : this.api.updateAsset(this.editingAssetId, payload);
    request.subscribe({
      next: (r) => {
        const expectedBudgetYear = payload.budgetYear;
        const savedBudgetYear = r.data?.budgetYear ?? null;
        if (expectedBudgetYear !== savedBudgetYear) {
          this.saving = false;
          this.formError = `ระบบตอบว่าบันทึกแล้ว แต่ตรวจพบปีงบประมาณในฐานข้อมูลไม่ตรงกัน (กรอก ${expectedBudgetYear ?? 'ไม่ระบุ'} / บันทึกได้ ${savedBudgetYear ?? 'ค่าว่าง'}) กรุณาตรวจสอบอีกครั้ง`;
          return;
        }
        this.saving = false; this.showCreateForm = false; this.editingAssetId = null;
        this.form = { itemName: '', serialNumber: '', assetNumber: '', departmentName: '', budgetYear: '', brand: '', model: '', location: '', room: '', notes: '' };
        this.selectedImage = null; this.successMessage = r.message; this.loadAssets();
      },
      error: (e: HttpErrorResponse) => { this.saving = false; this.formError = e.error?.message || 'บันทึกไม่สำเร็จ กรุณาตรวจสอบ Backend และฐานข้อมูล'; },
    });
  }
  openCheckout(asset: AssetRecord): void {
    if (!this.auth.isAdmin || asset.isCheckedOut || asset.status !== 'ใช้งาน') return;
    this.checkoutAssetId = asset.id;
    this.checkoutError = '';
    this.checkoutForm = { borrowerUserId: 0, assetNumber: '', location: '', room: '' };
  }
  closeCheckout(): void { if (!this.checkoutSaving) { this.checkoutAssetId = null; this.checkoutError = ''; } }
  saveCheckout(): void {
    if (!this.auth.isAdmin || this.checkoutAssetId === null || this.checkoutSaving) return;
    const { borrowerUserId, location, room } = this.checkoutForm;
    const selectedAsset = this.assets.find((asset) => asset.id === this.checkoutAssetId);
    const assetNumber = selectedAsset?.assetNumber?.trim() || '';
    if (!borrowerUserId || !assetNumber || !location.trim() || !room.trim()) {
      this.checkoutError = !assetNumber
        ? 'กรุณาเพิ่มเลขครุภัณฑ์ในข้อมูลครุภัณฑ์ก่อนทำรายการเบิก'
        : 'กรุณาเลือกบัญชีผู้ใช้งานและกรอกสถานที่กับห้องให้ครบถ้วน';
      return;
    }
    this.checkoutSaving = true; this.checkoutError = '';
    this.api.checkoutAsset(this.checkoutAssetId, { borrowerUserId, assetNumber, location: location.trim(), room: room.trim() }).subscribe({
      next: (r) => { this.checkoutSaving = false; this.checkoutAssetId = null; this.successMessage = r.message; this.loadAssets(); },
      error: (e: HttpErrorResponse) => { this.checkoutSaving = false; this.checkoutError = e.error?.message || 'บันทึกการเบิกไม่สำเร็จ'; },
    });
  }
  openCheckoutHistory(asset: AssetRecord): void {
    this.checkoutHistoryAsset = asset;
    this.checkoutHistory = [];
    this.historyLoading = true;
    this.api.getCheckoutHistory(asset.id).subscribe({
      next: (r) => { this.checkoutHistory = r.data ?? []; this.historyLoading = false; },
      error: () => { this.historyLoading = false; this.checkoutHistory = []; },
    });
  }
  closeCheckoutHistory(): void { this.checkoutHistoryAsset = null; this.checkoutHistory = []; }
  changeAssetStatus(asset: AssetRecord, status: AssetRecord['status']): void {
    if (!this.auth.isAdmin || asset.status === status) return;
    if (status === 'จำหน่าย' && !window.confirm('ยืนยันเปลี่ยนสถานะครุภัณฑ์รายการนี้เป็น “จำหน่าย” หรือไม่?')) {
      this.loadAssets();
      return;
    }
    const previousStatus = asset.status;
    asset.status = status;
    this.api.updateAssetStatus(asset.id, status).subscribe({
      next: (r) => { this.successMessage = r.message; this.loadAssets(); },
      error: (e: HttpErrorResponse) => {
        asset.status = previousStatus;
        this.formError = e.error?.message || 'เปลี่ยนสถานะครุภัณฑ์ไม่สำเร็จ';
        this.loadAssets();
      },
    });
  }
  deleteAsset(asset: AssetRecord): void {
    if (!this.auth.isAdmin || this.deletingAssetId !== null) return;
    const confirmed = window.confirm(`ยืนยันลบครุภัณฑ์ "${asset.itemName}" (เลขครุภัณฑ์: ${asset.assetNumber || '—'}) หรือไม่?`);
    if (!confirmed) return;

    this.deletingAssetId = asset.id;
    this.formError = '';
    this.successMessage = '';
    this.api.deleteAsset(asset.id).subscribe({
      next: (r) => {
        this.deletingAssetId = null;
        this.successMessage = r.message || 'ลบครุภัณฑ์เรียบร้อยแล้ว';
        this.loadAssets();
      },
      error: (e: HttpErrorResponse) => {
        this.deletingAssetId = null;
        this.formError = e.error?.message || 'ลบครุภัณฑ์ไม่สำเร็จ กรุณาตรวจสอบ Backend และฐานข้อมูล';
      },
    });
  }
  trackById(_index: number, asset: AssetRecord): number { return asset.id; }
}
