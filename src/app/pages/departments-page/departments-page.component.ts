import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Department, DepartmentService, DepartmentUser } from '../../services/department.service';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/layout/topbar/topbar.component';

@Component({
  selector: 'app-departments-page', standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './departments-page.component.html',
  styleUrl: './departments-page.component.css',
})
export class DepartmentsPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(DepartmentService);
  departments: Department[] = [];
  users: DepartmentUser[] = [];
  loading = true;
  saving = false;
  error = '';
  success = '';
  editingId: number | null = null;
  form = { code: '', name: '' };
  assignments: Record<number, number[]> = {};

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = '';
    this.api.getDepartments().subscribe({
      next: r => { this.departments = r.data || []; this.loading = false; },
      error: e => { this.error = e.error?.message || 'โหลดข้อมูลฝ่ายไม่สำเร็จ กรุณารัน SQL migration ก่อน'; this.loading = false; },
    });
    if (this.auth.isAdmin) this.api.getUsers().subscribe({
      next: r => { this.users = r.data || []; for (const user of this.users) this.assignments[user.id] = [...user.departmentIds]; },
      error: e => { this.error = e.error?.message || 'โหลดรายชื่อผู้ใช้งานไม่สำเร็จ'; },
    });
  }
  edit(department: Department): void { this.editingId = department.id; this.form = { code: department.code, name: department.name }; this.error = ''; }
  reset(): void { this.editingId = null; this.form = { code: '', name: '' }; this.error = ''; }
  save(): void {
    if (!this.auth.isAdmin || this.saving) return;
    if (!this.form.code.trim() || !this.form.name.trim()) { this.error = 'กรุณากรอกรหัสฝ่ายและชื่อฝ่าย'; return; }
    this.saving = true; this.error = '';
    const request = this.editingId === null ? this.api.createDepartment(this.form) : this.api.updateDepartment(this.editingId, { ...this.form, isActive: true });
    request.subscribe({
      next: r => { this.success = r.message; this.saving = false; this.reset(); this.load(); },
      error: e => { this.error = e.error?.message || 'บันทึกข้อมูลฝ่ายไม่สำเร็จ'; this.saving = false; },
    });
  }
  toggleActive(department: Department): void {
    if (!this.auth.isAdmin) return;
    this.api.updateDepartment(department.id, { code: department.code, name: department.name, isActive: !department.isActive }).subscribe({
      next: r => { this.success = r.message; this.load(); },
      error: e => { this.error = e.error?.message || 'เปลี่ยนสถานะฝ่ายไม่สำเร็จ'; },
    });
  }
  toggleAssignment(userId: number, departmentId: number, checked: boolean): void {
    const current = this.assignments[userId] || [];
    this.assignments[userId] = checked ? [...current, departmentId] : current.filter(id => id !== departmentId);
  }
  saveAssignments(user: DepartmentUser): void {
    this.api.assignUserDepartments(user.id, this.assignments[user.id] || []).subscribe({
      next: r => this.success = r.message,
      error: e => this.error = e.error?.message || 'บันทึกฝ่ายของผู้ใช้งานไม่สำเร็จ',
    });
  }
}
