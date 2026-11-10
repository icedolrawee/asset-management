import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ProfileService, UserProfile } from '../../../services/profile.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly profileService = inject(ProfileService);
  profile: UserProfile | null = null;
  isProfileOpen = false;

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (response) => this.profile = response.data,
    });
  }

  get displayName(): string {
    return this.profile?.fullName || this.auth.user?.displayName || 'ผู้ใช้งาน';
  }

  get avatarInitial(): string {
    return this.displayName.trim().charAt(0) || 'U';
  }

  get avatarUrl(): string | null {
    return this.profile?.avatarUrl ? 'http://localhost:4000' + this.profile.avatarUrl : null;
  }

  toggleProfile(): void {
    this.isProfileOpen = !this.isProfileOpen;
  }

  openProfile(): void {
    this.isProfileOpen = false;
    void this.router.navigateByUrl('/profile');
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) this.isProfileOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.isProfileOpen = false;
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
