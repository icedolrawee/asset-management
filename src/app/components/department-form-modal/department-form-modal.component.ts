import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-department-form-modal', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-form-modal.component.html',
  styleUrl: './department-form-modal.component.css',
})
export class DepartmentFormModalComponent {
  @Input({ required: true }) departmentForm!: { code: string; name: string };
  @Input() savingDepartment = false;
  @Input() departmentFormError = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
}
