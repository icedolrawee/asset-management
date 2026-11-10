import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  fullName: string;
  position: string;
  room: string;
  floor: string;
  department: string;
  avatarUrl?: string | null;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  data: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:4000/api/profile/me';

  getMyProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(this.url);
  }

  updateMyProfile(profile: UserProfile): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(this.url, profile);
  }

  uploadAvatar(file: File): Observable<{ success: boolean; message: string; data: { avatarUrl: string } }> {
    const body = new FormData();
    body.append('avatar', file);
    return this.http.post<{ success: boolean; message: string; data: { avatarUrl: string } }>('http://localhost:4000/api/profile/avatar', body);
  }
}
