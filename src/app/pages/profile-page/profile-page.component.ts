import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService, UserProfile } from '../../services/profile.service';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/layout/topbar/topbar.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  profile: UserProfile | null = null;
  originalProfile: UserProfile | null = null;
  isEditing = false;
  isLoading = true;
  isSaving = false;
  isUploadingAvatar = false;
  private avatarPreviewUrl: string | null = null;
  private avatarVersion = 0;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void { this.loadProfile(); }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.profileService.getMyProfile().subscribe({
      next: (response) => {
        this.profile = { ...response.data };
        this.originalProfile = { ...response.data };
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ';
        this.isLoading = false;
      },
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.errorMessage = 'กรุณาเลือกไฟล์ JPG, PNG หรือ WEBP';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB';
      input.value = '';
      return;
    }
    if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
    this.avatarPreviewUrl = URL.createObjectURL(file);
    this.isUploadingAvatar = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.profileService.uploadAvatar(file).subscribe({
      next: (response) => {
        if (this.profile) this.profile.avatarUrl = response.data.avatarUrl;
        if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
        this.avatarPreviewUrl = null;
        this.avatarVersion = Date.now();
        this.isUploadingAvatar = false;
        this.successMessage = response.message || 'เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว';
        input.value = '';
      },
      error: (error) => {
        if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
        this.avatarPreviewUrl = null;
        this.isUploadingAvatar = false;
        this.errorMessage = error.error?.message || 'อัปโหลดรูปโปรไฟล์ไม่สำเร็จ';
        input.value = '';
      },
    });
  }

  get avatarUrl(): string | null {
    if (this.avatarPreviewUrl) return this.avatarPreviewUrl;
    return this.profile?.avatarUrl
      ? `http://localhost:4000${this.profile.avatarUrl}${this.profile.avatarUrl.includes('?') ? '&' : '?'}v=${this.avatarVersion}`
      : null;
  }

  startEditing(): void {
    if (!this.profile) return;
    this.originalProfile = { ...this.profile };
    this.successMessage = '';
    this.errorMessage = '';
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.profile = this.originalProfile ? { ...this.originalProfile } : null;
    this.isEditing = false;
    this.errorMessage = '';
  }

  saveProfile(): void {
    if (!this.profile || this.isSaving) return;
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.profileService.updateMyProfile(this.profile).subscribe({
      next: (response) => {
        this.profile = { ...response.data };
        this.originalProfile = { ...response.data };
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = response.message || 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว';
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error.error?.message || 'บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ';
      },
    });
  }
}
