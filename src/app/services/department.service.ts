import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Department { id: number; code: string; name: string; isActive: boolean | number; }
export interface DepartmentUser { id: number; email: string; displayName: string; departmentIds: number[]; }

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:4000/api/departments';
  getDepartments(): Observable<{ success: boolean; data: Department[] }> {
    return this.http.get<{ success: boolean; data: Department[] }>(this.url);
  }
  createDepartment(payload: { code: string; name: string }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.url, payload);
  }
  updateDepartment(id: number, payload: { code: string; name: string; isActive: boolean }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(this.url + '/' + id, payload);
  }
  getUsers(): Observable<{ success: boolean; data: DepartmentUser[] }> {
    return this.http.get<{ success: boolean; data: DepartmentUser[] }>(this.url + '/users');
  }
  assignUserDepartments(id: number, departmentIds: number[]): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(this.url + '/users/' + id, { departmentIds });
  }
}
